import vscode from "vscode";
import getClient from "@hundredpoints/cli";

import { Session } from ".";

import { deleteCredential, getCredentials } from "./store";
import unauthenticatedFlow from "./unauthenticated-flow";
import createLogger from "../../logger";
import config from "../../config";

const logger = createLogger("Authentication");

export default async function authenticate(): Promise<Session | undefined> {
  try {
    logger.log(
      `Starting authentication for origin ${config.HUNDREDPOINTS_ORIGIN}`
    );
    const credentialArray = await getCredentials(config.HUNDREDPOINTS_ORIGIN);

    logger.log(`Found ${credentialArray.length} sets of credentials`);

    if (credentialArray.length === 0) {
      logger.log(`Starting unauthenticatedFlow`);
      return unauthenticatedFlow();
    }

    const credentialTests = await Promise.all(
      credentialArray.map(async ({ account, token }) => {
        if (!token) {
          return;
        }

        try {
          const { me } = await getClient({
            token,
            url: config.HUNDREDPOINTS_API,
          }).me();

          const session: Session = {
            token,
            user: me,
            profile: me.profile,
          };
          return session;
        } catch (error) {
          logger.error(account, error);
          deleteCredential(config.HUNDREDPOINTS_ORIGIN, account);
          return;
        }
      })
    );

    // Return the first valid set of credentials, or undefined
    const credentials = credentialTests.find(Boolean);

    if (!credentials) {
      logger.log(`Unable to find valid credentials`);
      return unauthenticatedFlow();
    }

    logger.log(`Authenticated as ${credentials.profile.name}`);
    return credentials;
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage("Error when logging into account");
  }
}
