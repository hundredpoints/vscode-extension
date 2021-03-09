import vscode, {
  CancellationToken,
  Progress,
  ProgressLocation,
  Uri,
} from "vscode";
import getClient from "@hundredpoints/cli";

import { saveCredentials } from "./store";
import { Session } from ".";
import config from "../../config";
import createLogger from "../../logger";

const GET_ACCESS_TOKEN = "Get access token";
const ENTER_ACCESS_TOKEN = "Enter access token";

const { HUNDREDPOINTS_ORIGIN, HUNDREDPOINTS_API } = config;

const scope = "visual-studio-code";

const logger = createLogger("Authentication");

export default async function unauthenticatedFlow(): Promise<
  Session | undefined
> {
  const maybeSignIn = await vscode.window.showInformationMessage(
    "No access token found for HundredPoints.",
    GET_ACCESS_TOKEN,
    ENTER_ACCESS_TOKEN
  );

  if (!maybeSignIn) {
    logger.log("User canceled authentication");
    return;
  }

  return vscode.window.withProgress<Session | undefined>(
    {
      location: ProgressLocation.Notification,
      title: "HundredPoints",
      cancellable: true,
    },
    async (progress, cancellationToken): Promise<Session | undefined> => {
      cancellationToken.onCancellationRequested(() => {
        logger.log("User cancelled authentication");
      });

      if (maybeSignIn === GET_ACCESS_TOKEN) {
        logger.log("Opening browser for new access token");
        progress.report({
          message:
            "Opening your browser, please follow the instructions and then return to VS Code",
        });
        await vscode.env.openExternal(
          Uri.parse(`${HUNDREDPOINTS_ORIGIN}/integrations/auth/${scope}`)
        );
      } else {
        progress.report({
          message: "Enter your access token",
        });
      }

      const session = await waitForInput(progress, cancellationToken);

      if (!session) {
        return;
      }

      logger.log(`Successfully authenticated as ${session.profile.name}`);

      progress.report({
        increment: 30,
        message: "Successfully authenticated, saving credentials",
      });

      try {
        await saveCredentials(
          config.HUNDREDPOINTS_ORIGIN,
          session.profile.id,
          session.token
        );

        logger.log(`Successfully saved credentials`);

        progress.report({
          increment: 30,
          message: `Successfully authenticated as ${session.profile.name}`,
        });

        vscode.window.showInformationMessage(
          "HundredPoints: Successfully authenticated."
        );

        return session;
      } catch (error) {
        logger.error(error);
        vscode.window.showErrorMessage(error.response.errors[0].message);
        return;
      }
    }
  );
}

async function waitForInput(
  progress: Progress<{ message?: string; increment?: number }>,
  cancellationToken: CancellationToken
): Promise<Session | undefined> {
  logger.log("Waiting for user to enter access token");
  const accessToken = await vscode.window.showInputBox(
    {
      prompt: "Enter your HundredPoints access token here.",
      ignoreFocusOut: true,
      password: true,
    },
    cancellationToken
  );

  if (!accessToken) {
    logger.log("No access token was entered, aborting");
    return;
  }

  try {
    logger.log("Validating access token");
    progress.report({ increment: 30, message: "Validating" });

    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64").toString("utf8")
    );

    const scopes: string[] = payload.scopes || [];

    if (!scopes.includes(scope)) {
      logger.log(`Token does not have the scope '${scope}'`);
      return;
    }
    const client = getClient({
      token: accessToken,
      url: HUNDREDPOINTS_API,
    });

    await client.completeInstallationSetup();
    const { me } = await client.me();

    return {
      token: accessToken,
      user: me,
      profile: me.profile,
    };
  } catch (error) {
    if (cancellationToken.isCancellationRequested) {
      // It was cancelled so just ignore the error and continue
      return;
    }

    progress.report({ message: "Invalid access token" });
    return waitForInput(progress, cancellationToken);
  }
}
