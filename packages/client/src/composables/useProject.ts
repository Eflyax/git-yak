import {ref, readonly} from 'vue';
import type {Project} from '@/types';

const
	projects = ref<Project[]>([]),
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

function saveProjects() {
	try {
		localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects.value));
	}
	catch (e) {
		console.error('Failed to save projects to localStorage', e);
	}
}

export function useProject() {

	function generateId(): string {
			return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}

	function addProject(projectData: Omit<Project, 'id' | 'order' | 'dateLastOpen'>): Project {
		const
			newProject: Project = {
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

	function updateProject(projectId: string, updates: Partial<Omit<Project, 'id'>>) {
		const
			project = projects.value.find(p => p.id === projectId);

		if (project) {
			Object.assign(project, updates);
			if (updates.hasOwnProperty('path') || updates.hasOwnProperty('alias')) {
					// just an example of a potential update side-effect
			}
			saveProjects();
		}
	}

	return {
		projects: readonly(projects),
		addProject,
		removeProject,
		updateProject,
	};
}
