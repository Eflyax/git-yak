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
						@click="openProject(project)"
						:title="project.path"
					>
						{{ project.alias || project.path }}
					</n-button>
				</div>
			</div>

			 <div class="tab-wrapper">
				<template v-for="tab in tabs" :key="tab.id">
					<TabContent
						v-if="tabs_initialized.has(tab.id)"
						:active="tab.id === selected_tab_id"
						:repo_details="tab"
					/>
				</template>
			</div>
		</div>
	</n-config-provider>
</template>

<script>
import WindowEventMixin from '@/mixins/WindowEventMixin';
import TabContent from './components/TabContent.vue';
import {electronMock} from './electronMock';
import {darkTheme, NButton, NConfigProvider, NInput, NDatePicker, NSpace} from 'naive-ui';
import { useProject } from './composables/useProject';
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
			{projects, addProject} = useProject();

		return {
			addProject,
			darkTheme,
			projects,
		}
	},
	data: () => ({
		tabs: [],
		selected_tab_id: null,
		tabs_initialized: new Set(),
	}),
	watch: {
		selected_tab_id: {
			handler(id) {
				if (id) {
					this.tabs_initialized.add(id);
				}
			},
			immediate: true,
		},
	},
	created() {
		let
			last_id = 0;

		this.getNextId = () => ++last_id;
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
		openProject(project) {
			const existingTab = this.tabs.find(tab => tab.projectPath === project.path);

			if (existingTab) {
				this.selected_tab_id = existingTab.id;
				return;
			}

			const id = this.getNextId();
			const newTab = {
				id,
				projectPath: project.path,
				name: project.alias,
			};
			this.tabs.push(newTab);
			this.selected_tab_id = id;
		},
		closeTab(tab) {
			_.remove(this.tabs, { id: tab.id });

			if (this.selected_tab_id === tab.id) {
				this.selected_tab_id = _.last(this.tabs)?.id;
			}
		},
		addTab() {
			const
				id = this.getNextId();

			this.tabs.push({id});
			this.selected_tab_id = id;
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
