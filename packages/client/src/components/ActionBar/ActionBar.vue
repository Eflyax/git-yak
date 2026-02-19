<template>
	<div class="action-bar">
		<div v-if="current_operation?.conflict" class="text-gray italic">
			Functionality limited during conflict
		</div>

		<template v-for="action in actions">
			<n-button
				strong
				type="info"
				:click_twice="action.click_twice ? 'text-accent' : false"
				:disabled="action.disabled"
				:title="action.title"
				@click="action.callback"
				:class="action.class"
			>
				<template #icon>
					<icon :name="action.icon" class="size-6" />
				</template>
				 <!-- {{ action.label }} -->
			</n-button>
		</template>

		<BranchModal v-if="show_branch_modal" @close="show_branch_modal = false" />
	</div>
</template>

<script>
import WindowEventMixin from "@/mixins/WindowEventMixin";
import { restoreWip } from "@/utils/actions";
import BranchModal from "./BranchModal.vue";
import {NButton} from 'naive-ui';

export default {
	components: {
		BranchModal,
		NButton
	},
	mixins: [WindowEventMixin("keydown", "onKeyDown")],
	inject: [
		"tab_active",
		"repo",
		"config",
		"references_by_type",
		"hidden_references",
		"current_branch_name",
		"current_head",
		"current_operation",
		"uncommitted_file_count",
		"saveSelectedFile",
		"refreshHistory",
		"refreshStatus",
	],
	data: () => ({
		show_branch_modal: false,
	}),
	computed: {
		last_wip_branch() {
			const branches = _.filter(
				this.references_by_type.local_branch ?? [],
				(branch) =>
					branch.name.startsWith(settings.wip_prefix) &&
					!this.hidden_references.has(branch.id),
			);
			return _.last(_.sortBy(branches, "date"));
		},
		actions() {
			return [
				...(this.current_operation?.conflict
					? []
					: [
							{
								icon: "mdi-source-branch",
								label: "Branch",
								callback: () => (this.show_branch_modal = true),
							},
							{
								icon: "mdi-archive-arrow-down-outline",
								label: "Stash",
								callback: this.saveStash,
								disabled: this.uncommitted_file_count === 0,
							},
							// {
							// 	icon: "mdi-archive-arrow-down-outline",
							// 	label: "Save WIP",
							// 	callback: this.saveWip,
							// 	disabled: this.uncommitted_file_count === 0,
							// },
							{
								icon: "mdi-archive-arrow-up-outline",
								label: "Pop stahs",
								title:
									this.last_wip_branch === undefined
										? ""
										: `Will restore ${this.last_wip_branch.name}`,
								callback: this.popStash,
								disabled: false, //this.last_wip_branch === undefined,
							},
							// {
							// 	icon: "mdi-archive-arrow-up-outline",
							// 	label: "Restore WIP",
							// 	title:
							// 		this.last_wip_branch === undefined
							// 			? ""
							// 			: `Will restore ${this.last_wip_branch.name}`,
							// 	callback: this.restoreWip,
							// 	disabled: this.last_wip_branch === undefined,
							// },
							// {
							// 	icon: "mdi-check-all",
							// 	label:
							// 		"Quick amend" +
							// 		(this.current_operation?.type === "rebase"
							// 			? " & proceed"
							// 			: ""),
							// 	title:
							// 		"Stage all changes and amend the last commit (skipping hooks)" +
							// 		(this.current_operation?.type === "rebase"
							// 			? ", then proceed with the rebase"
							// 			: ""),
							// 	callback: this.amendCommit,
							// 	disabled: this.uncommitted_file_count === 0,
							// },
						]),
				// {
				// 	separator: true,
				// },
				{
					icon: "mdi-console",
					label: "Open terminal",
					title: "(Alt+T)",
					class: 'open-console',
					callback: this.repo.openTerminal,
				},
				...(this.config?.custom_actions
					? [
							{
								separator: true,
							},
							...this.config.custom_actions.map((action) => ({
								...action,
								callback: () => this.repo.callGit(...action.command),
							})),
						]
					: []),
			];
		},
	},
	methods: {
		async saveStash() {
			await Promise.all([
				this.refreshHistory(),
				this.refreshStatus(),
				this.repo.callGit('stash')
			]);
		},
		async popStash() {
			await Promise.all([
				this.refreshHistory(),
				this.refreshStatus(),
				this.repo.callGit('stash', 'pop')
			]);
		},
		// async saveWip() {
		// 	await this.saveSelectedFile();

		// 	// https://stackoverflow.com/questions/17415579/how-to-iso-8601-format-a-date-with-timezone-offset-in-javascript
		// 	const formatted_time = new Date().toLocaleString("sv").replace(/\D/g, "");
		// 	await Promise.all([
		// 		this.repo.callGit(
		// 			"checkout",
		// 			"-b",
		// 			settings.wip_prefix + formatted_time,
		// 		),
		// 		this.repo.callGit("add", "--all"),
		// 	]);
		// 	await this.repo.callGit("commit", "--message", "WIP", "--no-verify");
		// 	await this.repo.callGit(
		// 		"checkout",
		// 		this.current_branch_name ?? this.current_head,
		// 	);

		// 	await Promise.all([this.refreshHistory(), this.refreshStatus()]);
		// },
		// async restoreWip() {
		// 	await this.saveSelectedFile();

		// 	await restoreWip.call(this, this.last_wip_branch);
		// },
		async amendCommit() {
			await this.saveSelectedFile();
			try {
				await this.repo.callGit("add", "--all");
				await this.repo.callGit(
					"commit",
					"--amend",
					"--no-edit",
					"--no-verify",
				);

				if (this.current_operation?.type === "rebase") {
					await this.repo.callGit(this.current_operation.type, "--skip");
				}
			} finally {
				await Promise.all([this.refreshHistory(), this.refreshStatus()]);
			}
		},
		async onKeyDown(event) {
			if (event.altKey && event.key === "t") {
				await this.repo.openTerminal();
			}
		},
	},
};
</script>
