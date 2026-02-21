<template>
	<n-config-provider :theme="darkTheme">
		<n-notification-provider :placement="'top-left'">
			<n-dialog-provider>
				<div class="app">
					<View />
				</div>
			</n-dialog-provider>
		</n-notification-provider>
	</n-config-provider>
</template>

<script>
import {darkTheme, NDialogProvider, NConfigProvider, NNotificationProvider} from 'naive-ui';
import View from './View.vue';

export default {
	components: {
		NNotificationProvider,
		NDialogProvider,
		NConfigProvider,
		View
	},
	data() {
		return {
			darkTheme
		};
	}
}
</script>
