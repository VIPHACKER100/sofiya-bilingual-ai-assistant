import {
    WebSocketMessage,
    CommandResponse,
    ConnectionStatus
} from '../types/bridge';


type MessageHandler = (message: WebSocketMessage) => void;
type StatusHandler = (status: ConnectionStatus) => void;

class BridgeService {
    private ws: WebSocket | null = null;
    private url = 'ws://localhost:8000/ws';
    private apiUrl = 'http://localhost:8000/api';
    private reconnectInterval = 3000;
    private maxReconnectAttempts = 10;
    private reconnectAttempts = 0;

    private messageHandlers: MessageHandler[] = [];
    private statusHandlers: StatusHandler[] = [];
    private pingInterval: number | null = null;
    private isIntentionallyClosed = false;


    constructor(wsUrl?: string, apiUrl?: string) {
        if (wsUrl) this.url = wsUrl;
        if (apiUrl) this.apiUrl = apiUrl;
    }

    // Connection management
    connect(): void {
        if (this.ws?.readyState === WebSocket.OPEN) return;

        this.isIntentionallyClosed = false;
        this.notifyStatusChange('connecting');

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('[SOFIYA Bridge] Connected');
                this.reconnectAttempts = 0;
                this.notifyStatusChange('connected');
                this.startPingInterval();
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('[SOFIYA Bridge] Error parsing message:', error);
                }
            };

            this.ws.onclose = () => {
                this.stopPingInterval();
                this.notifyStatusChange('disconnected');

                if (!this.isIntentionallyClosed) {
                    this.attemptReconnect();
                }
            };

            this.ws.onerror = (error) => {
                console.error('[SOFIYA Bridge] WebSocket error:', error);
                this.notifyStatusChange('disconnected');
            };

        } catch (error) {
            console.error('[SOFIYA Bridge] Error creating WebSocket:', error);
            this.attemptReconnect();
        }
    }

    disconnect(): void {
        this.isIntentionallyClosed = true;
        this.stopPingInterval();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[SOFIYA Bridge] Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`[SOFIYA Bridge] Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

        setTimeout(() => {
            this.connect();
        }, this.reconnectInterval);
    }

    // Message handling
    private handleMessage(message: WebSocketMessage): void {
        this.messageHandlers.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error('[SOFIYA Bridge] Error in message handler:', error);
            }
        });
    }

    onMessage(handler: MessageHandler): () => void {
        this.messageHandlers.push(handler);
        return () => {
            this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
        };
    }

    // Status handling
    private notifyStatusChange(status: ConnectionStatus): void {
        this.statusHandlers.forEach(handler => {
            try {
                handler(status);
            } catch (error) {
                console.error('[SOFIYA Bridge] Error in status handler:', error);
            }
        });
    }

    onStatusChange(handler: StatusHandler): () => void {
        this.statusHandlers.push(handler);
        return () => {
            this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
        };
    }

    // Commands via WebSocket
    sendCommand(command: string, language: 'en' | 'hi' = 'en'): void {
        if (this.ws?.readyState !== WebSocket.OPEN) {
            console.error('[SOFIYA Bridge] WebSocket not connected');
            return;
        }

        const message = {
            type: 'command',
            command,
            language,
            timestamp: Date.now()
        };

        this.ws.send(JSON.stringify(message));
    }

    requestStatus(): void {
        if (this.ws?.readyState !== WebSocket.OPEN) return;

        this.ws.send(JSON.stringify({
            type: 'get_status',
            timestamp: Date.now()
        }));
    }

    // REST API Methods
    async confirmCommand(confirmationId: string, approved: boolean): Promise<{ success: boolean; result?: CommandResponse }> {
        try {
            const response = await fetch(`${this.apiUrl}/confirm/${confirmationId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ approved }),
            });
            return await response.json();
        } catch (error) {
            console.error('[SOFIYA Bridge] Error sending confirmation:', error);
            return { success: false };
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.apiUrl}/system/status`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Ping/Pong for keep-alive
    private startPingInterval(): void {
        this.pingInterval = window.setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'ping',
                    timestamp: Date.now()
                }));
            }
        }, 30000); // Ping every 30 seconds
    }

    private stopPingInterval(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    // Getters
    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    get currentStatus(): ConnectionStatus {
        if (this.ws?.readyState === WebSocket.OPEN) return 'connected';
        if (this.ws?.readyState === WebSocket.CONNECTING) return 'connecting';
        return 'disconnected';
    }
}

export const bridgeService = new BridgeService();
