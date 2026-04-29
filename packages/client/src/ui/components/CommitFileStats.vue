<template>
	<div class="commit-stats">
		<template v-if="props[EFileStatus.Modified]">
			<FileStatus :status="EFileStatus.Modified" /> {{ props[EFileStatus.Modified] }}
		</template>

		<template v-if="props[EFileStatus.Added]">
			<FileStatus :status="EFileStatus.Added" /> {{ props[EFileStatus.Added] }}
		</template>

		<template v-if="props[EFileStatus.Deleted]">
			<FileStatus :status="EFileStatus.Deleted" /> {{ props[EFileStatus.Deleted] }}
		</template>

		<template v-if="props[EFileStatus.Renamed]">
			<FileStatus :status="EFileStatus.Renamed" /> {{ props[EFileStatus.Renamed] }}
		</template>
	</div>
</template>

<script lang="ts" setup>
import {EFileStatus} from '@/domain';
import FileStatus from '@/ui/components/FileStatus.vue';

const props = defineProps<{
	A: number
	M: number
	D: number
	R: number
}>();

</script>
