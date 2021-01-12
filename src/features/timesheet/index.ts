import vscode, { ExtensionContext, Disposable } from "vscode";

import { getFileInfo } from "../git";
import { Hundredpoints } from "src/extension";
import prettyMilliseconds from "pretty-ms";

interface TimesheetExtensionConstructor {
  request: Hundredpoints["request"];
}

export default class TimesheetExtension {
  private active = false;

  private lastFileName: string | undefined = undefined;
  private lastEventTimestamp = 0;

  private playStart = 0;
  private updateDisplayInterval = 1000 * 60;
  declare updateDisplayTimeout: NodeJS.Timeout;

  private idleLimit = 1000 * 60;
  declare idleTimeout: NodeJS.Timeout;

  private statusBar: vscode.StatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );

  private request: Hundredpoints["request"];

  constructor({ request }: TimesheetExtensionConstructor) {
    this.request = request;
  }

  public register(context: ExtensionContext): void {
    console.log("Registering timesheet Extension");
    const subscriptions: Disposable[] = [];

    vscode.window.onDidChangeTextEditorSelection(
      this.handleOnActivity,
      this,
      subscriptions
    );
    vscode.window.onDidChangeActiveTextEditor(
      this.handleOnActivity,
      this,
      subscriptions
    );

    // Make sure we clean up all subscriptions
    context.subscriptions.push(Disposable.from(...subscriptions));
  }

  public activate(): void {
    this.active = true;
    this.statusBar.text = "$(debug-pause)";
    this.statusBar.tooltip = "HundredPoints: Waiting for activity";
    this.statusBar.show();
  }

  public deactivate(): void {
    this.active = false;
    this.statusBar.hide();
  }

  private updateStatusBar(): void {
    if (!this.playStart) {
      this.statusBar.text = "$(debug-pause)";
      return;
    }

    const displayTimeDiff = Date.now() - this.playStart;
    const displayTime =
      displayTimeDiff >= 1000 * 60
        ? prettyMilliseconds(displayTimeDiff)
        : "<1min";

    this.statusBar.text = `$(play) ${displayTime}`;
  }

  private handleIdle(): void {
    this.statusBar.text = "$(debug-pause)";
    this.playStart = 0;
    clearInterval(this.updateDisplayTimeout);
  }

  private handleOnActivity(): void {
    // Ignore everything until we are active
    if (!this.active) {
      return;
    }

    const fileName = vscode.window.activeTextEditor?.document?.fileName;

    if (!fileName) {
      return;
    }

    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    this.idleTimeout = setTimeout(() => this.handleIdle(), this.idleLimit);

    const timestamp = Date.now();
    const timeToWaitBetweenUpdates = 2 * 60 * 1000;
    const hasEnoughTimePassed =
      this.lastEventTimestamp + timeToWaitBetweenUpdates < timestamp;

    if (fileName === this.lastFileName && !hasEnoughTimePassed) {
      return;
    }

    if (fileName !== this.lastFileName) {
      this.lastFileName = fileName;
      this.playStart = timestamp;
      clearInterval(this.updateDisplayTimeout);
      this.updateStatusBar();
      this.updateDisplayTimeout = setInterval(
        () => this.updateStatusBar(),
        this.updateDisplayInterval
      );
    }

    this.lastEventTimestamp = timestamp;
    this.sendActivityTimesheetEvent(fileName);
  }

  async sendActivityTimesheetEvent(filename: string): Promise<void> {
    const { remoteUrl } = getFileInfo(filename);

    console.log("Sending event", remoteUrl, filename);

    const response = await this.request({
      method: "post",
      query: `mutation CreateActivityEvent($input: CreateIntegrationActivityEventInput!) {
        createIntegrationActivityEvent(input: $input) {
          code
          error
          message
          activityEvent {
            id
          }
        }
      }`,
      variables: {
        input: {
          remoteUrl,
          filename,
          startDateTime: new Date(),
        },
      },
    });

    console.log(response);
  }
}
