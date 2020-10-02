import { findCredentials, setPassword } from "keytar";

export const PASSWORD_SERVICE = "hundredpoints/integration/visual-studio-code";

export async function getCredentials(): Promise<{
  account: string;
  token: string;
} | void> {
  const [credentials] = await findCredentials(PASSWORD_SERVICE);

  if (!credentials) {
    return;
  }

  return {
    account: credentials.account,
    token: credentials.password,
  };
}

export async function saveCredentials(
  account: string,
  token: string
): Promise<void> {
  await setPassword(PASSWORD_SERVICE, account, token);
}
