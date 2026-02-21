<template>
	<div class="commit-browser">
		<div class="graph-container">
			<svg
				class="svg"
				:width="svgDimensions.width"
				:height="svgDimensions.height"
			>
				 <g v-for="commit in commits" :key="commit.hash">
					<rect
						:x="CONFIG.PADDING_LEFT + commit.level * CONFIG.X_STEP - 1"
						:y="commit.index * CONFIG.Y_STEP"
						:width="svgDimensions.width"
						:height="CONFIG.Y_STEP - rowMarginBottom"
						:fill="getColor(commit.level)"
						:fill-opacity="this.selected_commits.includes(commit.hash) ? '50%' : '10%'"
					/>

					<rect
						v-if="commit.hash !== 'WORKING_TREE'"
						:x="svgDimensions.width - 2"
						:y="commit.index * CONFIG.Y_STEP  "
						:width="2"
						:height="CONFIG.Y_STEP - rowMarginBottom"
						:fill="getColor(commit.level)"
					/>
				</g>

				<g v-for="commit in commits" :key="commit.hash">
					<template v-for="parentHash in commit.parents" :key="parentHash">
						<path
							v-if="commitMap.get(parentHash)"
							:d="getTopologyPath(commit, parentHash)"
							:stroke="getColor(commit.level)"
							:stroke-width="CONFIG.LINE_WIDTH"
							:stroke-dasharray="commit.hash === 'WORKING_TREE' || commit.isStash ? [2] : undefined"
							fill="none"
							opacity="0.9"
						/>

						 <line
							v-if="commit.references.length && !commit.isStash"
							:x1="CONFIG.PADDING_LEFT + commit.level * CONFIG.X_STEP"
							:y1="(CONFIG.PADDING_TOP + commit.index * CONFIG.Y_STEP) - rowMarginBottom"
							:x2="CONFIG.PADDING_LEFT + commit.level * CONFIG.X_STEP - svgDimensions.width"
						 	:y2="(CONFIG.PADDING_TOP + commit.index * CONFIG.Y_STEP) - rowMarginBottom"
							:stroke="getColor(commit.level)"
						/>
					</template>

				 <g v-if="commit.isStash">
						<rect
							:x="CONFIG.PADDING_LEFT + commit.level * CONFIG.X_STEP - CONFIG.CIRCLE_R"
							:y="(CONFIG.PADDING_TOP + commit.index * CONFIG.Y_STEP) - rowMarginBottom - CONFIG.CIRCLE_R"
							:width="CONFIG.CIRCLE_R * 2"
							:height="CONFIG.CIRCLE_R * 2"
							:stroke="getColor(commit.level)"
							:stroke-width="CONFIG.LINE_WIDTH"
							:stroke-dasharray="[2]"
						/>
						<ArchiveIcon
							:href="archiveOutline"
							:x="CONFIG.PADDING_LEFT + commit.level * CONFIG.X_STEP - CONFIG.CIRCLE_R"
							:y="(CONFIG.PADDING_TOP + commit.index * CONFIG.Y_STEP) - rowMarginBottom - CONFIG.CIRCLE_R"
							:width="CONFIG.CIRCLE_R * 2"
							:height="CONFIG.CIRCLE_R * 2"
							:fill="getColor(commit.level)"
						/>
					</g>
					<circle
						v-else
						:cx="CONFIG.PADDING_LEFT + commit.level * CONFIG.X_STEP"
						:cy="(CONFIG.PADDING_TOP + commit.index * CONFIG.Y_STEP) - rowMarginBottom"
						:r="getCommitRadius(commit)"
						:fill="commit.hash === 'WORKING_TREE' ? '' : getColor(commit.level)"
						:stroke="commit.hash === 'WORKING_TREE' ? getColor(commit.level) : '#1e1e1e'"
						:stroke-dasharray="commit.hash === 'WORKING_TREE' ? [2] : undefined"
						:stroke-width="CONFIG.LINE_WIDTH"
					/>
				</g>
			</svg>
		</div>

		<div class="list-container" :style="{paddingTop: '0px'}">
			<CommitRow
				v-for="commit in commits"
				:key="commit.hash"
				:commit="commit"
				@click="printCommit(commit)"
			/>
		</div>

	</div>
</template>

<script>
import CommitRow from './CommitRow.vue';
import {CONFIG} from '@/settings';
import {useStash} from '@/composables/useStash';
import {useCommits} from '@/composables/useCommits';
import ArchiveIcon from '@/assets/svg/archive-outline.svg?component';

export default {
	components: {
		CommitRow,
		ArchiveIcon
	},
	inject: [
		'commit_by_hash',
		'selected_commits',
	],
	props: {
		scroll_position: {
			type: Number,
			required: true
		},
	},
	setup() {
		const
			{stashes} = useStash(),
			{commits} = useCommits();

		return {
			commits,
			stashes
		};
	},
	data() {
		return {
			commitsToRender: [],
			CONFIG,
			rowMarginBottom: 5 / 1
		}
	},
	computed: {
		commitMap() {
			const map = new Map();
			this.commits.forEach(c => map.set(c.hash, c));
			return map;
		},
		svgDimensions() {
			if (this.commits.length === 0) {
				return { width: 0, height: 0 };
			}

			const maxLevel = Math.max(...this.commits.map(c => c.level || 0));

			return {
				width: (maxLevel + 1) * CONFIG.X_STEP + CONFIG.PADDING_LEFT + 20,
				height: this.commits.length * CONFIG.Y_STEP + 20
			};
		}
	},
	mounted() {
		//
	},
	methods: {
		printCommit(commit) {
			console.log(commit);
		},
		getCommitRadius(commit) {
			const
				radiusDivider = commit.parents.length > 1 ? 2 : 1;

			return CONFIG.CIRCLE_R / radiusDivider;
		},
		getTopologyPath(commit, parentHash) {
			const
				parent = this.commitMap.get(parentHash);

			if (!parent) {
				return null;
			}

			const
				startX = CONFIG.PADDING_LEFT + commit.level * CONFIG.X_STEP,
				startY = CONFIG.PADDING_TOP + commit.index * CONFIG.Y_STEP - this.rowMarginBottom,
				endX = CONFIG.PADDING_LEFT + parent.level * CONFIG.X_STEP,
				endY = CONFIG.PADDING_TOP + parent.index * CONFIG.Y_STEP - this.rowMarginBottom;

			if (commit.level === parent.level) {
				return `M ${startX} ${startY + CONFIG.CIRCLE_R} L ${endX} ${endY - CONFIG.CIRCLE_R}`;
			}

			const
				deltaLevel = commit.level - parent.level,
				xDir = endX > startX ? 1 : -1,
				yDir = 1;

			if (deltaLevel < 0) {
				const
					fromX = startX + (CONFIG.CIRCLE_R * xDir),
					fromY = startY,
					targetX = endX,
					targetY = endY - CONFIG.CIRCLE_R,
					width = Math.abs(endX - startX),
					height = Math.abs(endY - startY),
					r = Math.min(CONFIG.CORNER_RADIUS / 1.5, width / 2, height / 2);

				return `
					M ${fromX} ${fromY}
					L ${targetX - (r * xDir)} ${fromY}
					Q ${targetX} ${fromY} ${targetX} ${fromY + r}
					L ${targetX} ${targetY}
				`;
			}
			else {
				const
					fromX = startX,
					fromY = startY + (CONFIG.CIRCLE_R * yDir),
					targetX = endX - (CONFIG.CIRCLE_R * xDir),
					targetY = endY,
					r = Math.min(CONFIG.CORNER_RADIUS / 1.5, Math.abs(endY - startY) / 2);

				return `
					M ${fromX} ${fromY}
					L ${fromX} ${targetY - r}
					Q ${fromX} ${targetY} ${fromX + (r * xDir)} ${targetY}
					L ${targetX} ${targetY}
				`;
			}
		},
		getColor(level) {
			return CONFIG.COLORS[level % CONFIG.COLORS.length];
		},
	},
};
</script>

<style scoped>
.commit-browser {
	display: flex;
	font-family: -apple-system, "system-ui", sans-serif;
	/*font-family: 'Fira Code', monospace;*/
	background-color: #090a0b;
	color: #d4d4d4;
	overflow: auto;
}

.graph-container {
	flex-shrink: 0;
	cursor: pointer;
}

.svg {
	height: unset;
	width: unset;
}
</style>
