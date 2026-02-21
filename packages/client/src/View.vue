<template>
	<div class="repos">
		<n-button
			title="Add tab"
			type="info"
			secondary
			class="open-repo"
			@click="openProject(null)"
		>
			<icon name="mdi-folder" />
		</n-button>

		<div class="project-list">
			<n-button
				v-for="project in projects"
				:key="project.id"
				@click="openProject(project)"
				:title="project.path"
			>
				{{ project.alias || project.path }}
			</n-button>
		</div>
	</div>

	 <div class="tab-wrapper">
		<TabContent
			v-if="currentProject"
			:key="currentProject.id"
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
import ProjectManager from '@/components/ProjectManager/ProjectManager.vue';

export default {
	components: {
		ProjectManager,
		TabContent,
		NButton
	},
	setup() {
		const
			notification = useNotification(),
			{projects, openProject, addProject, currentProject, openLastProject} = useProject();

		openLastProject();

		return {
			notification,
			addProject,
			projects,
			currentProject,
			openProject
		}
	},
	created() {
		window.electron = electronMock;
	}
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
