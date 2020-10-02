import os from "os";
import fetch from "node-fetch";

export interface RequestDeviceCodeResponse {
  code: string;
  expiredIn: number;
  interval: number;
  tokenUri: string;
  verificationUri: string;
}

export default async function requestDeviceCode(): Promise<
  RequestDeviceCodeResponse
> {
  const response = await fetch(`http://localhost:3000/api/auth/machine/code`, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: os.hostname(),
      integration: "visual-studio-code",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.log(error);
    throw new Error(error);
  }

  return response.json();
}
