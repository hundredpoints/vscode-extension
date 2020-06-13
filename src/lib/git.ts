import * as vscode from "vscode";
import pathIsInside from "path-is-inside";

import { API as GitAPI, Repository } from "../@types/git";

function getVSCodeGit(): GitAPI {
  const gitExtension = vscode.extensions.getExtension("vscode.git")?.exports;
  return gitExtension.getAPI(1);
}

export function findFileRepository(fileName: string): Repository | undefined {
  const git = getVSCodeGit();
  const matches = git.repositories.filter((repo) => {
    return pathIsInside(fileName, repo.rootUri.fsPath);
  });

  if (matches.length === 0) {
    return;
  }

  // eslint-disable-next-line unicorn/no-reduce -- Reduce is an easier way to find the max
  return matches.reduce((a, b) => {
    return a.rootUri.fsPath.length > b.rootUri.fsPath.length ? a : b;
  });
}

export function getFileRemote(fileName: string): string | undefined {
  const repo = findFileRepository(fileName);

  if (repo?.state.HEAD?.remote) {
    return repo.state.HEAD?.remote;
  }

  if (repo?.state.remotes.length) {
    return repo.state.remotes[0].fetchUrl;
  }
}
