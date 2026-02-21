import {computed} from 'vue';
import {createDiscreteApi, darkTheme} from 'naive-ui';

const
	{notification} = createDiscreteApi(['notification'], {
		configProviderProps: computed(() => ({theme: darkTheme})),
	});

export const success = (content = 'Success', title?: string) => {
	notification.success({
		content,
		title,
		duration: 3_000,
	});
};

export const warning = (content = 'Warning', title?: string) => {
	notification.warning({
		content,
		title,
		duration: 3_000,
	});
};

export const error = (content = 'Error', title?: string) => {
	notification.error({
		content,
		title,
		duration: 3_000,
	});
};
