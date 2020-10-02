import vscode from "vscode";

import { getCredentials } from "./store";
import unauthenticatedFlow from "./unauthenticated-flow";

export default async function authenticate(): Promise<string | void> {
  try {
    const credentials = await getCredentials();

    if (!credentials) {
      return unauthenticatedFlow();
    }

    throw new Error("not implemented");
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage("Error when logging into account");
  }
}
