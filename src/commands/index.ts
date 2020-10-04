import { commands } from "vscode";

import { Hundredpoints } from "src/extension";
import { deleteAllCredentials } from "../features/authentication/store";

export function registerCommands(extension: Hundredpoints): void {
  const context = extension.getContext();

  function registerCommand(
    command: string,
    commandHandler: (...args: unknown[]) => unknown
  ): void {
    context.subscriptions.push(
      commands.registerCommand(command, commandHandler)
    );
  }

  registerCommand("hundredpoints.login", () => extension.authenticate());
  registerCommand("hundredpoints.logout", () => extension.logout());

  registerCommand("hundredpoints.clearCredentials", () =>
    deleteAllCredentials()
  );
}
