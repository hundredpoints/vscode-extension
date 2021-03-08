import vscode, { ProgressLocation, Uri } from "vscode";
import getClient from "@hundredpoints/cli";

import { saveCredentials } from "./store";
import { Session } from ".";
import config from "../../config";
import output from "../../output";

const GET_ACCESS_TOKEN = "Get access token";
const ENTER_ACCESS_TOKEN = "Enter access token";

const { HUNDREDPOINTS_ORIGIN, HUNDREDPOINTS_API } = config;

const scope = "visual-studio-code";

export default async function unauthenticatedFlow(): Promise<
  Session | undefined
> {
  const maybeSignIn = await vscode.window.showInformationMessage(
    "No access token found for HundredPoints.",
    GET_ACCESS_TOKEN,
    ENTER_ACCESS_TOKEN
  );

  if (!maybeSignIn) {
    output.appendLine("User canceled authentication");
    return;
  }

  return vscode.window.withProgress<Session | undefined>(
    {
      location: ProgressLocation.Notification,
      title:
        "Opening your browser, please follow the instructions and then return to VS Code",
      cancellable: true,
    },
    async (progress, cancellationToken): Promise<Session | undefined> => {
      cancellationToken.onCancellationRequested(() => {
        output.appendLine("User cancelled authentication");
      });

      if (maybeSignIn === GET_ACCESS_TOKEN) {
        output.appendLine("Opening browser for new access token");
        await vscode.env.openExternal(
          Uri.parse(`${HUNDREDPOINTS_ORIGIN}/integrations/auth/${scope}`)
        );
      }

      output.appendLine("Waiting for user to enter access token");
      const accessToken = await vscode.window.showInputBox(
        {
          prompt: "Enter your HundredPoints access token here.",
          ignoreFocusOut: true,
          password: true,
        },
        cancellationToken
      );

      if (!accessToken) {
        output.appendLine("No access token was entered, aborting");
        return;
      }

      try {
        output.appendLine("Validating access token");
        progress.report({ increment: 30, message: "Validating" });

        const payload = JSON.parse(
          Buffer.from(accessToken.split(".")[1], "base64").toString("utf8")
        );

        console.log(payload);

        const scopes: string[] = payload.scopes || [];

        if (!scopes.includes(scope)) {
          output.appendLine(`Token does not have the scope '${scope}'`);
          return;
        }
        const client = getClient({
          token: accessToken,
          url: HUNDREDPOINTS_API,
        });

        await client.completeInstallationSetup();
        const { me } = await client.me();

        if (cancellationToken.isCancellationRequested) {
          output.appendLine("User cancelled authentication, aborting");
          return;
        }

        if (cancellationToken.isCancellationRequested) {
          output.appendLine("User cancelled authentication, aborting");
          return;
        }

        output.appendLine(`Successfully authenticated as ${me.profile.name}`);

        progress.report({
          increment: 30,
          message: "Successfully authenticated, saving credentials",
        });

        await saveCredentials(
          config.HUNDREDPOINTS_ORIGIN,
          me.profile.id,
          accessToken
        );

        output.appendLine(`Successfully saved credentials`);

        progress.report({
          increment: 30,
          message: `Successfully authenticated as ${me.profile.name}`,
        });

        vscode.window.showInformationMessage(
          "HundredPoints: Successfully authenticated."
        );

        return {
          token: accessToken,
          user: me,
          profile: me.profile,
        };
      } catch (error) {
        output.appendLine(error);

        output.appendLine(
          `Authentication error: ${error.response.errors[0].message}`
        );
        vscode.window.showErrorMessage(error.response.errors[0].message);
        return;
      }
    }
  );
}
