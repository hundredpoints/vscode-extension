import os from "os";
import fetch from "node-fetch";

import {
  DeviceCodeResponse,
  ApiDeviceCodeResponse,
  ApiDeviceTokenResponse,
  DeviceTokenResponseSuccess,
  ApiRefreshTokenSuccess,
  RefreshResponse,
  ApiRefreshTokenError,
} from "./types";

import config from "../../config";
import { CancellationToken } from "vscode";

const { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE } = config;

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const data = new URLSearchParams();
  data.append("client_id", AUTH0_CLIENT_ID);
  data.append("scope", "offline_access openid profile");
  data.append("audience", AUTH0_AUDIENCE);

  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/device/code`, {
    method: "post",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "User-Agent": "MY-UA-STRING",
    },
    body: data,
  });

  if (!response.ok) {
    const error = await response.json();
    console.log(error);
    throw new Error(error);
  }

  const body: ApiDeviceCodeResponse = await response.json();

  return {
    deviceCode: body.device_code,
    userCode: body.user_code,
    verificationUri: body.verification_uri,
    verificationUriComplete: body.verification_uri_complete,
    expiresIn: body.expires_in,
    interval: body.interval,
  };
}

function isTokenResponseSuccess(
  body: ApiDeviceTokenResponse
): body is DeviceTokenResponseSuccess {
  return Boolean(
    ((body as unknown) as DeviceTokenResponseSuccess).access_token
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

export async function pollForToken(
  deviceCode: string,
  interval: number,
  token: CancellationToken
): Promise<RefreshResponse | undefined> {
  const data = new URLSearchParams();
  data.append("client_id", AUTH0_CLIENT_ID);
  data.append("device_code", deviceCode);
  data.append("grant_type", "urn:ietf:params:oauth:grant-type:device_code");

  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "post",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": `vscode - ${os.hostname}`,
    },
    body: data,
  });

  const body: ApiDeviceTokenResponse = await response.json();

  if (token.isCancellationRequested) {
    return;
  }

  if (isTokenResponseSuccess(body)) {
    console.log(body);
    return {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      idToken: body.id_token,
      tokenType: body.token_type,
      expiresIn: body.expires_in,
    };
  }

  if (body.error === "authorization_pending") {
    await sleep(interval * 1000);
    return pollForToken(deviceCode, interval, token);
  }

  if (body.error === "slow_down") {
    await sleep(interval * 1000);
    await sleep(interval * 1000);
    return pollForToken(deviceCode, interval, token);
  }

  if (body.error === "access_denied") {
    throw new Error("Request to login was denied");
  }

  if (body.error === "expired_token") {
    throw new Error("Request to login has expired");
  }

  throw new Error("Unknown response");
}

export async function refreshAuthentication(
  refreshToken: string
): Promise<RefreshResponse | undefined> {
  const data = new URLSearchParams();
  data.append("client_id", AUTH0_CLIENT_ID);
  data.append("refresh_token", refreshToken);
  data.append("grant_type", "refresh_token");

  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "post",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: data,
  });

  if (!response.ok) {
    const error: ApiRefreshTokenError = await response.json();
    console.error(`${error.error}: ${error.error_description}`);
    return;
  }

  const body: ApiRefreshTokenSuccess = await response.json();

  return {
    accessToken: body.access_token,
    expiresIn: body.expires_in,
    idToken: body.id_token,
    refreshToken: body.refresh_token,
    tokenType: body.token_type,
  };
}
