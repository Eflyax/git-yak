<template>
	<n-config-provider :theme="darkTheme">
		<div class="app-root">
			<div class="repos">
				<n-button
					title="Add tab"
					type="default"
					class="open-repo"
					@click="mockModalWithPathSelection"
				>
					<!-- @click="addTab" -->
					<icon name="mdi-plus" />
				</n-button>

				<div class="project-list">
					<n-button
						v-for="project in projects"
						:key="project.id"
						@click="openProject = project"
						:title="project.path"
					>
						{{ project.alias || project.path }}
					</n-button>
				</div>
			</div>

			 <div class="tab-wrapper">
				<TabContent
					v-if="openProject"
					:repo_details="openProject"
				/>
			</div>
		</div>
	</n-config-provider>
</template>

<script>
import WindowEventMixin from '@/mixins/WindowEventMixin';
import TabContent from './components/TabContent.vue';
import {electronMock} from './electronMock';
import {darkTheme, NButton, NConfigProvider, NInput, NDatePicker, NSpace} from 'naive-ui';
import {useProject} from './composables/useProject';
import Icon from './widgets/icon.vue';

export default {
	components: {
		NButton,
		TabContent,
		NConfigProvider,
		NInput,
		NDatePicker,
		NSpace,
		Icon,
	},
	mixins: [
		WindowEventMixin('keydown', 'onKeyDown')
	],
	setup() {
		const
			{projects, openProject, addProject} = useProject();

		return {
			addProject,
			darkTheme,
			projects,
			openProject
		}
	},
	created() {
		window.electron = electronMock;
	},
	methods: {
		mockModalWithPathSelection() {
			this.addProject({
				alias: 'TSS',
				path: '/Users/eflyax/development/typescript-imports-sort',
				server: 'localhost',
					port: 3000,
			});
		},
		closeTab(tab) {
			_.remove(this.tabs, { id: tab.id });

			if (this.selectedTabId === tab.id) {
				this.selectedTabId = _.last(this.tabs)?.id;
			}
		},
		addTab() {
			const
				id = this.getNextId();

			this.tabs.push({id});
			this.selectedTabId = id;
		},
		onKeyDown(event) {
			if (event.ctrlKey && event.key === "t") {
				this.addTab();
			}
		},
	},
};
</script>

<style lang="scss" scoped>
.project-list {
	display: flex;
	flex-direction: column;
	gap: 5px;
	margin-top: 10px;
}
</style>
