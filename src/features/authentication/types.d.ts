/* eslint-disable camelcase -- Need to match Auth0s api */

export interface ApiDeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

export interface DeviceCodeResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
  expiresIn: number;
  interval: number;
}

export type ApiDeviceTokenResponse =
  | ApiDeviceTokenResponseError
  | ApiDeviceTokenResponseSuccess;

interface ApiDeviceTokenResponseError {
  error:
    | "authorization_pending"
    | "slow_down"
    | "expired_token"
    | "access_denied";
  error_description: string;
}

interface ApiDeviceTokenResponseSuccess {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: "Bearer";
  expires_in: number;
}

interface DeviceTokenResponseSuccess {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

export interface ApiRefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  idToken: string;
  expires_in: number;
  scope: string;
  id_token: string;
  token_type: "Bearer";
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
  idToken: string;
  tokenType: "Bearer";
}
