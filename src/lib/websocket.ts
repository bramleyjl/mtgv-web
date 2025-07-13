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

  constructor(url: string = 'ws://localhost:3001') {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.onConnectionChangeCallback?.(true);
        this.flushMessageQueue();
        resolve();
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        this.onConnectionChangeCallback?.(false);
        
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
        }
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
        reject(error);
      };

      this.ws.onmessage = (event) => {
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
    if (this.ws) {
      this.ws.close();
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