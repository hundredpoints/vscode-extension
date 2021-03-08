import output from "../../output";

/**
 * Taken from VSCode docs
 *
 * @see https://code.visualstudio.com/api/advanced-topics/remote-extensions#persisting-secrets
 */
import { env } from "vscode";
import * as keytarType from "keytar";

declare const __webpack_require__: typeof require;
declare const __non_webpack_require__: typeof require;
function getNodeModule<T>(moduleName: string): T | undefined {
  const r =
    typeof __webpack_require__ === "function"
      ? __non_webpack_require__
      : require;
  try {
    return r(`${env.appRoot}/node_modules.asar/${moduleName}`);
  } catch (err) {
    // Not in ASAR.
  }
  try {
    return r(`${env.appRoot}/node_modules/${moduleName}`);
  } catch (err) {
    // Not available.
  }
  return undefined;
}

const keytar: typeof keytarType = getNodeModule<typeof keytarType>("keytar")!;

export const PASSWORD_SERVICE_SUFFIX = "/integration/visual-studio-code";

export interface Credential {
  account: string;
  token: string;
}

export function getServiceString(origin: string): string {
  return origin.replace("http://", "") + PASSWORD_SERVICE_SUFFIX;
}

export async function getCredentials(origin: string): Promise<Credential[]> {
  const credentials = await keytar.findCredentials(getServiceString(origin));
  return credentials.map(({ account, password }) => ({
    account,
    token: password,
  }));
}

export async function saveCredentials(
  origin: string,
  account: string,
  token: string
): Promise<void> {
  await keytar.setPassword(getServiceString(origin), account, token);
}

export async function deleteCredential(
  origin: string,
  account: string
): Promise<boolean> {
  return keytar.deletePassword(getServiceString(origin), account);
}
