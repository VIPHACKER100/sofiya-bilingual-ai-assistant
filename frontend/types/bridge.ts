// Types for SOFIYA System Bridge API

export interface SystemStatus {
    success: boolean;
    battery: {
        percent: number | null;
        power_plugged: boolean | null;
        secs_left: number | null;
    };
    cpu: {
        percent: number;
        count: number;
    };
    memory: {
        total: number;
        used: number;
        percent: number;
        available: number;
    };
    disk: {
        total: number;
        used: number;
        free: number;
        percent: number;
    };
    network: {
        bytes_sent: number;
        bytes_recv: number;
        packets_sent: number;
        packets_recv: number;
    };
    uptime: number;
    volume: number;
    platform: string;
    timestamp: string;
    error?: string;
}

export interface CommandRequest {
    id: string;
    command: string;
    language: 'en' | 'hi';
    timestamp: number;
}

export interface CommandResponse {
    success: boolean;
    action_type?: string;
    command_key: string;
    language: 'en' | 'hi';
    response: string;
    requires_confirmation?: boolean;
    confirmation_id?: string;
    data?: Record<string, unknown>;

    error?: string;
    volume?: number;
    timestamp: string;
}

export interface ConfirmationRequest {
    confirmation_id: string;
    command_key: string;
    command_text: string;
    language: 'en' | 'hi';
    response: string;
    timeout: number;
}

export interface WebSocketMessage {
    type: 'command_response' | 'system_status' | 'confirmation_request' | 'error' | 'pong';
    data?: unknown;

    message?: string;
    timestamp?: string;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';
