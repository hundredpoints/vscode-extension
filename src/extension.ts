import vscode, { ExtensionContext } from "vscode";

import authenticate from "./features/authentication";

import { registerCommands } from "./commands";

import getClient, { Sdk } from "@hundredpoints/cli";

/** Features */
import TimesheetFeature from "./features/timesheet";
import output from "./output";
import config from "./config";

/**
 * Singleton Class for the HundredPoints Extension
 */
export class Hundredpoints {
  static current: Hundredpoints | undefined;
  private context: ExtensionContext;

  private client: Sdk | undefined;

  private timesheet: TimesheetFeature;

  private accessToken: string | undefined;

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
  }

  /**
   * Private constructor to ensure class must be created through the static create function
   * @param context -- The VSCode Extension context
   */
  private constructor(context: ExtensionContext) {
    this.context = context;

    output.appendLine("Initializing");

    registerCommands(this);
    this.timesheet = new TimesheetFeature(this);

    output.appendLine("Initialized");

    this.authenticate();
  }

  public getContext(): ExtensionContext {
    return this.context;
  }

  public getClient(): Sdk {
    if (!this.client) {
      throw new Error("Attempted to get API client while logged out");
    }

    return this.client;
  }

  private activateExtensions(): void {
    output.appendLine("Activating extensions");
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
    try {
      output.appendLine("Checking authentication");
      const response = await authenticate();

      if (!response) {
        return;
      }

      output.appendLine("Successfully authenticated");

      this.accessToken = response.token;

      this.client = getClient({
        token: this.accessToken,
        url: config.HUNDREDPOINTS_ORIGIN,
      });

      this.activateExtensions();
      this.statusBar.hide();
    } catch (error) {
      output.appendLine(`Error: ${error.message}`);
    }
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
 */
export function deactivate(): void {
  Hundredpoints.current?.logout();
}
