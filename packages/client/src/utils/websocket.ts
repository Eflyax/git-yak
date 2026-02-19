export class WebSocketClient {

	private ws: WebSocket;
	private pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }>();
	private messageQueue: string[] = [];
	private isConnected = false;

	constructor(url: string) {
		this.ws = new WebSocket(url);

		this.ws.onopen = () => {
			this.isConnected = true;
			console.log("WebSocket connection established");
			this.messageQueue.forEach(message => this.ws.send(message));
			this.messageQueue = [];
		};

		this.ws.onmessage = (event) => {

		// console.log("RECEIVED:", event.data);

			try {
				const response = JSON.parse(event.data);

				if (response.requestId && this.pendingRequests.has(response.requestId)) {
					const { resolve, reject } = this.pendingRequests.get(response.requestId)!;

					if (response.status === 'success') {
						resolve(response.data);
					}
					else {
						console.error("Received error from server:", response);
						reject(new Error(response.message));
					}
					this.pendingRequests.delete(response.requestId);
				}
				else if (response.status === 'error') {
					console.error("Received error from server:", response.message);
				}
				else {
					// This handles the initial "Hello from Bun" message and other logs
					console.log("Received message:", event.data);
				}
			}
			catch (error) {
				console.error("Error parsing WebSocket message:", error);
			}
		};

		this.ws.onclose = () => {
			this.isConnected = false;
			console.log("WebSocket connection closed");
			this.pendingRequests.forEach(({ reject }) => reject(new Error("WebSocket connection closed.")));
			this.pendingRequests.clear();
		};

		this.ws.onerror = (error) => {
			console.error("WebSocket error:", error);
		};
	}

	private generateRequestId(): string {
		return `${Date.now()}-${Math.random()}`;
	}

	public call(command: string, payload: any): Promise<any> {
		return new Promise((resolve, reject) => {
			const requestId = this.generateRequestId();
			this.pendingRequests.set(requestId, { resolve, reject });

			const message = JSON.stringify({
				requestId,
				command,
				...payload
			});

			if (this.isConnected) {
				this.ws.send(message);
			} else {
				this.messageQueue.push(message);
			}
		});
	}

	public close() {
			this.ws.close();
	}
}
