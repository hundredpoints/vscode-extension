import { deletePassword, findCredentials, setPassword } from "keytar";

export const PASSWORD_SERVICE =
  "hundredpoints.io/integration/visual-studio-code";

export async function getCredentials(): Promise<
  Array<{
    account: string;
    token: string;
  }>
> {
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
  await setPassword(PASSWORD_SERVICE, account, token);
}

export async function deleteCredential(account: string): Promise<void> {
  await deletePassword(PASSWORD_SERVICE, account);
}

export async function deleteAllCredentials(): Promise<void> {
  const credentials = await findCredentials(PASSWORD_SERVICE);

  await Promise.all(
    credentials.map(({ account }) => deleteCredential(account))
  );
}
