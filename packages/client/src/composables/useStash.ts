import {ref} from 'vue';

const
	stashes = ref({});

export function useStash(repo) {

	async function getStashes() {
		stashes.value = {};

		const
			output = await repo.callGit('stash', 'list', '--format="%gd|%H|%P|%s"');

		output.split('\n').filter(Boolean).map(line => {
			const
				[id, hash, parents, message] = line.split('|'),
				parentList = parents.split(' ');

			stashes.value[id] = {
				id,
				hash,
				parentHash: parentList[0],
				message,
				isStash: true
			};
		});
	};

	return {
		getStashes,
		stashes
	};
}
