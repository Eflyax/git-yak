<template>
	<div class="project-manager">
		<div class="list">
			<n-input v-model:value="filterText" placeholder="Search projects..." />
			<n-button @click="openAdd" type="primary" style="margin-top: 10px;">Add Project</n-button>

			<div class="project-list">
				<div v-for="project in filteredProjects" :key="project.id" class="project-item">
					<div>
						<span class="alias">{{ project.alias }}</span>
						<span class="path">{{ project.path }}</span>
					</div>
					<div class="actions">
						<n-button
							@click="openProject = project"
							type="success"
							size="small"
						>
							<template #icon>
								<icon name="mdi-play" />
							</template>
						</n-button>
						<n-button
							@click="openEdit(project)"
							size="small"
							type="info"
						>
							<template #icon>
								<icon name="mdi-pencil" />
							</template>
						</n-button>
						<n-button @click="confirmDelete(project)" size="small" type="error">
							<template #icon>
								<icon name="mdi-trash-can" />
							</template>
						</n-button>
					</div>
				</div>
			</div>
		</div>

		<div class="detail">
			<project-form />
		</div>
	</div>
</template>

<script setup>
import {ref, computed} from 'vue';
import {useProject} from '@/composables/useProject';
import {NButton, NInput, useDialog} from 'naive-ui';
import ProjectForm from '@/components/ProjectManager/ProjectForm.vue';

const
	dialog = useDialog(),
	{
		projects,
		editableProject,
		removeProject,
		openProject
	} = useProject(),
	filterText = ref(''),
	filteredProjects = computed(() => {
		if (!filterText.value) {
			return projects.value;
		}
		const
			lowerCaseFilter = filterText.value.toLowerCase();

		return projects.value.filter(p =>
			(p.alias && p.alias.toLowerCase().includes(lowerCaseFilter)) ||
			(p.path && p.path.toLowerCase().includes(lowerCaseFilter))
		);
	});

function openAdd() {
	editableProject.value = {
		alias: '',
		path: '',
		server: 'localhost',
		port: 8_000
	};
}

function openEdit(project) {
	editableProject.value = {...project};
}

function confirmDelete(project) {
	dialog.warning({
		title: 'Confirm Delete',
		content: `Are you sure you want to delete project "${project.alias}"?`,
		positiveText: 'Yes, Delete',
		negativeText: 'Cancel',
		onPositiveClick: () => {
			removeProject(project.id);
			success();
		},
	});
}
</script>

<style lang="scss" scoped>
.project-manager {
	padding: 20px;
	display: flex;

	.list {
		width: 800px;
	}

	.detail {
		width: 500px;
	}
}

.project-list {
	margin-top: 20px;
	display: flex;
	flex-direction: column;
	gap: 5px;
}

.project-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px;
	border: 1px solid #3a3a3a;
	border-radius: 4px;

	.alias {
		font-weight: bold;
	}

	.path {
		margin-left: 10px;
		font-size: 0.9em;
		color: #888;
	}
}

.actions {
	display: flex;
	gap: 10px;
}
</style>
