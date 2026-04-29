export interface ContextSegment {
	type: 'context';
	lines: string[];
}

export interface ConflictBlock {
	type: 'conflict';
	index: number;
	ours: string[];
	theirs: string[];
}

export type ConflictSegment = ContextSegment | ConflictBlock;

export function parseConflicts(content: string): ConflictSegment[] {
	const allLines = content.split('\n');
	// Drop trailing empty line produced by split
	const lines = allLines[allLines.length - 1] === '' ? allLines.slice(0, -1) : allLines;

	const segments: ConflictSegment[] = [];
	let contextLines: string[] = [];
	let conflictIndex = 0;
	let i = 0;

	while (i < lines.length) {
		const line = lines[i]!;

		if (line.startsWith('<<<<<<<')) {
			if (contextLines.length) {
				segments.push({type: 'context', lines: contextLines});
				contextLines = [];
			}

			const ours: string[] = [];
			const theirs: string[] = [];
			let inOurs = true;
			i++;

			while (i < lines.length) {
				const l = lines[i]!;
				if (l.startsWith('=======')) {
					inOurs = false;
				} else if (l.startsWith('>>>>>>>')) {
					break;
				} else if (inOurs) {
					ours.push(l);
				} else {
					theirs.push(l);
				}
				i++;
			}

			segments.push({type: 'conflict', index: conflictIndex++, ours, theirs});
		} else {
			contextLines.push(line);
		}
		i++;
	}

	if (contextLines.length) {
		segments.push({type: 'context', lines: contextLines});
	}

	return segments;
}

export function resolveConflicts(
	segments: ConflictSegment[],
	resolutions: Map<number, 'ours' | 'theirs'>,
): string {
	const lines: string[] = [];

	for (const segment of segments) {
		if (segment.type === 'context') {
			lines.push(...segment.lines);
		} else {
			const choice = resolutions.get(segment.index);
			if (choice === 'ours') lines.push(...segment.ours);
			else if (choice === 'theirs') lines.push(...segment.theirs);
		}
	}

	return lines.join('\n') + '\n';
}
