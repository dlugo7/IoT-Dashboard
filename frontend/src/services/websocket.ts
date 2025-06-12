import { io, Socket } from 'socket.io-client';
import { SensorData, Alert, WebSocketMessage } from '../types/sensor';

type EventCallback<T = any> = (data: T) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): void {
    const wsEndpoint = import.meta.env.VITE_WEBSOCKET_ENDPOINT || 'ws://localhost:3001';
    
    this.socket = io(wsEndpoint, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnection();
    });
  }

  private handleReconnection(): void {
    this.reconnectAttempts++;
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  // Event listeners
  onSensorData(callback: EventCallback<SensorData>): void {
    this.socket?.on('sensor_data', callback);
  }

  onAlert(callback: EventCallback<Alert>): void {
    this.socket?.on('alert', callback);
  }

  onStatusUpdate(callback: EventCallback<any>): void {
    this.socket?.on('status_update', callback);
  }

  // Generic message listener
  onMessage(callback: EventCallback<WebSocketMessage>): void {
    this.socket?.on('message', callback);
  }

  // Remove listeners
  offSensorData(callback?: EventCallback<SensorData>): void {
    this.socket?.off('sensor_data', callback);
  }

  offAlert(callback?: EventCallback<Alert>): void {
    this.socket?.off('alert', callback);
  }

  offStatusUpdate(callback?: EventCallback<any>): void {
    this.socket?.off('status_update', callback);
  }

  offMessage(callback?: EventCallback<WebSocketMessage>): void {
    this.socket?.off('message', callback);
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }

  // Send messages (if needed for bidirectional communication)
  emit(event: string, data: any): void {
    this.socket?.emit(event, data);
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService; 