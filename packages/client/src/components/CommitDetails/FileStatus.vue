<template>
	<span class="file-status">
		<icon
			v-if="status === 'M'"
			name="mdi-pencil"
			class="file-status modified"
		/>
		<icon
			v-else-if="status === 'A'"
			name="mdi-plus"
			class="added"
		/>
		<icon
			v-else-if="status === 'D'"
			name="mdi-minus"
			class="deleted"
		/>
	</span>
</template>

<script>
export default {
	props: {
		status: {
			type: String,
			required: true
		}
	}
}
</script>

<style>
.file-status {
	/*display: inline;*/
	/*margin-top: 5px;
	width: 13px;*/

	.modified {
		fill: #FFC107;
	}

	.added {
		fill: #4CAF50;
	}

	.deleted {
		fill: #F44336;
	}
}
</style>
