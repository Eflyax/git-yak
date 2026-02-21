<template>
	<div class="project-manager">
		<div class="list">
			<n-input v-model:value="filterText" placeholder="Search projects..." />
			<n-button @click="openAddModal" type="primary" style="margin-top: 10px;">Add Project</n-button>

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
							@click="openEditModal(project)"
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
			<div v-if="editableProject">
				<n-card
					:title="isEditing ? 'Edit Project' : 'Add Project'"
					:bordered="false"
					size="huge"
					role="dialog"
					aria-modal="true"
				>
					<n-form @submit.prevent="handleSave">
						<n-form-item label="Alias">
							<n-input v-model:value="editableProject.alias" placeholder="Project Alias" />
						</n-form-item>
						<n-form-item label="Path">
							<n-input v-model:value="editableProject.path" placeholder="Project Path" />
						</n-form-item>
						<n-form-item label="Server">
							<n-input v-model:value="editableProject.server" placeholder="Server Address" />
						</n-form-item>
						<n-form-item label="Port">
							<n-input-number v-model:value="editableProject.port" placeholder="Port" />
						</n-form-item>
						<n-button type="primary" attr-type="submit">Save</n-button>
					</n-form>
				</n-card>
			</div>
		</div>
	</div>
</template>

<script setup>
import {ref, computed} from 'vue';
import {useProject} from '@/composables/useProject';
import {NButton, NInput, NModal, NCard, NForm, NFormItem, NInputNumber, useDialog} from 'naive-ui';

const
	dialog = useDialog(),
	{projects, addProject, updateProject, removeProject, openProject} = useProject(),
	filterText = ref(''),
	showModal = ref(false),
	isEditing = ref(false),
	editableProject = ref(null),
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

function openAddModal() {
	isEditing.value = false;
	editableProject.value = {
		alias: '',
		path: '',
		server: 'localhost',
		port: 8000
	};
	showModal.value = true;
}

function openEditModal(project) {
	isEditing.value = true;
	editableProject.value = {...project};
	showModal.value = true;
}

function handleSave() {
	if (!editableProject.value.alias || !editableProject.value.path) {
		alert('Alias and Path are required.');
		return;
	}

	if (isEditing.value) {
		updateProject(editableProject.value.id, editableProject.value);
	}
	else {
		addProject(editableProject.value);
	}
	showModal.value = false;
	editableProject.value = null;
}

function confirmDelete(project) {
	dialog.warning({
		title: 'Confirm Delete',
		content: `Are you sure you want to delete project "${project.alias}"?`,
		positiveText: 'Yes, Delete',
		negativeText: 'Cancel',
		onPositiveClick: () => {
			removeProject(project.id);
		},
	});
}
</script>

<style lang="scss" scoped>
.project-manager {
	padding: 20px;
	display: flex;

	.list {
		flex: 1;
	}

	.detail {
		flex: 2;
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
