import vscode, { Uri } from "vscode";
import { setPassword, findCredentials } from "keytar";

import {
  requestDeviceCode,
  pollForToken,
  refreshAuthentication,
} from "./auth0";

const SIGN_IN = "Sign in";
const SIGN_IN_WITH_CODE = "Understood";
const SERVICE = "hundredpoints/vscode";

function getProfileFromIdToken(idToken: string): { sub: string; name: string } {
  return JSON.parse(Buffer.from(idToken.split(".")[1], "base64").toString());
}

async function promptUnauthenticatedUser(): Promise<void> {
  const maybeSignIn = await vscode.window.showInformationMessage(
    "You are not signed into hundredpoints",
    SIGN_IN
  );

  if (maybeSignIn !== SIGN_IN) {
    return;
  }

  const {
    verificationUriComplete,
    deviceCode,
    interval,
    userCode,
  } = await requestDeviceCode();

  const maybeSignInWithCode = await vscode.window.showInformationMessage(
    `You will now be directed to login page. Please ensure the code on the page matches ${userCode}.`,
    SIGN_IN_WITH_CODE
  );

  if (!maybeSignInWithCode) {
    return;
  }

  const maybeOpen = await vscode.env.openExternal(
    Uri.parse(verificationUriComplete)
  );

  if (!maybeOpen) {
    await vscode.window.showErrorMessage(
      `Unable to open browser, please visit ${verificationUriComplete} to complete login. Your device code is ${userCode}`,
      "Try again"
    );
  }

  vscode.window.withProgress(
    {
      cancellable: true,
      title: `Signing in to hundredpoints with code ${userCode}`,
      location: 15,
    },
    async (progress, token) => {
      try {
        const response = await pollForToken(deviceCode, interval, token);

        if (!response) {
          return console.log("User cancelled login");
        }

        const profile = getProfileFromIdToken(response.idToken);
        await setPassword(SERVICE, profile.sub, response.refreshToken);

        vscode.window.showInformationMessage(`Logged in as ${profile.name}`);
      } catch (error) {
        vscode.window.showErrorMessage(error.message);
      }
    }
  );
}

export async function authenticate(): Promise<void> {
  try {
    const [credentials] = await findCredentials(SERVICE);

    if (!credentials) {
      return promptUnauthenticatedUser();
    }

    const { account, password: refreshToken } = credentials;

    console.log(`Found account ${account}, attempting refresh`);

    const response = await refreshAuthentication(refreshToken);
    const profile = getProfileFromIdToken(response.idToken);
    await setPassword(SERVICE, profile.sub, response.refreshToken);

    console.log(`Successfully logged in as ${profile.sub}`);
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage("Error when logging into account");
  }
}
