import vscode, { ExtensionContext, Disposable } from "vscode";

import prettyMilliseconds from "pretty-ms";
import { ActivityEventSource } from "@hundredpoints/cli";
import { Hundredpoints } from "src/extension";
import output from "../../output";
import {
  findFileRepository,
  getRelativeFilename,
  getRepositoryRemote,
} from "../git";

function log(line: string): void {
  output.appendLine(`[Timesheet] ${line}`);
}

function logError(line: string): void {
  output.appendLine(`[Timesheet] [⚠] ${line}`);
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

    log("Initializing timesheet extension");
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
    this.statusBar.text = "$(debug-pause)";
    this.playStart = 0;
    this.lastFileName = undefined;
    clearInterval(this.updateDisplayTimeout);
  }

  private async handleOnActivity(): Promise<void> {
    if (!this.active) {
      return;
    }

    let filename = vscode.window.activeTextEditor?.document?.fileName;

    if (!filename) {
      log("No active file");
      return this.clearActivity();
    }

    if (!vscode.window.state.focused) {
      log("Window has lost focus");
      return this.clearActivity();
    }

    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    this.idleTimeout = setTimeout(() => {
      log("Idle limit reached");
      this.clearActivity();
    }, this.idleLimit);

    const timestamp = Date.now();
    const timeToWaitBetweenUpdates = 2 * 60 * 1000;
    const hasEnoughTimePassed =
      this.lastEventTimestamp + timeToWaitBetweenUpdates < timestamp;

    if (filename === this.lastFileName && !hasEnoughTimePassed) {
      return;
    }

    if (filename !== this.lastFileName) {
      this.lastFileName = filename;
      this.playStart = timestamp;
      clearInterval(this.updateDisplayTimeout);
      this.updateStatusBar();
      this.updateDisplayTimeout = setInterval(
        () => this.updateStatusBar(),
        this.updateDisplayInterval
      );
    }

    if (fileBlacklist.some((regex) => filename && regex.test(filename))) {
      log("Skipping blacklisted file");
      return;
    }

    this.lastEventTimestamp = timestamp;
    log(`Handle activity for ${filename}`);

    const repository = findFileRepository(filename);

    let gitRemoteUrl;

    if (repository) {
      filename = getRelativeFilename(filename, repository);
      gitRemoteUrl = getRepositoryRemote(repository);
    }

    try {
      await this.parent.getClient().createActivityEvent({
        input: {
          filename,
          source: ActivityEventSource.VisualStudioCode,
          isHeartbeat: true,
          startDateTime: new Date(),
          gitRemoteUrl,
        },
      });

      log(`Successfully created activity event for ${filename}`);
    } catch (error) {
      vscode.window.showErrorMessage("Error when saving timesheet data");
      logError(error.response.errors[0].message);
    }
  }
}
