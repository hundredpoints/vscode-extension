import { EventEmitter, Uri, UriHandler } from "vscode";

class UriEventHandler extends EventEmitter<Uri> implements UriHandler {
  public handleUri(uri: Uri): void {
    this.fire(uri);
  }
}

export default new UriEventHandler();
