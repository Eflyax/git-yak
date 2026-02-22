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
						:height="CONFIG.Y_STEP - ROW_MARGIN_BOTTOM"
						:fill="getColor(commit.level)"
						:fill-opacity="this.selected_commits.includes(commit.hash) ? '50%' : '10%'"
					/>

					<rect
						v-if="commit.hash !== 'WORKING_TREE'"
						:x="svgDimensions.width - 2"
						:y="commit.index * CONFIG.Y_STEP  "
						:width="2"
						:height="CONFIG.Y_STEP - ROW_MARGIN_BOTTOM"
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
							:y1="(CONFIG.PADDING_TOP + commit.index * CONFIG.Y_STEP) - ROW_MARGIN_BOTTOM"
							:x2="CONFIG.PADDING_LEFT + commit.level * CONFIG.X_STEP - svgDimensions.width"
						 	:y2="(CONFIG.PADDING_TOP + commit.index * CONFIG.Y_STEP) - ROW_MARGIN_BOTTOM"
							:stroke="getColor(commit.level)"
							:stroke-width="commit.hash == current_head ? CONFIG.LINE_WIDTH * 2: CONFIG.LINE_WIDTH / 2"
						/>
					</template>

				 <g v-if="commit.isStash">
						<rect
							:x="CONFIG.PADDING_LEFT + commit.level * CONFIG.X_STEP - CONFIG.CIRCLE_R"
							:y="(CONFIG.PADDING_TOP + commit.index * CONFIG.Y_STEP) - ROW_MARGIN_BOTTOM - CONFIG.CIRCLE_R"
							:width="CONFIG.CIRCLE_R * 2"
							:height="CONFIG.CIRCLE_R * 2"
							:stroke="getColor(commit.level)"
							:stroke-width="CONFIG.LINE_WIDTH"
							:stroke-dasharray="[2]"
						/>
						<ArchiveIcon
							:href="archiveOutline"
							:x="CONFIG.PADDING_LEFT + commit.level * CONFIG.X_STEP - CONFIG.CIRCLE_R"
							:y="(CONFIG.PADDING_TOP + commit.index * CONFIG.Y_STEP) - ROW_MARGIN_BOTTOM - CONFIG.CIRCLE_R"
							:width="CONFIG.CIRCLE_R * 2"
							:height="CONFIG.CIRCLE_R * 2"
							:fill="getColor(commit.level)"
						/>
					</g>
					<circle
						v-else
						:cx="CONFIG.PADDING_LEFT + commit.level * CONFIG.X_STEP"
						:cy="(CONFIG.PADDING_TOP + commit.index * CONFIG.Y_STEP) - ROW_MARGIN_BOTTOM"
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
			/>
		</div>
	</div>
</template>

<script>
import CommitRow from './CommitRow.vue';
import {CONFIG} from '@/settings';
import {useStash} from '@/composables/useStash';
import {useCommits} from '@/composables/useCommits';
import {useGraph} from '@/composables/useGraph';
import ArchiveIcon from '@/assets/svg/archive-outline.svg?component';

export default {
	components: {
		CommitRow,
		ArchiveIcon
	},
	inject: [
		'commit_by_hash',
		'selected_commits',
		'current_head'
	],
	setup() {
		const
			{stashes} = useStash(),
			{commits, commitMap} = useCommits(),
			{
				svgDimensions,
				ROW_MARGIN_BOTTOM,
				getColor,
				getCommitRadius,
				getTopologyPath
			} = useGraph();

		return {
			commitMap,
			svgDimensions,
			commits,
			stashes,
			svgDimensions,
			getColor,
			getCommitRadius,
			getTopologyPath,
			ROW_MARGIN_BOTTOM,
			CONFIG
		};
	}
};
</script>

<style scoped>
.commit-browser {
	display: flex;
	font-family: -apple-system, "system-ui", sans-serif;
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
