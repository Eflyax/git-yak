export const electronMock = {
	openRepo(): string {
		return localStorage.getItem('repoPath') || '.';
	},
	addListener(name: string) {
		console.log('Adding listener', name);
	},
	openTerminal(name: string) {
		console.log('Opening terminal', name);
	},
	callGit(...args: string[]) {
		console.log('Calling git', args);
	},
	readFile(name: string) {
		console.log('Reading file', name);
	},
	writeFile(name: string) {
		console.log('Writing file', name);
	},
	deleteFile(name: string) {
		console.log('Deleting file', name);
	}
};
