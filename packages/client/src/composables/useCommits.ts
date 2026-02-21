import {ref, computed} from 'vue';
import type {Ref} from 'vue';

const
	FIELD_SEPARATOR = '\x06',
	COMMIT_LIMIT_MULTIPLIER = 4,
	LOG_FORMAT = {
		hash: '%H',
		parents: '%P',
		subject: '%s',
		body: '%b',
		author_email: '%ae',
		author_name: '%an',
		author_date: '%ad',
		committer_email: '%ce',
		committer_name: '%cn',
		committer_date: '%cd',
	};

interface IStash {
	id: string;
	hash: string;
	parentHash: string;
	message: string;
	isStash: boolean;
}

interface ILoadOptions {
	limit?: number | null;
}

const
	commits  = ref<Array<any>>([]),
	selected_commits = ref<string[]>([]),
	current_commit_limit = ref<number | null | undefined>(undefined);

export function useCommits() {

	const commit_by_hash = computed(() => {
		if (!commits.value) {
			return {};
		}

		return Object.fromEntries(commits.value.map(c => [c.hash, c]));
	});

	const loaded_all = computed(() =>
		current_commit_limit.value === null ||
		(current_commit_limit.value ?? 0) > (commits.value?.length ?? 0) - 1,
	);

	function setSelectedCommits(hashes: string[]) {
		selected_commits.value = hashes;
	}

	function mapStashes() {
		return Object.values(stashes.value)
			.sort((a, b) => {
				const
					idA = parseInt(a.id.match(/\{(\d+)\}/)?.[1] ?? '0', 10),
					idB = parseInt(b.id.match(/\{(\d+)\}/)?.[1] ?? '0', 10);

				return idA - idB;
			})
			.map(stash => {
				const stash_id = stash.id.replace(/"/g, '');

				return {
					id:  stash_id,
					hash:  stash.hash,
					parents: stash.parentHash || '',
					subject: stash.message.split(':').slice(1).join(':').slice(0, -1),
					body:  '',
					author_name: 'Stash',
					committer_name: 'Stash',
					author_date: '',
					committer_date: '',
					isStash: true,
					references: [{
						type: 'stash',
						name: stash_id,
						id: stash_id,
						hash: stash.hash,
					}],
				};
			});
	}

	function buildGraph(rawCommits: any[]) {
		const
			occupied_levels: Record<number, any> = {},
			remaining_parents: Record<string, Set<string>> = {},
			children:  Record<string, any[]> = {};

		for (const [i, commit] of rawCommits.entries()) {
			commit.index = i;
			commit.hash_abbr = commit.hash.slice(0, 7);

			if (!commit.isStash) {
				commit.references = references_by_hash.value[commit.hash] ?? [];
			}

			commit.parents = commit.parents ? commit.parents.split(' ') : [];

			for (const parent_hash of commit.parents) {
				children[parent_hash] ??= [];
				children[parent_hash].push(commit);
			}
			remaining_parents[commit.hash] = new Set(commit.parents);

			let min_child_index = i;

			for (const child of _.sortBy(children[commit.hash], 'level')) {
				if (
					occupied_levels[child.level] === child &&
					commit.hash === child.parents[0] &&
					child.index < min_child_index
				) {
					commit.level = child.level;
					break;
				}
				min_child_index = Math.min(min_child_index, child.index);
			}

			if (commit.level === undefined) {
				for (let level = 0; ; ++level) {
					if (occupied_levels[level] === undefined) {
						commit.level = level;
						break;
					}
				}
			}

			if (commit.parents.length > 0) {
				occupied_levels[commit.level] = commit;
			}

			for (const child of children[commit.hash] ?? []) {
				remaining_parents[child.hash].delete(commit.hash);

				if (remaining_parents[child.hash].size === 0) {
					if (child.level !== commit.level) {
						delete occupied_levels[child.level];
					}
				}
			}
		}
	}

	// async function loadCommits({limit}: ILoadOptions = {}): Promise<{selectionReset: boolean}> {
	// 	// todo pass repo as argument
	// 	const
	// 		excluded = [...hidden_references.value, 'refs/stash'],
	// 		log = await repo?.value?.callGit(
	// 			'log',
	// 			..._.map(excluded, id => `--exclude=${id}`),
	// 			'--all',
	// 			'-z',
	// 			'--pretty=format:' + Object.values(LOG_FORMAT).join(FIELD_SEPARATOR),
	// 			'--date=format-local:%Y-%m-%d %H:%M',
	// 			...(limit == null ? [] : [`--max-count=${limit}`]),
	// 			'--date-order',
	// 		),
	// 		rawCommits = [
	// 			{ hash: 'WORKING_TREE', parents: current_head.value },
	// 			...mapStashes(),
	// 			...log
	// 				.split('\0')
	// 				.filter(Boolean)
	// 				.map(row => Object.fromEntries(
	// 					_.zip(Object.keys(LOG_FORMAT), row.split(FIELD_SEPARATOR)),
	// 				)),
	// 		];

	// 	buildGraph(rawCommits);

	// 	if (commits.value === undefined) {
	// 		setSelectedCommits(['WORKING_TREE']);
	// 	}

	// 	commits.value = Object.freeze(rawCommits);
	// 	current_commit_limit.value = limit ?? null;

	// 	const selectionReset = !selected_commits.value.every(
	// 		hash => commit_by_hash.value[hash] !== undefined,
	// 	);

	// 	if (selectionReset) {
	// 		setSelectedCommits([]);
	// 	}

	// 	return {
	// 		selectionReset
	// 	};
	// }

	async function loadMore() {
		const next_limit =
			current_commit_limit.value == null
				? null
				: current_commit_limit.value * COMMIT_LIMIT_MULTIPLIER;

		// return loadCommits({limit: next_limit});
	}

	return {
		commits,
		commit_by_hash,
		selected_commits,
		setSelectedCommits,
		loaded_all,
		current_commit_limit,
		// loadCommits,
		loadMore,
		COMMIT_LIMIT_MULTIPLIER,
	};
}
