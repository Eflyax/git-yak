<template>
	<n-config-provider :theme="darkTheme" :theme-overrides="themeOverrides">
		<n-notification-provider :placement="'bottom-left'">
			<n-message-provider>
				<n-dialog-provider>
					<AppLayout />
				</n-dialog-provider>
			</n-message-provider>
		</n-notification-provider>
	</n-config-provider>
</template>

<script setup lang="ts">
import {darkTheme} from 'naive-ui';
import {NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider} from 'naive-ui';
import AppLayout from '@/ui/components/AppLayout.vue';

const themeOverrides = {
	common: {
		primaryColor: '#6f9ef8',
		primaryColorHover: '#8fb4ff',
		bodyColor: '#0d0f11',
		cardColor: '#111418',
		fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		fontFamilyMono: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
	},
};
</script>
