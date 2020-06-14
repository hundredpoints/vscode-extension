import { ExtensionContext } from "vscode";

import { authenticate } from "./features/authentication";

class Hundredpoints {
  static current: Hundredpoints | undefined;

  private context: ExtensionContext;
  private accessToken: string | undefined;
  private nextAuthenticateRefresh: NodeJS.Timeout | undefined;

  static create(context: ExtensionContext): void {
    Hundredpoints.current = new Hundredpoints(context);
    Hundredpoints.current.activate();
  }

  private constructor(context: ExtensionContext) {
    this.context = context;
  }

  public activate(): void {
    this.authenticate();
  }

  public deactivate(): void {
    if (this.nextAuthenticateRefresh) {
      clearTimeout(this.nextAuthenticateRefresh);
    }
  }

  public async authenticate(): Promise<void> {
    const response = await authenticate();

    // User cancelled or something went wrong...
    if (!response) {
      return;
    }

    this.accessToken = response.accessToken;

    this.nextAuthenticateRefresh = setTimeout(() => {
      this.authenticate();
    }, (response.expiresIn / 2) * 1000);
  }
}

export function activate(context: ExtensionContext): void {
  Hundredpoints.create(context);
}

export function deactivate(): void {
  Hundredpoints.current?.deactivate();
}
