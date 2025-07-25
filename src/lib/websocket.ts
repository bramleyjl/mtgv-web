import { WebSocketMessage, WebSocketPackageUpdate } from '@/types';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageQueue: WebSocketMessage[] = [];
  private isConnecting = false;
  private url: string;
  private onMessageCallback: ((message: WebSocketPackageUpdate) => void) | null = null;
  private onConnectionChangeCallback: ((connected: boolean) => void) | null = null;

  constructor(url?: string) {
    // Use environment variable or fallback to localhost:4000
    this.url = url || process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:4000';
  }

  connect(): Promise<void> {
    console.log('[WebSocketService] connect() called. Current ws:', this.ws, 'readyState:', this.ws?.readyState);
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log('[WebSocketService] Already connected.');
        resolve();
        return;
      }

      if (this.isConnecting) {
        console.log('[WebSocketService] Connection already in progress.');
        resolve();
        return;
      }

      if (this.ws?.readyState === WebSocket.CONNECTING) {
        console.log('[WebSocketService] Already connecting.');
        resolve();
        return;
      }

      this.isConnecting = true;
      this.ws = new WebSocket(this.url);
      console.log('[WebSocketService] New WebSocket created:', this.ws);

      this.ws.onopen = () => {
        console.log('[WebSocketService] onopen');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.onConnectionChangeCallback?.(true);
        this.flushMessageQueue();
        resolve();
      };

      this.ws.onclose = (event) => {
        console.log('[WebSocketService] onclose', event);
        this.isConnecting = false;
        this.onConnectionChangeCallback?.(false);
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
        }
      };

      this.ws.onerror = (error) => {
        console.log('[WebSocketService] onerror', error);
        this.isConnecting = false;
        reject(error);
      };

      this.ws.onmessage = (event) => {
        console.log('[WebSocketService] onmessage', event.data);
        try {
          const message: WebSocketPackageUpdate = JSON.parse(event.data);
          this.onMessageCallback?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    });
  }

  disconnect(): void {
    console.log('[WebSocketService] disconnect() called. Current ws:', this.ws, 'readyState:', this.ws?.readyState);
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        console.log('[WebSocketService] Closing WebSocket.');
      this.ws.close();
      } else {
        console.log('[WebSocketService] WebSocket already closed or closing.');
      }
      this.ws = null;
    }
    this.messageQueue = [];
    this.reconnectAttempts = 0;
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  onMessage(callback: (message: WebSocketPackageUpdate) => void): void {
    this.onMessageCallback = callback;
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.onConnectionChangeCallback = callback;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService();

// Debounced message sender
export function createDebouncedSender(delay: number = 1000) {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (message: WebSocketMessage) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      websocketService.send(message);
      timeoutId = null;
    }, delay);
  };
} 