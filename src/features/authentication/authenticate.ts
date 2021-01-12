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

export interface AuthenticateOptions {
  showInitialPrompt?: boolean;
}

export default async function authenticate({
  showInitialPrompt = true,
}: AuthenticateOptions = {}): Promise<Session | undefined> {
  try {
    const credentials = await getCredentials();

    if (credentials.length === 0) {
      return unauthenticatedFlow(showInitialPrompt);
    }

    const loginTests = await Promise.all(
      credentials.map(({ token }) => {
        return getMe(token).then(
          ({ data: { me } }) => {
            return {
              token,
              user: me,
              profile: me.profile,
            };
          },
          (error) => {
            return {
              error,
            };
          }
        );
      })
    );

    const validCredentials = loginTests.filter((test): test is Session => {
      return !("error" in test);
    });

    return validCredentials[0];
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage("Error when logging into account");
  }
}
