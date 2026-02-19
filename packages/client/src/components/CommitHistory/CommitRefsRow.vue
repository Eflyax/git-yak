<template>
	<div :class="[
		'commit-refs-row',
		isSelected ? 'active' : ''
	]"
	>
		<div
			v-for="reference in references"
			:key="reference.id"
			:title="getTitle(reference)"
			@dblclick="checkoutBranch(reference)"
			@click="setSelectedCommits([commit.hash])"
			:style="{
				backgroundColor: getColor(commit.level),
			}"
			:class="[
				'tag',
				 commit.hash == current_head ? 'active' : ''
			]"
		>
			<template v-if="reference.type === 'branch'">
				<icon name="mdi-source-branch" />
				<icon
					v-if="reference.isLocal"
					name="mdi-laptop"
					title="Local"
				/>
				<icon
					v-if="reference.remotes.length > 0"
					name="mdi-cloud-outline"
					:title="`Remotes: ${reference.remotes.join(', ')}`"
				/>
				<span class="name">
					{{ reference.name }}
				</span>
			 </template>
			<template v-else>
				<icon
					v-if="reference.type !== 'head'"
					:name="$settings.icons[reference.type]"
					@click="printInfo(reference)"
				/>
				<span class="name">
					{{ reference.name }}
				</span>
			</template>
		</div>
	</div>
</template>

<script>
import {NTag} from 'naive-ui';
import {CONFIG} from '@/settings';

export default {
	components: {
		NTag
	},
	inject: [
		'repo',
		'hidden_references',
		'current_branch_name',
		'setSelectedReference',
		'isCurrentBranch',
		'refreshHistory',
		'refreshStatus',
		'selected_commits',
		'setSelectedCommits',
		'current_head'
	],
	props: {
		commit: {
			type: Object,
			default: null
		},
	},
	data() {
		return {
			CONFIG
		}
	},
	computed: {
		references() {
			const references = this.commit.references.filter(
				(ref) =>
					!this.hidden_references.has(ref.id) &&
					(ref.type !== "head" || this.current_branch_name === null),
			);

			const branchRefs = references.filter(ref => ref.type === 'local_branch' || ref.type === 'remote_branch');
			const otherRefs = references.filter(ref => ref.type !== 'local_branch' && ref.type !== 'remote_branch');

			const groupedBranches = _.groupBy(branchRefs, ref => {
				if (ref.type === 'local_branch') {
					return ref.name;
				}
				// remote_branch. name is like 'origin/master'. We want 'master'
				const parts = ref.name.split('/');
				return parts.slice(1).join('/');
			});

			const mergedBranches = Object.values(groupedBranches).map(group => {
				const local = group.find(ref => ref.type === 'local_branch');
				const remotes = group.filter(ref => ref.type === 'remote_branch');

				if (!local && remotes.length === 0) return null;

				const name = local ? local.name : remotes[0].name.split('/').slice(1).join('/');

				return {
					id: `branch:${name}`,
					name: name,
					type: 'branch', // My synthetic type
					isLocal: !!local,
					remotes: remotes.map(r => r.name.split('/')[0]),
					representativeRef: local || remotes[0],
				};
			}).filter(Boolean);

			const finalRefs = [...mergedBranches, ...otherRefs];

			return _.sortBy(finalRefs, (ref) => {
				const sortRef = ref.representativeRef || ref;
				if (this.isCurrentBranch(sortRef)) {
					return -1;
				}

				// Give 'branch' a sort order similar to 'local_branch'
				let typeToSort = sortRef.type;
				if (ref.type === 'branch') {
					typeToSort = 'local_branch';
				}

				return settings.referenceTypeOrder.indexOf(typeToSort);
			});
		},
		isSelected() {
			return this.selected_commits.includes(this.commit.hash);
		},
	},
	methods: {
		getColor(level) {
			return CONFIG.COLORS[level % CONFIG.COLORS.length];
		},
		printInfo(reference) {
			// console.log(this.commit);
			console.log(reference);

		},
		getTitle(reference) {
			if (reference.type === 'branch') {
				let title = 'Branch';
				if (reference.isLocal) title += ' (local)';
				if (reference.remotes.length > 0) title += ` (remotes: ${reference.remotes.join(', ')})`;

				if (this.isCurrentBranch(reference.representativeRef)) {
					title += " (current)";
				} else if (reference.isLocal) {
					title += "\n(double-click to checkout)";
				}
				return title;
			}

			let title = _.title(reference.type);

			if (this.isCurrentBranch(reference)) {
				title += " (current)";
			}
			else if (reference.type === "local_branch") {
				title += "\n(double-click to checkout)";
			}

			return title;
		},
		async checkoutBranch(reference) {
			const
				refToCheck = reference.type === 'branch'
					? reference.representativeRef
					: reference;

			// if (
			// 	this.isCurrentBranch(refToCheck) ||
			// 	refToCheck.type !== "local_branch"
			// ) {
			// 	console.log({
			// 		refToCheck: {
			// 			refToCheck
			// 		}
			// 	})
			// 	return;
			// }
			// await this.repo.callGit("checkout", refToCheck.name);

			//
			//
			//
			await this.repo.callGit('fetch', 'origin');
			await this.repo.callGit('checkout', refToCheck.name);
			await this.repo.callGit('reset', '--hard', `origin/${refToCheck.name}`);

			await Promise.all([this.refreshHistory(), this.refreshStatus()]);
		},
	},
};
</script>
