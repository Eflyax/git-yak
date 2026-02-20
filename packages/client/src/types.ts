export enum ENetworkCommands {
	GitCall = 'git-call',
	ReadFile = 'read-file'
}

export enum ECommitHashes {
	WorkingTree = 'WORKING_TREE'
}

export enum ESystemEvents {
	OpenContextMenuCommit = 'open-context-menu',
	RerenderCommitHistory = 'rerender-commit-history' // temporary hack
}

export interface Project {
  id: string;
  order: number;
  alias: string;
  path: string;
  server: string;
  port: number;
  dateLastOpen: number;
}
