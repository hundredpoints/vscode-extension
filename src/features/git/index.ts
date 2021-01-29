import * as vscode from "vscode";
import path from "path";
import pathIsInside from "path-is-inside";

import { API as GitAPI, Repository } from "../../@types/git";

export interface FileInfo {
  remoteUrl?: string;
}

function getVSCodeGit(): GitAPI {
  const gitExtension = vscode.extensions.getExtension("vscode.git")?.exports;
  return gitExtension.getAPI(1);
}

export function findFileRepository(fileName: string): Repository | undefined {
  return getVSCodeGit().repositories.find((repo) => {
    return pathIsInside(fileName, repo.rootUri.fsPath);
  });
}

export function getRepositoryRemote(
  repository: Repository
): string | undefined {
  return repository.state.HEAD?.remote || repository.state.remotes[0].fetchUrl;
}

export function getRelativeFilename(
  filename: string,
  repository: Repository
): string {
  return path.relative(repository.rootUri.fsPath, filename);
}

export function getFileInfo(fileName: string): FileInfo {
  const repository = findFileRepository(fileName);

  if (!repository) {
    return {};
  }

  return {
    remoteUrl: getRepositoryRemote(repository),
  };
}
