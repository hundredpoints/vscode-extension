import vscode from "vscode";
import getMe from "./get-me";

import { getCredentials } from "./store";
import unauthenticatedFlow from "./unauthenticated-flow";

export interface Session {
  token: string;
  user: {
    id: string;
  };
  profile: {
    id: string;
    name: string;
  };
}

export default async function authenticate(): Promise<Session | undefined> {
  try {
    const credentials = await getCredentials();

    if (!credentials) {
      return unauthenticatedFlow();
    }

    const { token } = credentials;

    return getMe(token).then(
      ({ data: { me } }): Session => {
        return {
          token,
          user: me,
          profile: me.profile,
        };
      },
      (error): undefined => {
        console.error(error);
        vscode.window.showErrorMessage("You have been signed out.");
        return;
      }
    );
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage("Error when logging into account");
  }
}
