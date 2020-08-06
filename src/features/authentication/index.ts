import vscode, { Uri } from "vscode";
import { setPassword, findCredentials } from "keytar";
import fetch from "node-fetch";

import {
  requestDeviceCode,
  pollForToken,
  refreshAuthentication,
} from "./auth0";
import {
  AuthenticateResponse,
  RefreshResponse,
  VerifyTokenResponse,
} from "./types";

const SIGN_IN = "Sign in";
const SIGN_IN_WITH_CODE = "Understood";
const SERVICE = "hundredpoints/vscode";

function getUserFromIdToken(idToken: string): { sub: string; name: string } {
  return JSON.parse(Buffer.from(idToken.split(".")[1], "base64").toString());
}

async function verifyToken(accessToken: string): Promise<VerifyTokenResponse> {
  const response = await fetch("http://localhost:3000/api/verify-token", {
    headers: {
      authorization: `Bearer: ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

async function promptUnauthenticatedUser(): Promise<
  RefreshResponse | undefined
> {
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

  return vscode.window.withProgress(
    {
      cancellable: true,
      title: `Signing in to hundredpoints with code ${userCode}`,
      location: 15,
    },
    async (progress, token) => {
      try {
        const response = await pollForToken(deviceCode, interval, token);

        if (!response) {
          console.log("User cancelled login");
          return;
        }

        return response;
      } catch (error) {
        vscode.window.showErrorMessage(error.message);
        throw error;
      }
    }
  );
}

export async function authenticate(): Promise<AuthenticateResponse | void> {
  try {
    const [credentials] = await findCredentials(SERVICE);

    let response;
    let shouldShowUserSuccessMessage = false;

    /**
     * Attempt to login with credentials
     */
    if (credentials) {
      const { account, password: refreshToken } = credentials;
      console.log(`Found account ${account}, attempting refresh`);
      response = await refreshAuthentication(refreshToken);
    }

    /**
     * Either there were no credentials, or they failed to login
     */
    if (!response) {
      response = await promptUnauthenticatedUser();
      shouldShowUserSuccessMessage = true;
    }

    /**
     * User cancelled the login process
     */
    if (!response) {
      return;
    }

    const { accessToken, idToken, refreshToken } = response;

    try {
      const verifyResponse = await verifyToken(accessToken);
      console.log(verifyResponse);

      const { sub, name } = getUserFromIdToken(idToken);
      await setPassword(SERVICE, sub, refreshToken);

      console.log(`Successfully logged in as sub:${sub} name:${name}`);
      if (shouldShowUserSuccessMessage) {
        vscode.window.showInformationMessage(
          `Successfully logged in as ${name}`
        );
      }
      return { ...response, ...verifyResponse };
    } catch (error) {
      console.error(error);
      vscode.window.showErrorMessage(`Error validating token`);
      return;
    }
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage("Error when logging into account");
  }
}
