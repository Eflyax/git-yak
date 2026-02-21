export const run = async (ws, data) => {
	const { requestId, repo_path, args, options = {} } = data;
	const { as_buffer = false } = options;

	const executeGit = async () => {
		// Note: The original implementation had an 'as_buffer' option.
		// This implementation decodes stdout as a UTF-8 string for now.
		console.log();
		console.log({git: args});

		const proc = Bun.spawn(['git', ...args], {
			cwd: repo_path,
		});

		// The 'as_buffer' logic is not fully implemented here as we always decode to text.
		const stdout_text = await new Response(proc.stdout).text();
		const stderr_text = await new Response(proc.stderr).text();

		const exitCode = await proc.exited;

		if (exitCode === 0) {
			return stdout_text;
		} else {
			throw new Error(stdout_text + stderr_text);
		}
	};

	let retries = 3;
	let delay = 100;

	while (true) {
		try {
			const result = await executeGit();

			ws.send(JSON.stringify({ requestId, status: 'success', data: result }));
			break;
		} catch (e: any) {
			if (e.message.includes(`.git/index.lock': File exists`) && retries > 0) {
				await new Promise(r => setTimeout(r, delay));
				retries -= 1;
				delay *= 2;
				continue;
			}
			ws.send(JSON.stringify({ requestId, status: 'error', message: e.message }));
			break;
		}
	}
};
