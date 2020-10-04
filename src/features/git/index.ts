import * as vscode from "vscode";
import { isAbsolute } from "path";
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
  const git = getVSCodeGit();
  const matches = git.repositories.filter((repo) => {
    return pathIsInside(fileName, repo.rootUri.fsPath);
  });

  return matches.find(({ rootUri }) => isAbsolute(rootUri.fsPath));
}

export function getRepositoryRemote(
  repository: Repository
): string | undefined {
  return repository.state.HEAD?.remote || repository.state.remotes[0].fetchUrl;
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
