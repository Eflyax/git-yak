<template>
	<div
		class="tab-content"
	>
		<div
			v-if="openProject.path === undefined"
		>
			<input
				v-model.trim="openProject.title"
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
							 {{ openProject.path?.split('/').pop() }}
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

				<!-- <ReferenceList /> -->
				<!-- <split-pane
					:dbl-click-splitter="false"
					@resized="main_pane_size = $event[0].size"
				> -->
				<!-- <n-split direction="horizontal">
					<template #1>
						<n-split direction="vertical"
							v-show="selected_file === null"
							:dbl-click-splitter="false"
							@resized="references_pane_size = $event[0].size"
						>
							<template #1 :size="references_pane_size">
								 <ReferenceList />

							</template>
							<template #2>
								<CommitHistory
									ref="commit_history"
								/>
							</template>
						</n-split>
						<FileDiff
							v-if="selected_file !== null"
							ref="file_diff"
							/>
					 </template>
					<template #2>
						<CommitDetails
							v-if="selected_commits.length > 0"
						/>
						<ReferenceDetails
							v-else-if="selected_reference !== null"
						/>
					</template>
				</n-split> -->
			</div>
		</template>
	</div>

	<modal v-if="error_messages.length > 0" @close="error_messages.shift()">
		<div class="whitespace-pre font-mono">
			{{ error_messages[0] }}
		</div>
	</modal>
</template>

<script>
import JSON5 from "json5";
import { computed as vue_computed } from "vue/dist/vue.esm-bundler";
import StoreMixin from "@/mixins/StoreMixin";
import { getStatus } from "@/utils/git";
import ActionBar from "./ActionBar/ActionBar.vue";
import CommitDetails from "./CommitDetails/CommitDetails.vue";
import CommitHistory from "./CommitHistory/CommitHistory.vue";
import FileDiff from "./FileDiff/FileDiff.vue";
import ReferenceDetails from "./ReferenceDetails/ReferenceDetails.vue";
import ReferenceList from "./ReferenceList/ReferenceList.vue";
import {Splitpanes, Pane} from 'splitpanes';
import { ESystemEvents } from "../types";
import {WebSocketClient} from '@/utils/websocket';
import {useProject} from '@/composables/useProject';

function provideReactively({ data = () => ({}), computed = {}, methods = {} }) {
	return {
		provide() {
			const
				names = [
					...Object.keys(data()),
					...Object.keys(computed),
					...Object.keys(methods),
				],
			 entries = Object.fromEntries(
				names.map((name) => [
					name,
					vue_computed({
						get: () => this[name],
						set: (value) => (this[name] = value),
					}),
				]),
			);

			return {
				...entries,
				websocket: this.websocket
			}
		},
		data,
		computed,
		methods,
	};
}

export default {
	components: {
		ActionBar,
		CommitDetails,
		CommitHistory,
		FileDiff,
		ReferenceDetails,
		ReferenceList,
		Splitpanes,
		Pane,
	},
	mixins: [
		provideReactively({
			data: () => ({
				config: undefined,
				references: undefined,
				selected_reference: null,
				hidden_references: new Set(),
				commits: undefined,
				selected_commits: [],
				current_branch_name: null,
				current_operation: null,
				working_tree_files: undefined,
				selected_file: null,
				save_semaphore: Promise.resolve(),
				commitHistoryKey: 0
			}),
			computed: {
				repo() {
					const handleErrors = async (promise) => {
						try {
							return await promise;
						} catch (e) {
							const message = e.message.replace(
								/^Error invoking remote method '[\w-]+': Error: /,
								"",
							);
							if (_.last(this.error_messages) !== message) {
								this.error_messages.push(message);
							}
							throw e;
						}
					};

					const electronFuncs = Object.fromEntries(
						["openTerminal", "writeFile", "deleteFile"].map((func_name) => [
							func_name,
							async (...args) =>
								await handleErrors(
									window.electron[func_name](this.openProject.path, ...args),
								),
						]),
					);

					const callGitOverWebSocket = async (...args) => {
						const payload = {
							repo_path: this.openProject.path,
							args: args,
						};
						return await handleErrors(this.websocket.call("git-call", payload));
					};

					const readFileOverWebSocket = async (file_path, options = {}) => {
						const payload = {
							repo_path: this.openProject.path,
							file_path,
							options,
						};
						return await handleErrors(
							this.websocket.call("read-file", payload),
						);
					};

					return Object.freeze({
						...electronFuncs,
						callGit: callGitOverWebSocket,
						readFile: readFileOverWebSocket,
					});
				},
				references_by_hash() {
					return _.groupBy(this.references, "hash");
				},
				references_by_type() {
					return _.groupBy(this.references, "type");
				},
				commit_by_hash() {
					return _.keyBy(this.commits, "hash");
				},
				revisions_to_diff() {
					if (this.selected_commits.length === 1) {
						const commit = this.commit_by_hash[this.selected_commits[0]];
						const parent =
							commit.hash === "WORKING_TREE"
								? "HEAD"
								: (commit.parents[0] ?? "EMPTY_ROOT");
						return [commit.hash, parent];
					} else if (this.selected_commits.length === 2) {
						return _.sortBy(
							this.selected_commits,
							(hash) => this.commit_by_hash[hash].index,
						);
					}
				},
				current_head() {
					return this.references_by_type.head[0].hash;
				},
				uncommitted_file_count() {
					if (this.working_tree_files === undefined) {
						return 0;
					}
					const unique_file_paths = new Set(
						_.map(
							[
								...this.working_tree_files.unstaged,
								...this.working_tree_files.staged,
							],
							"path",
						),
					);
					return unique_file_paths.size;
				},
			},
			methods: {
				setSelectedReference(reference) {
					this.selected_reference = reference;
					if (reference !== null) {
						this.setSelectedCommits([]);
					}
				},
				setSelectedCommits(hashes) {
					this.selected_commits = hashes;
					if (hashes.length > 0) {
						this.setSelectedReference(null);
					}
				},
				isCurrentBranch(reference) {
					return (
						(reference.type === "local_branch" &&
							reference.name === this.current_branch_name) ||
						reference.type === "head"
					);
				},
				async updateFileStatus(file) {
					// https://stackoverflow.com/questions/71268388/show-renamed-moved-status-with-git-diff-on-single-file
					const status = await getStatus(
						this.repo,
						"--",
						file.path,
						..._.filter([file.old_path]),
					);
					const files = _.cloneDeep(this.working_tree_files);

					for (const area of ["unstaged", "staged"]) {
						files[area] = _.reject(files[area], { path: file.path });
						files[area] = _.sortBy([...files[area], ...status[area]], "path");
					}
					this.working_tree_files = Object.freeze(files);
				},
				async saveSelectedFile() {
					return await this.$refs.file_diff?.save();
				},
				async refreshHistory(...args) {
					await this.$refs.commit_history.loadHistory(...args);
				},
				async refreshStatus() {
					await this.$refs.commit_history.loadStatus();
				},
			},
		}),
		StoreMixin("main_pane_size", 75),
		StoreMixin("references_pane_size", 15),
	],
	setup() {
		const {openProject} = useProject();

		return {
			openProject
		}
	},
	data() {
		return {
			error_messages: [],
			websocket: undefined
		};
	},
	watch: {
		openProject: {
			async handler() {
				if (this.openProject.path !== undefined) {
					this.websocket = new WebSocketClient(`ws://${this.openProject.server}:${this.openProject.port}`);

					const hidden_references_content = await this.repo.readFile(
						".git/.git-cracken/hidden-refs.txt",
						{ null_if_not_exists: true },
					);
					this.hidden_references = new Set(
						hidden_references_content?.split("\n") ?? [],
					);

					const config_content = await this.repo.readFile(
						".git/.git-cracken/config.json5",
						{ null_if_not_exists: true },
					);
					this.config = Object.freeze(JSON5.parse(config_content ?? "{}"));
				}
			},
			deep: true,
			immediate: true,
		},
		hidden_references: {
			async handler() {
				await this.repo.writeFile(
					".git/.git-cracken/hidden-refs.txt",
					[...this.hidden_references].join("\n"),
					{ make_directory: true },
				);
			},
			deep: true,
		},
	},
	async mounted() {

		// todo
		this.$emitter.on(ESystemEvents.RerenderCommitHistory, () => {
			this.commitHistoryKey++;
			console.log('Commit history rerendered', this.commitHistoryKey);
		});

		this.$emitter.on(ESystemEvents.OpenContextMenuCommit , (argument) => {
			const
				{e, commit} = argument,
				items = [];

			if (commit.isStash) {
				const
					stashAction = async (action, stashId) => {
						await this.repo.callGit('stash', action, stashId);
						await this.refreshHistory();
						await this.refreshStatus();

						// todo - on success delete commit stash?
						this.$emitter.emit(ESystemEvents.RerenderCommitHistory);
					}

				items.push({
					label: 'Apply stash',
					onClick: async () => {
						await stashAction('apply', commit.id);
					}
				}, {
					label: 'Pop stash',
					onClick: async () => {
						await stashAction('pop', commit.id);
					}
				}, {
					label: 'Delete stash',
					onClick: async () => {
						await stashAction('drop', commit.id);
					}
				});
			}
			else {
				const
					resetAction = async (action, commitHash) => {
						await this.repo.callGit('reset', action, commitHash);
						await this.refreshHistory();
						await this.refreshStatus();
					};

				items.push({
					label: 'Reset HEAD to this commit',
					children: [{
						label: 'Soft',
						onClick: async () => {
							await resetAction('--soft', commit.hash);
						}
					}, {
						label: 'Mixed',
						onClick: async () => {
							await resetAction('--mixed', commit.hash);
						}
					}, {
						label: 'Hard',
						onClick: async () => {
							await resetAction('--hard', commit.hash);
						}
					}]
				});
			}

			this.$contextmenu({
				x: e.x,
				y: e.y,
				items,
				theme: 'win10 dark',
			});
		});
	},
	beforeUnmount() {
		if (this.websocket) {
			this.websocket.close();
		}
	},
	methods: {
		async openRepo() {
			// path =
			let path = await window.electron.openRepo();

			if (path !== undefined) {
				path = path.replace(/\\/g, "/");
				this.openProject.path = path;
				this.openProject.title ??= path.slice(path.lastIndexOf("/") + 1);
			}

			return path;
		},
	},
};
</script>
