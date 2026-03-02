import { useState, useEffect, useCallback, useRef } from 'react';
import { bridgeService } from '../services/bridgeService';
import {
    SystemStatus,
    CommandResponse,
    ConfirmationRequest,
    ConnectionStatus,
    WebSocketMessage
} from '../types/bridge';

interface UseSystemBridgeReturn {
    // Connection
    isConnected: boolean;
    connectionStatus: ConnectionStatus;

    // System status
    systemStatus: SystemStatus | null;

    // Commands
    sendCommand: (command: string, language?: 'en' | 'hi') => void;
    lastResponse: CommandResponse | null;
    resetLastResponse: () => void;

    // Confirmations
    pendingConfirmation: ConfirmationRequest | null;
    confirmAction: (approved: boolean) => void;

    // Error
    error: string | null;

    // Actions
    reconnect: () => void;
    requestStatus: () => void;
}

export function useSystemBridge(): UseSystemBridgeReturn {
    // State
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [lastResponse, setLastResponse] = useState<CommandResponse | null>(null);
    const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationRequest | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Refs
    const confirmationTimeoutRef = useRef<number | null>(null);

    // Handle WebSocket messages
    const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
        switch (message.type) {
            case 'system_status':
                if (message.data) {
                    setSystemStatus(message.data as SystemStatus);
                }
                break;

            case 'command_response':
                if (message.data) {
                    const response = message.data as CommandResponse;
                    setLastResponse(response);

                    // Check if confirmation is required
                    if (response.requires_confirmation && response.confirmation_id) {
                        setPendingConfirmation({
                            confirmation_id: response.confirmation_id,
                            command_key: response.command_key,
                            command_text: response.data?.command_text || '',
                            language: response.language,
                            response: response.response,
                            timeout: 30, // Default timeout
                        });

                        // Auto-clear after timeout
                        if (confirmationTimeoutRef.current) {
                            clearTimeout(confirmationTimeoutRef.current);
                        }
                        confirmationTimeoutRef.current = window.setTimeout(() => {
                            setPendingConfirmation(null);
                        }, 30000);
                    }
                }
                break;

            case 'error':
                setError(message.message || 'Unknown error');
                break;

            case 'pong':
                // Keep-alive received
                break;
        }
    }, []);

    // Connect on mount
    useEffect(() => {
        bridgeService.connect();

        // Subscribe to status changes
        const unsubscribeStatus = bridgeService.onStatusChange((status) => {
            setConnectionStatus(status);
            setIsConnected(status === 'connected');
        });

        // Subscribe to messages
        const unsubscribeMessages = bridgeService.onMessage(handleWebSocketMessage);

        // Initial check
        bridgeService.healthCheck();

        // Cleanup
        return () => {
            unsubscribeStatus();
            unsubscribeMessages();
            bridgeService.disconnect();
            if (confirmationTimeoutRef.current) {
                clearTimeout(confirmationTimeoutRef.current);
            }
        };
    }, [handleWebSocketMessage]);

    // Send command
    const sendCommand = useCallback((command: string, language: 'en' | 'hi' = 'en') => {
        if (!bridgeService.isConnected) {
            setError('Not connected to system bridge');
            return;
        }

        setError(null);
        bridgeService.sendCommand(command, language);
    }, []);

    // Confirm command
    const confirmAction = useCallback(async (approved: boolean) => {
        if (!pendingConfirmation) return;

        try {
            const result = await bridgeService.confirmCommand(
                pendingConfirmation.confirmation_id,
                approved
            );

            if (result.success && result.result) {
                setLastResponse(result.result);
            }

            setPendingConfirmation(null);

            if (confirmationTimeoutRef.current) {
                clearTimeout(confirmationTimeoutRef.current);
                confirmationTimeoutRef.current = null;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Confirmation failed');
            setPendingConfirmation(null);
        }
    }, [pendingConfirmation]);

    // Reconnect
    const reconnect = useCallback(() => {
        setError(null);
        bridgeService.disconnect();
        setTimeout(() => {
            bridgeService.connect();
        }, 100);
    }, []);

    // Request status manually
    const requestStatus = useCallback(() => {
        bridgeService.requestStatus();
    }, []);

    const resetLastResponse = useCallback(() => {
        setLastResponse(null);
    }, []);

    return {
        isConnected,
        connectionStatus,
        systemStatus,
        sendCommand,
        lastResponse,
        resetLastResponse,
        pendingConfirmation,
        confirmAction,
        error,
        reconnect,
        requestStatus,
    };
}
