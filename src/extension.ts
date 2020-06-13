import { ExtensionContext } from "vscode";

import { authenticate } from "./features/authentication";

class Hundredpoints {
  static current: Hundredpoints | undefined;

  private context: ExtensionContext;

  static create(context: ExtensionContext): void {
    Hundredpoints.current = new Hundredpoints(context);
    Hundredpoints.current.activate();
  }

  private constructor(context: ExtensionContext) {
    this.context = context;
  }

  public activate(): void {
    authenticate();
  }

  public deactivate(): void {
    return;
  }
}

export function activate(context: ExtensionContext): void {
  Hundredpoints.create(context);
}

export function deactivate(): void {
  Hundredpoints.current?.deactivate();
}
