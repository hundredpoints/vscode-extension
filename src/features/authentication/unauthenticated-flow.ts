import vscode, { Uri } from "vscode";
import getMe from "./get-me";

import { pollForToken } from "./poll-for-token";
import requestDeviceCode from "./request-device-code";
import { saveCredentials } from "./store";

const SIGN_IN = "Sign in";

export default async function unauthenticatedFlow(): Promise<
  string | undefined
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

  console.log({
    code,
    interval,
    verificationUri,
    tokenUri,
  });

  const maybeOpen = await vscode.env.openExternal(Uri.parse(verificationUri));

  if (!maybeOpen) {
    return vscode.window.showErrorMessage(
      `An error occurred with the sign-in process`
    );
  }

  return vscode.window.withProgress(
    {
      cancellable: true,
      title: `Waiting for authorization`,
      location: 15,
    },
    async (_, cancellationToken) => {
      try {
        const response = await pollForToken(
          cancellationToken,
          tokenUri,
          code,
          interval
        );

        if (typeof response !== "string") {
          console.log(response.error);
          return;
        }

        const me = await getMe(response);
        console.log("me", me);

        await saveCredentials(me.id, response);

        console.log(`Successfully logged in`);
        vscode.window.showInformationMessage(`Successfully logged in`);

        return response;
      } catch (error) {
        vscode.window.showErrorMessage(error.message);
        throw error;
      }
    }
  );
}
