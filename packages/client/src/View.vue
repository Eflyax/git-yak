<template>
	<div class="repos">
		<n-button
			title="Add tab"
			type="info"
			secondary
			class="open-repo"
			@click="openProject = null"
		>
			<icon name="mdi-folder" />
		</n-button>

		<div class="project-list">
			<n-button
				v-for="project in projects"
				:key="project.id"
				@click="openProject = project"
				:title="project.path"
			>
				{{ project.alias || project.path }}
			</n-button>
		</div>
	</div>

	 <div class="tab-wrapper">
		<TabContent
			v-if="openProject"
			:key="openProject.id"
		/>
		<project-manager v-else/>
	</div>
</template>

<script>
import WindowEventMixin from '@/mixins/WindowEventMixin';
import TabContent from './components/TabContent.vue';
import {electronMock} from './electronMock';
import {useNotification, NButton} from 'naive-ui';
import {useProject} from './composables/useProject';
import ProjectManager from '@/components/ProjectManager.vue';

export default {
	components: {
		ProjectManager,
		TabContent,
		NButton
	},
	mixins: [
		WindowEventMixin('keydown', 'onKeyDown')
	],
	setup() {
		const
			notification = useNotification(),
			{projects, openProject, addProject} = useProject();

		return {
			notification,
			addProject,
			projects,
			openProject
		}
	},
	created() {
		window.electron = electronMock;
	},
	methods: {
		mockModalWithPathSelection() {
			this.addProject({
				alias: 'AA',
				path: '/Users/eflyax/development/typescript-imports-sort',
				server: 'localhost',
					port: 3000,
			});
		},
		closeTab(tab) {
			_.remove(this.tabs, { id: tab.id });

			if (this.selectedTabId === tab.id) {
				this.selectedTabId = _.last(this.tabs)?.id;
			}
		},
		addTab() {
			const
				id = this.getNextId();

			this.tabs.push({id});
			this.selectedTabId = id;
		},
		onKeyDown(event) {
			if (event.ctrlKey && event.key === "t") {
				this.addTab();
			}
		},
	},
};
</script>

<style lang="scss" scoped>
.project-list {
	display: flex;
	flex-direction: column;
	gap: 5px;
	margin-top: 10px;
}
</style>
