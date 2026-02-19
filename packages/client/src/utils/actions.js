export async function restoreWip(branch) {
	try {
		await this.repo.callGit("cherry-pick", branch.hash, "--no-commit");

		const msg = `Deleted local branch: ${branch.name} (was ${branch.hash})`;

		try{
			await this.repo.callGit("branch", "--delete", branch.name, "--force", {
				msg,
			});
		}
		catch (err) {
			console.error('Stash was deleted')
		}
	} finally {
		// For rebasing.
		await this.repo.deleteFile(".git/MERGE_MSG");

		await Promise.all([this.refreshHistory(), this.refreshStatus()]);
	}
}
