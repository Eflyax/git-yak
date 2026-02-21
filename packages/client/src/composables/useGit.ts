import {ref} from 'vue';
import {useProject} from '@/composables/useProject';

const
	websocket = ref(undefined),
	error_messages = ref([]);

export function useGit() {
	const {currentProject} = useProject();

	async function handleErrors(promise) {
		try {
			return await promise;
		} catch (e) {
			const message = e.message.replace(
				/^Error invoking remote method '[\w-]+': Error: /,
				'',
			);
			if (_.last(error_messages.value) !== message) {
				error_messages.value.push(message);
			}
			throw e;
		}
	};

	async function callGit(...args) {
		const
			payload = {repo_path: currentProject.value.path, args};

		return await handleErrors(websocket.value?.call('git-call', payload));
	};

	return {
		websocket,
		callGit
	};
}
