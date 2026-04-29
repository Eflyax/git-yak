import {ref, readonly} from 'vue';
import type {IFileStatus} from '@/domain';
import {EFileArea, EFileStatus} from '@/domain';
import {useGit} from './useGit';

const EMPTY_TREE_HASH = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

const original = ref('');
const modified = ref('');

export function useFileDiff() {
	const {callGit, readFile, activePath} = useGit();

	async function loadOriginal(file: IFileStatus, rev1: string): Promise<string> {
		if (file.status === EFileStatus.Added) return '';

		const rev = file.area === EFileArea.Unstaged ? ':0' : rev1;

		if (rev === 'EMPTY_ROOT' || rev === EMPTY_TREE_HASH) return '';

		const filePath = ([EFileStatus.Renamed, EFileStatus.Conflicted] as string[]).includes(file.status)
			? (file.oldPath ?? file.path)
			: file.path;

		try {
			return await callGit('show', `${rev}:${filePath}`);
		}
		catch {
			return '';
		}
	}

	async function loadModified(file: IFileStatus, rev0: string): Promise<string> {
		if (file.status === EFileStatus.Deleted) return '';

		const rev = file.area === EFileArea.Staged ? ':0' : rev0;

		if (rev === 'WORKING_TREE') {
			try {
				return await readFile(file.path);
			}
			catch {
				return '';
			}
		}

		try {
			return await callGit('show', `${rev}:${file.path}`);
		}
		catch {
			return '';
		}
	}

	async function loadDiff(file: IFileStatus, revisions: [string, string] = ['WORKING_TREE', 'HEAD']): Promise<void> {
		activePath.value = file.path;

		const [rev0, rev1] = revisions;

		[original.value, modified.value] = await Promise.all([
			loadOriginal(file, rev1),
			loadModified(file, rev0),
		]);
	}

	return {
		original: readonly(original),
		modified: readonly(modified),
		loadDiff,
	};
}
