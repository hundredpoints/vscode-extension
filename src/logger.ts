import vscode from "vscode";

const output = vscode.window.createOutputChannel("HundredPoints");

class Logger {
  enabled: boolean;
  namespace: string;

  constructor(namespace: string, color?: number) {
    this.namespace = namespace;
    this.enabled = true;
  }

  child(namespace: string): Logger {
    return new Logger(`${this.namespace}:${namespace}`);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  print(level: string, ...data: unknown[]): void {
    output.appendLine(`[${this.namespace}]${level}${data.join(" ")}`);
  }

  dev(...data: unknown[]): void {
    if (!this.enabled) {
      return;
    }

    return this.print(" 👨‍💻 ", ...data);
  }

  log(...data: unknown[]): void {
    return this.print(" ", ...data);
  }

  debug(...data: unknown[]): void {
    if (!this.enabled) {
      return;
    }

    return this.print(" 🐛 ", ...data);
  }

  error(...data: unknown[]): void {
    return this.print(" ⚠️ ", ...data);
  }
}

export default function createLogger(namespace: string): Logger {
  return new Logger(namespace);
}
