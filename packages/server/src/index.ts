import {serve} from 'bun';
import {defaultConfiguration} from '../../client/src/settings';
import * as gitCallCommand from './commands/gitCall';
import * as readFileCommand from './commands/readFile';
import * as fileBrowserCommand from './commands/fileBrowser';

serve({
	fetch(req, server) {
		if (server.upgrade(req)) {
			return;
		}
		return new Response("Upgrade failed :(", { status: 500 });
	},
	websocket: {
		async message(ws, message) {
			let data;

			try {
				data = JSON.parse(message.toString());

				const
					{command} = data;

				if (command === 'git-call') {
					await gitCallCommand.run(ws, data);
				}
				else if (command === 'read-file') {
					await readFileCommand.run(ws, data);
				}
				else if (command === 'browse-files') {
					await fileBrowserCommand.run(ws, data);
				}
				else {
					ws.send(JSON.stringify({message: `You said: ${message}`}));
				}
			}
			catch (error: any) {
				console.error('Failed to process message', error);

				ws.send(JSON.stringify({
					requestId: data?.requestId,
					status: 'error',
					message: 'Invalid message format or error processing message.',
					details: error.message
				}));
			}
		},
		open(ws) {
			console.log("WebSocket connection opened");
			ws.send(JSON.stringify({message: 'Hello'}));
		},
		close(ws, code, reason) {
			console.log('WebSocket connection closed', code, reason);
		},
	},
	port: defaultConfiguration.ServerPort,
});

console.log(`Server running on port ${defaultConfiguration.ServerPort}`);
