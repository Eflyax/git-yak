import {defineConfig, loadEnv} from 'vite';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {merge} from 'lodash-es';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';

const
	currentDir = dirname(fileURLToPath(new URL(import.meta.url))),
	srcDir = join(currentDir, 'src');

export default defineConfig(({mode}) => {
	const
		env = loadEnv(mode, process.cwd(), ''),
		alias = {
			'@': srcDir
		},
		build = {
			outDir: 'dist/client'
		},
		server = {
			cors: true,
			// fs: {
			// 	allow: [
			// 		'..',
			// 		'.'
			// 	]
			// },
			allowedHosts: true
		},
		plugins = [
			vue()
		];

	merge(server, {
		host: true,
		port: env.DEV_APP_PORT,
		strictPort: true
	});

	return {
		build,
		css: {
			preprocessorOptions: {
				devSourcemap: true
			},
			scss: {
			 additionalData: `
					@import "@/styles/colors.scss";
				`// todo
			},
		},
		esbuild: {
			target: 'es2022'
		},
		base: '/',
		plugins,
		publicDir: 'src/public',
		resolve: {
			alias,
			dedupe: ['vue', 'naive-ui']
		},
		server,
		sourcemap: mode === 'development'
	};
});
