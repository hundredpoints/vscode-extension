import { commands, ExtensionContext } from "vscode";

import login from "./api/login";

export function registerCommands(context: ExtensionContext): void {
  function registerCommand(
    command: string,
    commandHandler: (...args: unknown[]) => unknown
  ): void {
    context.subscriptions.push(
      commands.registerCommand(command, commandHandler)
    );
  }

  registerCommand("vscode-hundredpoints.api.login", login);
}
