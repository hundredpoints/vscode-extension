import { CancellationToken } from "vscode";
import fetch from "node-fetch";

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
  tokenUri: string,
  code: string,
  interval: number
): Promise<string | { error: POLL_FOR_TOKEN_ERROR }> {
  const response = await fetch(tokenUri, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
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
    await sleep(interval);
    return pollForToken(token, tokenUri, code, interval);
  }

  if (body.error === "slow_down") {
    await sleep(interval * 5);
    return pollForToken(token, tokenUri, code, interval);
  }

  if (body.error === "access_denied") {
    return { error: POLL_FOR_TOKEN_ERROR.ACCESS_DENIED };
  }

  if (body.error === "expired_token") {
    return { error: POLL_FOR_TOKEN_ERROR.EXPIRED_CODE };
  }

  console.log(body);

  return { error: POLL_FOR_TOKEN_ERROR.UNKNOWN };
}
