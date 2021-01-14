import vscode from "vscode";
import { me as getMe } from "@hundredpoints/cli";

import { Session } from ".";

import { deleteCredential, getCredentials } from "./store";
import unauthenticatedFlow from "./unauthenticated-flow";
import output from "../../output";

export default async function authenticate(): Promise<Session | undefined> {
  try {
    const credentialArray = await getCredentials();

    output.appendLine(`Found ${credentialArray.length} sets of credentials`);

    if (credentialArray.length === 0) {
      return unauthenticatedFlow();
    }

    const credentialTests = await Promise.all(
      credentialArray.map(async ({ token, account }) => {
        try {
          const me = await getMe({ token });
          const session: Session = {
            token,
            user: me,
            profile: me.profile,
          };
          return session;
        } catch (error) {
          console.log(error);
          deleteCredential(account);
          return;
        }
      })
    );

    // Return the first valid set of credentials, or undefined
    const credentials = credentialTests.find(Boolean);

    if (!credentials) {
      output.appendLine(`Unable to find valid credentials`);
      return unauthenticatedFlow();
    }

    output.appendLine(`Authenticated as ${credentials.profile.name}`);
    return credentials;
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage("Error when logging into account");
  }
}
