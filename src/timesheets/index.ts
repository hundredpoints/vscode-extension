import * as vscode from 'vscode';

import { clearTimeout, setTimeout } from 'timers';

import { getFileRemote } from "../services/git"

class TimesheetExtension {
  lastFileName: string | null = null
  lastEventTimestamp: number = 0
  idleTimeout: NodeJS.Timeout | null = null

  activate(context: vscode.ExtensionContext) {



    console.log("Starting hundredpoints Timesheet Extension")
    let subscriptions: vscode.Disposable[] = [];

    vscode.window.onDidChangeTextEditorSelection(this.handleOnActivity, this, subscriptions);
    vscode.window.onDidChangeActiveTextEditor(this.handleOnActivity, this, subscriptions);

    // Make sure we clean up all subscriptions
    context.subscriptions.push(vscode.Disposable.from(...subscriptions));

    // this.resetOnIdle()
  }

  deactivate() {
    // this.resetOnIdle(true)
  }

  handleOnActivity() {

    const fileName = vscode.window.activeTextEditor?.document?.fileName

    if (!fileName) {
      return
    }

    const timestamp = Date.now()
    const timeToWaitBetweenUpdates = 2 * 60 * 1000
    const hasEnoughTimePassed = (this.lastEventTimestamp + timeToWaitBetweenUpdates) < timestamp;

    if (fileName === this.lastFileName && !hasEnoughTimePassed) {
      return
    }

    // this.resetOnIdle()

    this.lastFileName = fileName
    this.lastEventTimestamp = timestamp
    this.sendActivityTimesheetEvent(fileName)
  }

  resetOnIdle(deactivate = false) {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout)
    }

    if (deactivate) {
      return
    }

    this.idleTimeout = setTimeout(() => this.handleOnIdle(), 5 * 60 * 1000)
  }

  handleOnIdle() {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout)
      this.idleTimeout = null
    }

    this.sendIdleTimesheetEvent()
    this.resetOnIdle()
  }

  async sendActivityTimesheetEvent(fileName: string) {
    console.log(getFileRemote(fileName))
    console.log(fileName)
  }

  async sendIdleTimesheetEvent() {
    console.log("idle")
  }
}

export default TimesheetExtension
