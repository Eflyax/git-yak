export enum ENetworkCommands {
	GitCall = 'git-call',
	ReadFile = 'read-file'
}

export enum ECommitHashes {
	WorkingTree = 'WORKING_TREE'
}

export enum ESystemEvents {
	OpenContextMenuCommit = 'open-context-menu',
	RerenderCommitHistory = 'rerender-commit-history', // temporary hack
	Success = 'success',
	Warning = 'warning',
	Error = 'error'
}

declare global {
	interface Window {
		success: (content: string, title?: string) => void;
		warning: (content: string, title?: string) => void;
		error: (content: string, title?: string) => void;
	}
}

export interface IProject {
	id: string;
	order: number;
	alias: string;
	path: string;
	server: string;
	port: number;
	dateLastOpen: number;
}
