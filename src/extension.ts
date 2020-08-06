import { ExtensionContext } from "vscode";

import fetch from "node-fetch";

import { authenticate } from "./features/authentication";

import TimesheetExtension from "./features/timesheet";

import { registerCommands } from "./commands";

const graphqlEndpoint = "http://localhost:3000/api/graphql";

/**
 * Singleton Class for the HundredPoints Extension
 */
export class Hundredpoints {
  static current: Hundredpoints | undefined;

  private context: ExtensionContext;

  private accessToken: string | undefined;
  private nextAuthenticateRefresh: NodeJS.Timeout | undefined;
  private profileId: string | undefined;

  private timesheet: TimesheetExtension;

  /**
   * Factory function to ensure that this class is a singleton
   *
   * @param context -- The VSCode Extension context
   */
  static create(context: ExtensionContext): void {
    Hundredpoints.current = new Hundredpoints(context);
    Hundredpoints.current.activate();
  }

  /**
   * Private constructor to ensure class must be created through the static create function
   * @param context -- The VSCode Extension context
   */
  private constructor(context: ExtensionContext) {
    this.context = context;

    /**
     * Setup the sub-extensions
     */
    this.timesheet = new TimesheetExtension({
      requestFn: this.request.bind(this),
    });
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
    this.profileId = undefined;
    this.deactivateExtensions();

    if (this.nextAuthenticateRefresh) {
      clearTimeout(this.nextAuthenticateRefresh);
    }
  }

  public async authenticate(): Promise<void> {
    const response = await authenticate();

    // User cancelled or something went wrong...
    if (!response) {
      this.logout();
      return;
    }

    this.accessToken = response.accessToken;
    this.profileId = response.profiles[0];
    this.activateExtensions();

    this.nextAuthenticateRefresh = setTimeout(() => {
      this.authenticate().catch((error) => {
        console.error(error);
        this.logout();
      });
    }, (response.expiresIn / 2) * 1000);
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
    console.log(1, this.profileId);
    const response = await fetch(graphqlEndpoint, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        query,
        variables,
        profileId: this.profileId,
      }),
    });

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
