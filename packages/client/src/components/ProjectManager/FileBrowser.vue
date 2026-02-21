<template>
	<div>
		Server connection status: {{ status }}

		<hr>

		<div v-if="status === ECheckStatuses.Online">
			<!-- todo - browse remote directory, file list, button back (parent directory), etc... -->
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NCard, NForm, NFormItem, NInput, NButton } from 'naive-ui';
import {useServerCheck} from '@/composables/useServerCheck';
import {useProject} from '@/composables/useProject';
import {ECheckStatuses} from '@/types';

const
	path = ref(''),
	{status, check} = useServerCheck(),
	{editableProject} = useProject();

check(editableProject.value.server, editableProject.value.port);

const handleSelect = () => {
	console.log('Selected path:', path.value);
};

</script>

<style scoped>
</style>
