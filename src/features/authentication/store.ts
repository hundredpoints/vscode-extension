import { deletePassword, findCredentials, setPassword } from "keytar";
import output from "../../output";

export const PASSWORD_SERVICE =
  "hundredpoints.io/integration/visual-studio-code";

export interface Credential {
  account: string;
  token: string;
}

export async function getCredentials(): Promise<Credential[]> {
  const credentials = await findCredentials(PASSWORD_SERVICE);
  return credentials.map(({ account, password }) => ({
    account,
    token: password,
  }));
}

export async function saveCredentials(
  account: string,
  token: string
): Promise<void> {
  output.appendLine("Saving credentials");
  return setPassword(PASSWORD_SERVICE, account, token);
}

export async function deleteCredential(account: string): Promise<boolean> {
  return deletePassword(PASSWORD_SERVICE, account);
}

export async function deleteAllCredentials(): Promise<
  Array<{
    account: string;
    deleted: boolean;
  }>
> {
  const credentials = await findCredentials(PASSWORD_SERVICE);

  const results = credentials.map(async ({ account }) => ({
    account,
    deleted: await deleteCredential(account),
  }));

  return Promise.all(results);
}
