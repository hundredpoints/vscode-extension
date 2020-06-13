import * as vscode from "vscode";

import { getFileRemote } from "../lib/git";

class TimesheetExtension {
  lastFileName: string | undefined = undefined;
  lastEventTimestamp = 0;
  idleTimeout: NodeJS.Timeout | undefined = undefined;

  activate(context: vscode.ExtensionContext): void {
    console.log("Starting hundredpoints Timesheet Extension");
    const subscriptions: vscode.Disposable[] = [];

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
    context.subscriptions.push(vscode.Disposable.from(...subscriptions));

    // this.resetOnIdle()
  }

  deactivate(): void {
    // this.resetOnIdle(true)
  }

  handleOnActivity(): void {
    const fileName = vscode.window.activeTextEditor?.document?.fileName;

    if (!fileName) {
      return;
    }

    const timestamp = Date.now();
    const timeToWaitBetweenUpdates = 2 * 60 * 1000;
    const hasEnoughTimePassed =
      this.lastEventTimestamp + timeToWaitBetweenUpdates < timestamp;

    if (fileName === this.lastFileName && !hasEnoughTimePassed) {
      return;
    }

    // this.resetOnIdle()

    this.lastFileName = fileName;
    this.lastEventTimestamp = timestamp;
    this.sendActivityTimesheetEvent(fileName);
  }

  resetOnIdle(deactivate = false): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    if (deactivate) {
      return;
    }

    this.idleTimeout = setTimeout(() => this.handleOnIdle(), 5 * 60 * 1000);
  }

  handleOnIdle(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = undefined;
    }

    this.sendIdleTimesheetEvent();
    this.resetOnIdle();
  }

  async sendActivityTimesheetEvent(fileName: string): Promise<void> {
    console.log(getFileRemote(fileName));
    console.log(fileName);
  }

  async sendIdleTimesheetEvent(): Promise<void> {
    console.log("idle");
  }
}

export default TimesheetExtension;
