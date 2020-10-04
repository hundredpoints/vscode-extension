import vscode, { Uri } from "vscode";
import { Session } from "./authenticate";
import getMe from "./get-me";

import { pollForToken } from "./poll-for-token";
import requestDeviceCode from "./request-device-code";
import { saveCredentials } from "./store";

const SIGN_IN = "Sign in";

export default async function unauthenticatedFlow(): Promise<
  Session | undefined
> {
  const maybeSignIn = await vscode.window.showInformationMessage(
    "You are not signed into HundredPoints",
    SIGN_IN
  );

  if (maybeSignIn !== SIGN_IN) {
    return;
  }

  const {
    code,
    interval,
    verificationUri,
    tokenUri,
  } = await requestDeviceCode();

  const maybeOpen = await vscode.env.openExternal(Uri.parse(verificationUri));

  if (!maybeOpen) {
    vscode.window.showErrorMessage(
      `An error occurred with the sign-in process`
    );
    return;
  }

  return vscode.window.withProgress(
    {
      cancellable: true,
      title: `Waiting for authorization, please accept from your browser.`,
      location: 15,
    },
    async (_, cancellationToken) => {
      try {
        const token = await pollForToken(
          cancellationToken,
          tokenUri,
          code,
          interval
        );

        if (typeof token !== "string") {
          console.log(token);
          return;
        }

        const {
          data: { me },
        } = await getMe(token);
        console.log("Saving credentials");
        await saveCredentials(me.id, token);

        console.log(`Successfully authenticated`);
        vscode.window.showInformationMessage(
          `Successfully authenticated as ${me.profile.name}`
        );

        return {
          token,
          user: me,
          profile: me.profile,
        };
      } catch (error) {
        vscode.window.showErrorMessage(error.message);
        throw error;
      }
    }
  );
}
