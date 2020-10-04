import vscode, { ExtensionContext } from "vscode";

import fetch from "node-fetch";
import authenticate from "./features/authentication";

import { registerCommands } from "./commands";

/** Features */
import TimesheetExtension from "./features/timesheet";

/**
 * Singleton Class for the HundredPoints Extension
 */
export class Hundredpoints {
  private context: ExtensionContext;
  private timesheet: TimesheetExtension;

  private accessToken: string | undefined;
  private profile: { name: string } | undefined;

  private statusBar: vscode.StatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );

  /**
   * Factory function to ensure that this class is a singleton
   *
   * @param context -- The VSCode Extension context
   */
  static create(context: ExtensionContext): void {
    Hundredpoints.current = new Hundredpoints(context);
    Hundredpoints.current.activate();
  }
  static current: Hundredpoints | undefined;

  /**
   * Private constructor to ensure class must be created through the static create function
   * @param context -- The VSCode Extension context
   */
  private constructor(context: ExtensionContext) {
    this.context = context;

    const request = this.request.bind(this);

    this.statusBar.text = "$(clock) HundredPoints Initializing...";
    this.statusBar.show();

    /**
     * Setup the sub-extensions
     */
    this.timesheet = new TimesheetExtension({ request });
  }

  /**
   * Entry function for VSCode extension
   *
   * Start the authentication and perform any registration tasks
   *
   * DO NOT activate the sub-extensions here. Wait for authentication
   */
  public activate(): void {
    this.authenticate();
    registerCommands(this);
    this.timesheet.register(this.context);

    this.statusBar.text = "$(clock)";
    this.statusBar.tooltip = "Hundredpoints: Initialized";
  }

  /**
   * Exit function for VSCode extension
   *
   * Make sure we logout and deactivate the sub-extensions
   */
  public deactivate(): void {
    this.logout();
    this.timesheet.deactivate();
  }

  public getContext(): ExtensionContext {
    return this.context;
  }

  private activateExtensions(): void {
    this.timesheet.activate();
  }

  private deactivateExtensions(): void {
    this.timesheet.deactivate();
  }

  public logout(): void {
    this.accessToken = undefined;
    this.deactivateExtensions();
  }

  public async authenticate(): Promise<void> {
    const response = await authenticate();

    if (!response) {
      return;
    }

    this.accessToken = response.token;
    this.accessToken ? this.activateExtensions() : this.logout();

    this.profile = response.profile;

    this.statusBar.tooltip = `Hundredpoints: Authenticated as ${this.profile.name}`;
  }

  private async request<D, V = unknown>({
    query,
    variables,
    method = "get",
  }: {
    query: string;
    method?: string;
    variables?: V;
  }): Promise<D> {
    const response = await fetch("http://localhost:3000/api/graphql", {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    // Should handle some global errors here
    if (!response.ok) {
      throw response;
    }

    return response.json();
  }
}

/**
 * Entry function for VSCode extensions.
 *
 * @param context - The current VSCode Extension Context
 */
export function activate(context: ExtensionContext): void {
  Hundredpoints.create(context);
}

/**
 * Exit function for VSCode extensions.
 *
 * @param context - The current VSCode Extension Context
 */
export function deactivate(): void {
  Hundredpoints.current?.deactivate();
}
