import vscode, { ExtensionContext, Disposable } from "vscode";

import { getFileInfo } from "../git";
import prettyMilliseconds from "pretty-ms";
import { activity } from "@hundredpoints/cli";
import { Hundredpoints } from "src/extension";
import output from "../../output";
import { ActivityEventSource } from "@hundredpoints/cli/dist/sdk";

function log(line: string): void {
  output.appendLine(`[Timesheet] ${line}`);
}

export default class TimesheetFeature {
  private active = false;
  private parent: Hundredpoints;
  private context: ExtensionContext;

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

  constructor(parent: Hundredpoints) {
    this.parent = parent;
    this.context = parent.getContext();

    output.appendLine("Initializing timesheet extension");
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
    this.context.subscriptions.push(Disposable.from(...subscriptions));
  }

  public activate(): void {
    log("Active");
    this.active = true;
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

  private clearActivity(): void {
    log("Clearing activity");
    this.statusBar.text = "$(debug-pause)";
    this.playStart = 0;
    this.lastFileName = undefined;
    clearInterval(this.updateDisplayTimeout);
  }

  private handleOnActivity(): void {
    if (!this.active) {
      return;
    }

    const file = vscode.window.activeTextEditor?.document?.fileName;

    if (!file) {
      return this.clearActivity();
    }

    if (!vscode.window.state.focused) {
      return this.clearActivity();
    }

    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    this.idleTimeout = setTimeout(() => this.clearActivity(), this.idleLimit);

    const timestamp = Date.now();
    const timeToWaitBetweenUpdates = 2 * 60 * 1000;
    const hasEnoughTimePassed =
      this.lastEventTimestamp + timeToWaitBetweenUpdates < timestamp;

    if (file === this.lastFileName && !hasEnoughTimePassed) {
      return;
    }

    if (file !== this.lastFileName) {
      this.lastFileName = file;
      this.playStart = timestamp;
      clearInterval(this.updateDisplayTimeout);
      this.updateStatusBar();
      this.updateDisplayTimeout = setInterval(
        () => this.updateStatusBar(),
        this.updateDisplayInterval
      );
    }

    this.lastEventTimestamp = timestamp;
    const token = this.parent.getAccessToken();
    const { remoteUrl } = getFileInfo(file);

    log(`Handle activity for ${file}`);

    activity({
      token,
      remoteUrl,
      file,
      source: ActivityEventSource.VisualStudioCode,
      startDateTime: new Date(),
    });
  }
}
