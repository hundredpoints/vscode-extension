import { CancellationToken } from "vscode";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

export enum POLL_FOR_TOKEN_ERROR {
  USER_CANCELLED = "user_cancelled",
  ACCESS_DENIED = "access_denied",
  EXPIRED_CODE = "expired_code",
  UNKNOWN = "unknown",
}

export async function pollForToken(
  token: CancellationToken,
  code: string,
  tokenUri: string,
  interval: number
): Promise<string | { error: POLL_FOR_TOKEN_ERROR }> {
  const response = await fetch(tokenUri, {
    method: "post",
    body: JSON.stringify({
      code,
    }),
  });

  if (token.isCancellationRequested) {
    return {
      error: POLL_FOR_TOKEN_ERROR.USER_CANCELLED,
    };
  }

  const body = await response.json();

  if (!body.error) {
    return body.token;
  }

  if (body.error === "authorization_pending") {
    await sleep(interval * 1000);
    return pollForToken(token, code, tokenUri, interval);
  }

  if (body.error === "slow_down") {
    await sleep(interval * 5000);
    return pollForToken(token, code, tokenUri, interval);
  }

  if (body.error === "access_denied") {
    return { error: POLL_FOR_TOKEN_ERROR.ACCESS_DENIED };
  }

  if (body.error === "expired_token") {
    return { error: POLL_FOR_TOKEN_ERROR.EXPIRED_CODE };
  }

  return { error: POLL_FOR_TOKEN_ERROR.UNKNOWN };
}
