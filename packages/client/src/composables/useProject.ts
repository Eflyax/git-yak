import {ref, readonly} from 'vue';
import type {IProject} from '@/types';

const
	projects = ref<IProject[]>([]),
	currentProject = ref<IProject | null>(null),
	editableProject = ref<IProject | null>(null),
	PROJECTS_STORAGE_KEY = 'projects';

try {
	const savedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);

	if (savedProjects) {
		projects.value = JSON.parse(savedProjects);
	}
}
catch (e) {
	console.error('Failed to parse projects from localStorage', e);
	projects.value = [];
}

export function useProject() {

	function generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}

	function addProject(projectData: Omit<IProject, 'id' | 'order' | 'dateLastOpen'>): IProject {
		const
			newProject: IProject = {
				...projectData,
				id: generateId(),
				order: projects.value.length,
				dateLastOpen: Date.now(),
			};

		projects.value.push(newProject);
		saveProjects();

		return newProject;
	}

	function removeProject(projectId: string) {
		const index = projects.value.findIndex(p => p.id === projectId);

		if (index > -1) {
			projects.value.splice(index, 1);
			saveProjects();
		}
	}

	function saveProjects() {
		try {
			localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects.value));
		}
		catch (e) {
			console.error('Failed to save projects to localStorage', e);
		}
	}

	function updateProject(projectId: string, updates: Partial<Omit<IProject, 'id'>>) {
		const
			project = projects.value.find(p => p.id === projectId);

		if (project) {
			Object.assign(project, updates);
			if (updates.hasOwnProperty('path') || updates.hasOwnProperty('alias')) {
				// just an example of a potential update side-effect
			}
			saveProjects();
		}

		return project;
	}

	function openLastProject() {
		const lastProject = projects.value.sort((a, b) => b.dateLastOpen - a.dateLastOpen)[0];

		if (lastProject) {
			currentProject.value = lastProject;
		}
	}

	function openProject(project) {
		project = updateProject(project.id, {dateLastOpen: Date.now()});
		currentProject.value = project;
		saveProjects();
	}

	return {
		projects: readonly(projects),
		currentProject: readonly(currentProject),
		openProject,
		addProject,
		removeProject,
		updateProject,
		editableProject,
		openLastProject
	};
}
