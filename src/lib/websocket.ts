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
  private connectionPromise: Promise<void> | null = null;
  private shouldReconnect = true;

  constructor(url?: string) {
    // Use environment variable or fallback to localhost:4000
    this.url = url || process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:4000';
  }

  connect(): Promise<void> {
    console.log('[WebSocketService] connect() called. Current ws:', this.ws, 'readyState:', this.ws?.readyState);
    
    // If already connected, return existing promise
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocketService] Already connected.');
      return Promise.resolve();
    }

    // If connection is in progress, return the existing promise
    if (this.connectionPromise) {
      console.log('[WebSocketService] Connection already in progress.');
      return this.connectionPromise;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocketService] Already connecting.');
      return Promise.resolve();
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
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
        this.connectionPromise = null;
        this.onConnectionChangeCallback?.(false);
        
        // Only reconnect if we haven't explicitly disconnected
        if (this.shouldReconnect && !event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`[WebSocketService] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
        }
      };

      this.ws.onerror = (error) => {
        console.log('[WebSocketService] onerror', error);
        this.isConnecting = false;
        this.connectionPromise = null;
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

    return this.connectionPromise;
  }

  disconnect(): void {
    console.log('[WebSocketService] disconnect() called. Current ws:', this.ws, 'readyState:', this.ws?.readyState);
    this.shouldReconnect = false; // Prevent reconnection
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
    this.connectionPromise = null;
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

// Debounced message sender with better deduplication
export function createDebouncedSender(delay: number = 1000) {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastMessage: string | null = null;
  
  return (message: WebSocketMessage) => {
    const messageStr = JSON.stringify(message);
    
    // If this is the same message as the last one, don't send it again
    if (lastMessage === messageStr) {
      console.log('[DebouncedSender] Skipping duplicate message');
      return;
    }
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      console.log('[DebouncedSender] Sending message after delay:', message);
      websocketService.send(message);
      timeoutId = null;
      lastMessage = messageStr;
    }, delay);
  };
} 