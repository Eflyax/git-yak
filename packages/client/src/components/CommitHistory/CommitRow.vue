<template>
	<div
		class="commit-row"
		:class="isSelected ? 'active' : '[&:not(:first-child)]:*:text-gray'"
		@click="select"
	>
		<div v-if="commit.hash === ECommitHashes.WorkingTree">
			<template v-if="current_operation !== null">
				[{{ current_operation.label }}]
			</template>
			<template v-if="uncommitted_file_count === 0">
				Working tree clean
			</template>
			<template v-else>
				<div
					v-for="(count, status) in workingTreeFileStatuses"
					:key="status"
					class="working-tree-files"
				>
					<file-status
						:status="status"
					/>
					{{ count }}
				</div>
			</template>
		</div>
		<template v-else>
			<div
				class="commit-subject"
				:title="commit.subject"
			>
				{{ commit.subject }}
			</div>
			<div class="commit-meta">
				<span class="author">{{ commit.author_name }}</span>
				<span class="hash">{{ commit.hash_abbr }}</span>
			</div>
		</template>
	</div>
</template>

<script>
import {ECommitHashes} from '@/types';

export default {
	inject: [
		'commits',
		'commit_by_hash',
		'selected_commits',
		'current_operation',
		'uncommitted_file_count',
		'working_tree_files',
		'selected_file',
		'setSelectedCommits',
	],
	props: {
		commit: {
			type: Object,
			default: null
		},
	},
	data() {
		return {
			ECommitHashes
		}
	},
	computed: {
		isSelected() {
			return this.selected_commits.includes(this.commit.hash);
		},
		workingTreeFileStatuses() {
			const result = {
				'M': 0,
				'A': 0,
				'D': 0
			};

			for (const treeStatus of ['staged', 'unstaged']) {
				for (const file of this.working_tree_files[treeStatus]) {
					if (file.status === 'M') {
						result['M']++;
					}
					else if (file.status === 'D') {
						result['D']++;
					}
					else if (file.status === 'A') {
						result['A']++;
					}
				}
			}

			return result;
		}
	},
	methods: {
		select(event) {
			if (event.shiftKey && this.selected_commits.length > 0) {
				let source = this.commit_by_hash[_.last(this.selected_commits)];
				let target = this.commit;
				if (target.index < source.index) {
					[source, target] = [target, source];
				}
				const path = [];

				for (const commit of this.commits) {
					if (commit.index >= source.index) {
						path.push(commit);
					}
					if (commit.index === target.index) {
						break;
					}
				}
				if (this.commit !== target) {
					path.reverse();
				}
				this.setSelectedCommits(
					_.uniq([...this.selected_commits, ..._.map(path, 'hash')]),
				);
			}
			else if (event.ctrlKey) {
				this.setSelectedCommits(
					_.xor(this.selected_commits, [this.commit.hash]),
				);
			}
			else {
				this.setSelectedCommits([this.commit.hash]);
			}
		},
	},
};
</script>
