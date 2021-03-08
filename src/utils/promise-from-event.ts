/* eslint-disable @typescript-eslint/no-explicit-any -- Matching Microsoft's types */

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License.
 *
 *  @see https://github.com/microsoft/vscode/blob/4059ff428f19602df545a0393e094cca8e506ea1/extensions/github-authentication/src/common/utils.ts
 *--------------------------------------------------------------------------------------------*/

import { Event, Disposable } from "vscode";

export interface PromiseAdapter<T, U> {
  (
    value: T,
    resolve: (value: U | PromiseLike<U>) => void,
    reject: (reason: any) => void
  ): any;
}

const passthrough = (value: any, resolve: (value?: any) => void): void =>
  resolve(value);

/**
 * Return a promise that resolves with the next emitted event, or with some future
 * event as decided by an adapter.
 *
 * If specified, the adapter is a function that will be called with
 * `(event, resolve, reject)`. It will be called once per event until it resolves or
 * rejects.
 *
 * The default adapter is the passthrough function `(value, resolve) => resolve(value)`.
 *
 * @param event - the event
 * @param adapter - controls resolution of the returned promise
 * @returns a promise that resolves or rejects as specified by the adapter
 */
export default async function promiseFromEvent<T, U>(
  event: Event<T>,
  adapter: PromiseAdapter<T, U> = passthrough
): Promise<U> {
  let subscription: Disposable;
  return new Promise<U>(
    (resolve, reject) =>
      (subscription = event((value: T) => {
        try {
          Promise.resolve(adapter(value, resolve, reject)).catch(reject);
        } catch (error) {
          reject(error);
        }
      }))
  ).then(
    (result: U) => {
      subscription.dispose();
      return result;
    },
    (error) => {
      subscription.dispose();
      throw error;
    }
  );
}
