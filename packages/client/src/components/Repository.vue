<template>
	<div
		class="tab-content"
	>
		<div
			v-if="currentProject.path === undefined"
		>
			<input
				v-model.trim="currentProject.title"
				placeholder="Title"
				:spellcheck="false"
			/>
			<btn @click="openRepo">
				<icon name="mdi-folder" class="size-5" />
				Open repository
			</btn>
		</div>
		<template v-else>
			<div class="main-content">
				<div class="content-toolbar">
					<div class="meta">
						<span class="repository-name">
							 <icon name="mdi-folder-open-outline" />
							 {{ currentProject.path?.split('/').pop() }}
						</span>

						<span class="current-branch-name">
							<icon name="mdi-source-branch" />
							{{ current_branch_name }}
						</span>
					</div>
					<div class="controls">
						<action-bar />
					</div>
					<div class="account">
						<span>{{ 'name' }}</span>
						<span>{{ 'email' }}</span>
					</div>
				</div>
				<splitpanes style="height: 500px;" >
					<pane
						class="left"
						size="12"
					>
						<ReferenceList />
					</pane>
					<pane
						class="middle"
					>
						<FileDiff
							v-if="selected_file !== null"
							ref="file_diff"
						/>
						<CommitHistory
							v-else
							ref="commit_history"
							:key="commitHistoryKey"
						/>
					</pane>
					<pane
						class="right"
						size="25"
					>
						<CommitDetails
							v-if="selected_commits.length > 0"
						/>
						<ReferenceDetails
							v-else-if="selected_reference !== null"
						/>
					</pane>
				</splitpanes>
			</div>
		</template>
	</div>

	<modal v-if="error_messages.length > 0" @close="error_messages.shift()">
		<div class="whitespace-pre font-mono">
			{{ error_messages[0] }}
		</div>
	</modal>
</template>

<script setup>
import JSON5 from 'json5';
import {ref, computed, watch, provide, onMounted, onBeforeUnmount, getCurrentInstance} from 'vue';
import {getStatus} from '@/utils/git';
import {ESystemEvents} from '@/types';
import {WebSocketClient} from '@/utils/websocket';
import {useProject} from '@/composables/useProject';
import {useStash} from '@/composables/useStash';
import {useCommits} from '@/composables/useCommits';
import ActionBar from './ActionBar/ActionBar.vue';
import CommitDetails from './CommitDetails/CommitDetails.vue';
import CommitHistory from './CommitHistory/CommitHistory.vue';
import FileDiff from './FileDiff/FileDiff.vue';
import ReferenceDetails from './ReferenceDetails/ReferenceDetails.vue';
import ReferenceList from './ReferenceList/ReferenceList.vue';
import {Splitpanes, Pane} from 'splitpanes';

const {proxy} = getCurrentInstance();

const file_diff      = ref(null);
const commit_history = ref(null);

const error_messages = ref([]);
const websocket      = ref(undefined);

// const main_pane_size       = ref(localStorage.getItem('main_pane_size')       || 75);
// const references_pane_size = ref(localStorage.getItem('references_pane_size') || 15);

// --- project ---
const {currentProject} = useProject();

// --- repository state ---
const config              = ref(undefined);
const references          = ref(undefined);
const selected_reference  = ref(null);
const hidden_references   = ref(new Set());
const current_branch_name = ref(null);
const current_operation   = ref(null);
const working_tree_files  = ref(undefined);
const selected_file       = ref(null);
const save_semaphore      = ref(Promise.resolve());
const commitHistoryKey    = ref(0);

const repo = computed(() => {
	const handleErrors = async (promise) => {
		try {
			return await promise;
		} catch (e) {
			const message = e.message.replace(
				/^Error invoking remote method '[\w-]+': Error: /,
				'',
			);
			if (_.last(error_messages.value) !== message) {
				error_messages.value.push(message);
			}
			throw e;
		}
	};

	const electronFuncs = Object.fromEntries(
		['openTerminal', 'writeFile', 'deleteFile'].map((func_name) => [
			func_name,
			async (...args) =>
				await handleErrors(window.electron[func_name](currentProject.value.path, ...args)),
		]),
	);

	const callGitOverWebSocket = async (...args) => {
		const payload = {repo_path: currentProject.value.path, args};
		return await handleErrors(websocket.value.call('git-call', payload));
	};

	const readFileOverWebSocket = async (file_path, options = {}) => {
		const payload = {repo_path: currentProject.value.path, file_path, options};
		return await handleErrors(websocket.value.call('read-file', payload));
	};

	return Object.freeze({
		...electronFuncs,
		callGit: callGitOverWebSocket,
		readFile: readFileOverWebSocket,
	});
});

const references_by_hash = computed(() => _.groupBy(references.value, 'hash'));
const references_by_type = computed(() => _.groupBy(references.value, 'type'));
const current_head       = computed(() => references_by_type.value.head?.[0]?.hash);

const {stashes, getStashes} = useStash(repo);

const {
	commit_by_hash,
	selected_commits,
	setSelectedCommits,
	loaded_all
} = useCommits();

const revisions_to_diff = computed(() => {
	if (selected_commits.value.length === 1) {
		const
			commit = commit_by_hash.value[selected_commits.value[0]],
			parent = commit.hash === 'WORKING_TREE' ? 'HEAD' : (commit.parents[0] ?? 'EMPTY_ROOT');

		return [commit.hash, parent];
	}
	else if (selected_commits.value.length === 2) {
		return _.sortBy(selected_commits.value, (hash) => commit_by_hash.value[hash].index);
	}
});

const uncommitted_file_count = computed(() => {
	if (working_tree_files.value === undefined) return 0;

	const unique_file_paths = new Set(
		_.map([...working_tree_files.value.unstaged, ...working_tree_files.value.staged], 'path'),
	);

	return unique_file_paths.size;
});

function setSelectedReference(reference) {
	selected_reference.value = reference;
	if (reference !== null) setSelectedCommits([]);
}

function handleSetSelectedCommits(hashes) {
	setSelectedCommits(hashes);
	if (hashes.length > 0) setSelectedReference(null);
}

function isCurrentBranch(reference) {
	return (
		(reference.type === 'local_branch' && reference.name === current_branch_name.value) ||
		reference.type === 'head'
	);
}

async function updateFileStatus(file) {
	const status = await getStatus(repo.value, '--', file.path, ..._.filter([file.old_path]));
	const files  = _.cloneDeep(working_tree_files.value);

	for (const area of ['unstaged', 'staged']) {
		files[area] = _.reject(files[area], {path: file.path});
		files[area] = _.sortBy([...files[area], ...status[area]], 'path');
	}

	working_tree_files.value = Object.freeze(files);
}

async function saveSelectedFile() {
	return await file_diff.value?.save();
}

async function refreshHistory(...args) {
	await commit_history.value.loadHistory(...args);
}

async function refreshStatus() {
	await commit_history.value.loadStatus();
}

async function openRepo() {
	let path = await window.electron.openRepo();

	if (path !== undefined) {
		path = path.replace(/\\/g, '/');
		currentProject.value.path = path;
		currentProject.value.title ??= path.slice(path.lastIndexOf('/') + 1);
	}

	return path;
}

// --- Watchers ---
watch(
	currentProject,
	async () => {
		if (currentProject.value?.path !== undefined) {
			websocket.value = new WebSocketClient(
				`ws://${currentProject.value.server}:${currentProject.value.port}`,
			);

			const hidden_references_content = await repo.value.readFile(
				'.git/.git-cracken/hidden-refs.txt',
				{null_if_not_exists: true},
			);
			hidden_references.value = new Set(hidden_references_content?.split('\n') ?? []);

			const config_content = await repo.value.readFile(
				'.git/.git-cracken/config.json5',
				{null_if_not_exists: true},
			);
			config.value = Object.freeze(JSON5.parse(config_content ?? '{}'));
		}
	},
	{deep: true, immediate: true},
);

watch(
	hidden_references,
	async () => {
		await repo.value.writeFile(
			'.git/.git-cracken/hidden-refs.txt',
			[...hidden_references.value].join('\n'),
			{make_directory: true},
		);
	},
	{deep: true},
);

onMounted(() => {
	// todo - hacky soution
	proxy.$emitter.on(ESystemEvents.RerenderCommitHistory, () => {
		commitHistoryKey.value++;
		console.log('Commit history rerendered', commitHistoryKey.value);
	});

	proxy.$emitter.on(ESystemEvents.OpenContextMenuCommit, (argument) => {
		const
			{e, commit} = argument,
			items = [];

		if (commit.isStash) {
			const stashAction = async (action, stashId) => {
				await repo.value.callGit('stash', action, stashId);
				await refreshHistory();
				await refreshStatus();
				// todo - on success delete commit stash?
				proxy.$emitter.emit(ESystemEvents.RerenderCommitHistory);
			};

			items.push(
				{label: 'Apply stash', onClick: async () => stashAction('apply', commit.id)},
				{label: 'Pop stash', onClick: async () => stashAction('pop', commit.id)},
				{label: 'Delete stash', onClick: async () => stashAction('drop', commit.id)},
			);
		}
		else {
			const resetAction = async (action, commitHash) => {
				await repo.value.callGit('reset', action, commitHash);
				await refreshHistory();
				await refreshStatus();
			};

			items.push({
				label: 'Reset HEAD to this commit',
				children: [
					{label: 'Soft',  onClick: async () => resetAction('--soft',  commit.hash)},
					{label: 'Mixed', onClick: async () => resetAction('--mixed', commit.hash)},
					{label: 'Hard',  onClick: async () => resetAction('--hard',  commit.hash)},
				],
			});
		}

		proxy.$contextmenu({x: e.x, y: e.y, items, theme: 'win10 dark'});
	});
});

onBeforeUnmount(() => {
	websocket.value?.close();
});

// --- Provide --- temporary solution - this will by replaced by composables in future
function pw(get, set) {
	return computed({get, set});
}

// Mutable state
provide('config',              pw(() => config.value,              v => (config.value              = v)));
provide('references',          pw(() => references.value,          v => (references.value          = v)));
provide('selected_reference',  pw(() => selected_reference.value,  v => (selected_reference.value  = v)));
provide('hidden_references',   pw(() => hidden_references.value,   v => (hidden_references.value   = v)));
// provide('commits',             pw(() => commits.value,             v => (commits.value             = v)));
provide('selected_commits',    pw(() => selected_commits.value,    v => (selected_commits.value    = v)));
provide('current_branch_name', pw(() => current_branch_name.value, v => (current_branch_name.value = v)));
provide('current_operation',   pw(() => current_operation.value,   v => (current_operation.value   = v)));
provide('working_tree_files',  pw(() => working_tree_files.value,  v => (working_tree_files.value  = v)));
provide('selected_file',       pw(() => selected_file.value,       v => (selected_file.value       = v)));
provide('save_semaphore',      pw(() => save_semaphore.value,      v => (save_semaphore.value      = v)));
provide('commitHistoryKey',    pw(() => commitHistoryKey.value,    v => (commitHistoryKey.value    = v)));
provide('stashes',             pw(() => stashes.value,             v => (stashes.value             = v)));

// Readonly computed
provide('repo',                   repo);
provide('references_by_hash',     references_by_hash);
provide('references_by_type',     references_by_type);
provide('commit_by_hash',         commit_by_hash);
provide('revisions_to_diff',      revisions_to_diff);
provide('current_head',           current_head);
provide('uncommitted_file_count', uncommitted_file_count);
provide('loaded_all',             loaded_all);
provide('websocket',              websocket);

// functions
provide('setSelectedReference', setSelectedReference);
provide('setSelectedCommits',   handleSetSelectedCommits);
provide('isCurrentBranch',      isCurrentBranch);
provide('updateFileStatus',     updateFileStatus);
provide('saveSelectedFile',     saveSelectedFile);
provide('refreshHistory',       refreshHistory);
provide('refreshStatus',        refreshStatus);
provide('getStashes',           getStashes);
</script>
