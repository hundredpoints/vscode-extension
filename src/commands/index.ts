import { commands } from "vscode";

import { Hundredpoints } from "src/extension";

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

  registerCommand("vscode-hundredpoints.api.login", () =>
    extension.authenticate()
  );
}
