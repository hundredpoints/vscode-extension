import * as vscode from 'vscode';

import TimesheetExtension from "./timesheets"

const timesheetExtension = new TimesheetExtension()

export function activate(context: vscode.ExtensionContext) {
  timesheetExtension.activate(context)
}

export function deactivate() {
  timesheetExtension.deactivate()
}
