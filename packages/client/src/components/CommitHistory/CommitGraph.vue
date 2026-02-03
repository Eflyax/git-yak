<template>
	<div class="commit-browser">
		<div class="graph-container">
			<svg
				class="svg"
				:width="svgDimensions.width"
				:height="svgDimensions.height"
			>
				<g v-for="commit in commits" :key="commit.hash">
					<template v-for="parentHash in commit.parents" :key="parentHash">
						<path
							v-if="commitMap.get(parentHash)"
							:d="getTopologyPath(commit, parentHash)"
							:stroke="getColor(commit.level)"
							:stroke-width="CONFIG.LINE_WIDTH"
							fill="none"
							opacity="0.7"
						/>
					</template>

					<circle
						:cx="CONFIG.PADDING_LEFT + commit.level * CONFIG.X_STEP"
						:cy="CONFIG.PADDING_TOP + commit.index * CONFIG.Y_STEP"
						:r="CONFIG.CIRCLE_R"
						:fill="getColor(commit.level)"
						stroke="#1e1e1e"
						stroke-width="2"
					/>
				</g>
			</svg>
		</div>

		<div class="list-container" :style="{ paddingTop: '0px' }">
			<CommitRow
				v-for="commit in commits"
				:key="commit.hash"
				:commit="commit"
				:style="{
					height: `${CONFIG.Y_STEP}px`
				}"
			/>
		</div>

	</div>
</template>

<script>
import CommitRow from './CommitRow.vue';
import {CONFIG} from '@/settings';

export default {
	components: {
		CommitRow
	},
	inject: [
		'commits',
		'commit_by_hash',
		'selected_commits',
	],
	props: {
		row_height: {
			type: Number,
			required: true
		},
		scroll_position: {
			type: Number,
			required: true
		},
	},
	data() {
		return {
			CONFIG
		}
	},
	watch: {
		// commits() {
		// 	this.draw();
		// },
		// scroll_position() {
		// 	this.draw();
		// },
		// selected_commits() {
		// 	this.draw();
		// }
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
		// console.log(this.commits);
	},
	methods: {
		getTopologyPath(commit, parentHash) {
			const
				parent = this.commitMap.get(parentHash);

			if (!parent) {
				return null;
			}

			const
				startX = CONFIG.PADDING_LEFT + commit.level * CONFIG.X_STEP,
				startY = CONFIG.PADDING_TOP + commit.index * CONFIG.Y_STEP,
				endX = CONFIG.PADDING_LEFT + parent.level * CONFIG.X_STEP,
				endY = CONFIG.PADDING_TOP + parent.index * CONFIG.Y_STEP;

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
	font-family: 'Fira Code', monospace;
	background-color: #1e1e1e;
	color: #d4d4d4;
	overflow: auto;
}

.graph-container {
	flex-shrink: 0;
	border-right: 1px solid #333;
}

.svg {
	height: unset;
	width: unset;
}
</style>
