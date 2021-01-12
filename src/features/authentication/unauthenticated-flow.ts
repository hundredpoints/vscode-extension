import vscode, { Uri } from "vscode";
import { Session } from "./authenticate";
import getMe from "./get-me";

import { saveCredentials } from "./store";

const GET_ACCESS_TOKEN = "Get access token";
const ENTER_ACCESS_TOKEN = "Enter access token";

export default async function unauthenticatedFlow(
  showInitialPrompt = true
): Promise<Session | undefined> {
  if (showInitialPrompt) {
    const maybeSignIn = await vscode.window.showInformationMessage(
      "No access token found for HundredPoints.",
      GET_ACCESS_TOKEN,
      ENTER_ACCESS_TOKEN
    );

    if (maybeSignIn === GET_ACCESS_TOKEN) {
      await vscode.env.openExternal(
        Uri.parse("http://localhost:3000/integrations/access-tokens")
      );
    }
  }

  const accessToken = await vscode.window.showInputBox({
    prompt: "Enter your HundredPoints access-token here.",
  });

  if (!accessToken) {
    return;
  }

  try {
    const {
      data: { me },
    } = await getMe(accessToken);
    console.log("Saving credentials");

    await saveCredentials(me.profile.id, accessToken);

    console.log(`Successfully authenticated`);
    vscode.window.showInformationMessage(
      `Successfully authenticated as ${me.profile.name}`
    );

    return {
      token: accessToken,
      user: me,
      profile: me.profile,
    };
  } catch (error) {
    vscode.window.showErrorMessage(error.message);
    throw error;
  }
}
