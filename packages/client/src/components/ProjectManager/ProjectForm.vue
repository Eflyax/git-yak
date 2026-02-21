<template>
	<div v-if="editableProject">
		<n-card
			:title="editableProject.id ? 'Edit Project' : 'Add Project'"
			:bordered="false"
			size="huge"
			role="dialog"
			aria-modal="true"
		>
			<n-form>
				<n-space vertical>
					<n-form-item label="Alias">
						<n-input v-model:value="editableProject.alias" placeholder="Project Alias" />
					</n-form-item>

					<n-radio-group
						v-model:value="localhost"
						name="radiobuttongroup1"
					>
						<n-radio-button :value="true">
							<icon name="mdi-laptop" />
							This PC
						</n-radio-button>
						<n-radio-button :value="false">
							<icon name="mdi-server" />
							Remote server
						</n-radio-button>
					</n-radio-group>

					<n-input-group v-if="!localhost">
						<n-input v-model:value="editableProject.server" placeholder="Server Address" />
						<n-input-number v-model:value="editableProject.port" placeholder="Port" />
					</n-input-group>

					Project Path
					<n-input-group >
						<n-input
							v-model:value="editableProject.path" placeholder="Project Path"
							disabled
						/>
						<n-button
							type="info"
							ghost
							@click="browseFiles"
						>
							Browse...
						</n-button>
					</n-input-group>
				</n-space>

				<hr>

				<n-button
					@click="handleSave"
					type="success"
				>
					Save
				</n-button>
			</n-form>
		</n-card>

		<NModal
			v-model:show="showModal"
			title="Select repository path"
			preset="card"
			style="width: 800px;"
		>
			<file-browser />
		</NModal>
	</div>
</template>

<script setup lang="ts">
import {useProject} from '@/composables/useProject';
import {computed, ref} from 'vue';
import FileBrowser from '@/components/ProjectManager/FileBrowser.vue';
import {defaultConfiguration} from '@/settings';
import {NButton,NSpace, NInput, NModal, NInputGroup, NCard, NForm, NRadioButton, NRadioGroup, NFormItem, NInputNumber} from 'naive-ui';

const
	showModal = ref(false),
	{addProject, updateProject, editableProject} = useProject(),
	localhost = computed({
		get: () => {
			return editableProject.value.server === 'localhost';
		},
		set: (value) => {
			if (value) {
				editableProject.value.server = 'localhost';
				editableProject.value.port = defaultConfiguration.ServerPort;
			}
			else {
				editableProject.value.server = '';
				editableProject.value.port = defaultConfiguration.ServerPort;
			}
		}
	});

function handleSave() {
	if (!editableProject.value.alias || !editableProject.value.path) {
		alert('Alias and Path are required.');
		return;
	}

	if (editableProject.value.id) {
		updateProject(editableProject.value.id, editableProject.value);
	}
	else {
		addProject(editableProject.value);
	}
	editableProject.value = null;

	success();
}

function browseFiles() {
	showModal.value = true;
}

</script>
