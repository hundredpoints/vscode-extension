import vscode, { ProgressLocation, Uri } from "vscode";
import getClient from "@hundredpoints/cli";

import { saveCredentials } from "./store";
import { Session } from ".";
import config from "../../config";
import output from "../../output";

const GET_ACCESS_TOKEN = "Get access token";
const ENTER_ACCESS_TOKEN = "Enter access token";

const { HUNDREDPOINTS_ORIGIN } = config;

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
        await vscode.env.openExternal(
          Uri.parse(
            `${HUNDREDPOINTS_ORIGIN}/integrations/auth/visual-studio-code`
          )
        );
      }

      const accessToken = await vscode.window.showInputBox(
        {
          prompt: "Enter your HundredPoints access token here.",
          ignoreFocusOut: true,
        },
        cancellationToken
      );

      if (!accessToken) {
        return;
      }

      try {
        progress.report({ increment: 30, message: "Validating" });

        const { me } = await getClient({
          token: accessToken,
          url: HUNDREDPOINTS_ORIGIN,
        }).me();

        if (cancellationToken.isCancellationRequested) {
          return;
        }

        progress.report({
          increment: 30,
          message: "Successfully authenticated",
        });

        await saveCredentials(me.profile.id, accessToken);

        progress.report({
          increment: 30,
          message: `Successfully authenticated as ${me.profile.name}`,
        });

        return {
          token: accessToken,
          user: me,
          profile: me.profile,
        };
      } catch (error) {
        output.appendLine(
          `Authentication error: ${error.response.errors[0].message}`
        );
        vscode.window.showErrorMessage(error.response.errors[0].message);
        return;
      }
    }
  );
}
