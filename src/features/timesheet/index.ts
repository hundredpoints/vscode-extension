import vscode, { ExtensionContext, Disposable } from "vscode";

import { getFileInfo } from "../../lib/git";
import { Hundredpoints } from "src/extension";

interface TimesheetExtensionConstructor {
  request: Hundredpoints["request"];
}

export default class TimesheetExtension {
  private active = false;

  private lastFileName: string | undefined = undefined;
  private lastEventTimestamp = 0;

  request: Hundredpoints["request"];

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
  }

  public deactivate(): void {
    this.active = false;
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

    const timestamp = Date.now();
    const timeToWaitBetweenUpdates = 2 * 60 * 1000;
    const hasEnoughTimePassed =
      this.lastEventTimestamp + timeToWaitBetweenUpdates < timestamp;

    if (fileName === this.lastFileName && !hasEnoughTimePassed) {
      return;
    }

    this.lastFileName = fileName;
    this.lastEventTimestamp = timestamp;
    this.sendActivityTimesheetEvent(fileName);
  }

  async sendActivityTimesheetEvent(fileName: string): Promise<void> {
    const { remoteUrl } = getFileInfo(fileName);

    console.log("Sending event", remoteUrl, fileName);

    const response = await this.request({
      method: "post",
      query: `
        mutation CreateActivityEvent($input: CreateActivityEventInput!) {
          createActivityEvent(input: $input) {
            event {
              id
            }
          }
        }
      `,
      variables: {
        input: {
          remoteUrl,
          fileName,
          startDateTime: new Date(),
        },
      },
    });

    console.log(response);
  }
}
