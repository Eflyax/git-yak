<template>
	<div
		class="file-row"
		:class="{active}"
		:title="
			(['R', 'C'].includes(file.status) ? `${file.old_path} -> ` : '') +
			file.path
		"
	>
	 	<file-status
			:status="file.status"
		/>

		<file-path
			:path="file.path"
			@click="selected_file = file"
		/>

		<div
			class="file-row-actions"
		>
			<template v-if="file.area === 'staged'">
				<n-button
					class="file-action"
					type="error"
					size="tiny"
					secondary
					@click="run('unstage')"
				>
					Untage file
				</n-button>
			</template>
			<template v-else>
				<n-button
					class="file-action"
					type="success"
					size="tiny"
					secondary
					@click="run('stage')"
				>
					Stage file
				</n-button>
			</template>

			<!-- <btn
				v-for="action in file.area === 'unstaged'
					? ['discard', 'stage']
					: file.area === 'staged'
						? ['unstage']
						: []"
				:click_twice="action === 'discard' && 'text-red'"
				:title="$_.title(action)"
				@click="run(action)"
			>
				<icon
					:name="$settings.icons[action]"
				/>
			</btn> -->
		</div>
	</div>
</template>

<script>
import {NButton} from 'naive-ui';

export default {
	components: {
		NButton
	},
	inject: [
		'repo',
		'selected_file',
		'updateFileStatus',
		'saveSelectedFile'
	],
	props: {
		file: {
			type: Object,
			required: true
		}
	},
	computed: {
		active() {
			return _.isEqual(this.file, this.selected_file);
		},
	},
	methods: {
		async run(action) {
			await this.saveSelectedFile();

			if (action === 'stage') {
				await this.repo.callGit('add', '--', this.file.path);
			}
			else if (action === 'unstage') {
				await this.repo.callGit(
					'restore',
					'--staged',
					'--',
					this.file.path,
					..._.filter([this.file.old_path]),
				);
			}
			else if (action === 'discard') {
				if (this.file.status === 'A') {
					await this.repo.callGit('clean', '--force', '--', this.file.path);
				}
				else {
					await this.repo.callGit('checkout', '--', this.file.path);
				}
			}
			await this.updateFileStatus(this.file);
		},
	},
};
</script>

<style scoped lang="scss">
@use '../../styles/colors.scss';

.file-row {
	align-items: center;
	cursor: pointer;
	display: flex;
	height: 30px;
	padding: 0 5px;

	.file-action {
		display: none;
	}

	&:hover {
		background-color: colors.$secondary;

		.file-action {
			display: inline-block;
		}
	}

	&.active {
		background-color: colors.$secondary;
		color: black;
	}
}
</style>
