import vscode, { ExtensionContext, Disposable } from "vscode";

import { getFileInfo } from "../git";
import prettyMilliseconds from "pretty-ms";
import { ActivityEventSource } from "@hundredpoints/cli";
import { Hundredpoints } from "src/extension";
import output from "../../output";

function log(line: string): void {
  output.appendLine(`[Timesheet] ${line}`);
}

const fileBlacklist = [/^extension-output/];

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

  private async handleOnActivity(): Promise<void> {
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

    if (fileBlacklist.some((regex) => regex.test(file))) {
      log("Skipping blacklisted file");
      return;
    }

    this.lastEventTimestamp = timestamp;
    const { remoteUrl } = getFileInfo(file);

    log(`Handle activity for ${file}`);

    try {
      await this.parent.getClient().createIntegrationActivityEvent({
        input: {
          gitRemoteUrl: remoteUrl,
          source: ActivityEventSource.VisualStudioCode,
          isHeartbeat: true,
          startDateTime: new Date(),
        },
      });

      log(`Successfully created activity event for ${file}`);
    } catch (error) {
      console.error(error);
      vscode.window.showErrorMessage("Error when saving timesheet data");
    }
  }
}
