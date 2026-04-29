<template>
	<span :class="['file-status', `file-status--${status}`]">
		<Icon
			v-if="status === EFileStatus.Modified"
			name="mdi-pencil"
			class="file-status__icon"
		/>
		<Icon
			v-else-if="status === EFileStatus.Added"
			name="mdi-plus"
			class="file-status__icon"
		/>
		<Icon
			v-else-if="status === EFileStatus.Renamed"
			name="mdi-swap-horizontal"
			class="file-status__icon"
		/>
		<Icon
			v-else-if="status === EFileStatus.Deleted"
			name="mdi-minus"
			class="file-status__icon"
		/>
		<Icon
			v-else-if="status === EFileStatus.Conflicted"
			name="mdi-alert-outline"
			class="file-status__icon"
		/>
	</span>
</template>

<script lang="ts" setup>
import Icon from './Icon.vue';
import {EFileStatus} from '@/domain/enums';

defineProps<{
	status: EFileStatus
}>();

</script>

<style lang="scss" scoped>
.file-status {
	display: inline-flex;
	align-items: center;

	&__icon {
		flex-shrink: 0;
		width: 14px;
		height: 14px;
	}

	&--M .file-status__icon { fill: $status-modified; }
	&--A .file-status__icon { fill: $status-added; }
	&--D .file-status__icon { fill: $status-deleted; }
	&--R .file-status__icon { fill: $status-renamed; }
	&--C .file-status__icon { fill: $color-danger; }
}
</style>
