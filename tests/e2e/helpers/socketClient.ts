/**
 * Virtual Socket.io Client Test Harness for Multi-Client Synchronization Testing
 */
import { io as ioClient, Socket } from 'socket.io-client';

export interface VirtualSocketClientOptions {
  userId?: string;
  autoConnect?: boolean;
  transports?: ('websocket' | 'polling')[];
  timeout?: number;
}

export class VirtualSocketClient {
  public socket: Socket;
  public userId: string;
  public url: string;
  private eventHistory: Array<{ event: string; payload: any; receivedAt: number }> = [];
  private eventListeners: Map<string, Array<(payload: any) => void>> = new Map();

  constructor(url: string, options: VirtualSocketClientOptions = {}) {
    this.url = url;
    this.userId = options.userId || 'user-cam';

    this.socket = ioClient(url, {
      autoConnect: options.autoConnect !== false,
      transports: options.transports || ['websocket', 'polling'],
      reconnection: false,
      forceNew: true,
      auth: {
        userId: this.userId,
      },
    });

    // Record all events to eventHistory and notify registered listeners
    this.socket.onAny((event: string, ...args: any[]) => {
      const payload = args.length > 0 ? args[0] : undefined;
      this.eventHistory.push({ event, payload, receivedAt: Date.now() });

      const listeners = this.eventListeners.get(event);
      if (listeners && listeners.length > 0) {
        listeners.forEach((listener) => {
          try {
            listener(payload);
          } catch (err) {
            console.error(`Error in virtual socket listener for event "${event}":`, err);
          }
        });
      }
    });
  }

  /**
   * Connect to server and await the 'connect' event
   */
  public async connect(timeoutMs = 5000): Promise<void> {
    if (this.socket.connected) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`SocketClient (${this.userId}) connection timed out after ${timeoutMs}ms to ${this.url}`));
      }, timeoutMs);

      this.socket.once('connect', () => {
        clearTimeout(timer);
        resolve();
      });

      this.socket.once('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      this.socket.connect();
    });
  }

  /**
   * Emit an event to the server
   */
  public emit(eventName: string, data?: any): void {
    this.socket.emit(eventName, data);
  }

  /**
   * Emit an event and wait for acknowledgement or response callback
   */
  public async emitWithAck<T = any>(eventName: string, data?: any, timeoutMs = 5000): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Emit with ack timed out after ${timeoutMs}ms for event "${eventName}"`));
      }, timeoutMs);

      this.socket.timeout(timeoutMs).emit(eventName, data, (err: any, response: T) => {
        clearTimeout(timer);
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Wait for a specific event to be received by this client.
   * If the event was received recently (within recentWindowMs), it resolves immediately from history.
   */
  public async waitForEvent<T = any>(
    eventName: string,
    timeoutMs = 5000,
    predicate?: (payload: T) => boolean
  ): Promise<T> {
    // Check recent history first
    const existing = this.eventHistory
      .slice()
      .reverse()
      .find((entry) => entry.event === eventName && (!predicate || predicate(entry.payload)));

    if (existing) {
      return existing.payload as T;
    }

    return new Promise<T>((resolve, reject) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.removeInternalListener(eventName, listener);
          reject(
            new Error(
              `VirtualSocketClient (${this.userId}) timed out waiting for event "${eventName}" after ${timeoutMs}ms. Event history: ${JSON.stringify(
                this.eventHistory.map((e) => e.event)
              )}`
            )
          );
        }
      }, timeoutMs);

      const listener = (payload: T) => {
        if (!predicate || predicate(payload)) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            this.removeInternalListener(eventName, listener);
            resolve(payload);
          }
        }
      };

      this.addInternalListener(eventName, listener);
    });
  }

  /**
   * Get all captured events matching the eventName
   */
  public getEvents(eventName?: string): Array<{ event: string; payload: any; receivedAt: number }> {
    if (!eventName) {
      return [...this.eventHistory];
    }
    return this.eventHistory.filter((entry) => entry.event === eventName);
  }

  /**
   * Clear event history buffer
   */
  public clearEventHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Disconnect and cleanup
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }
    this.eventListeners.clear();
  }

  private addInternalListener(event: string, listener: (payload: any) => void) {
    const list = this.eventListeners.get(event) || [];
    list.push(listener);
    this.eventListeners.set(event, list);
  }

  private removeInternalListener(event: string, listener: (payload: any) => void) {
    const list = this.eventListeners.get(event);
    if (list) {
      const idx = list.indexOf(listener);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
    }
  }
}

/**
 * Team Virtual Clients Orchestrator
 * Connects Cam, Liam, and Alex simultaneously for multi-client testing
 */
export interface TeamClients {
  cam: VirtualSocketClient;
  liam: VirtualSocketClient;
  alex: VirtualSocketClient;
  all: VirtualSocketClient[];
  closeAll: () => void;
  clearHistories: () => void;
}

export async function createTeamVirtualClients(serverUrl: string): Promise<TeamClients> {
  const cam = new VirtualSocketClient(serverUrl, { userId: 'user-cam' });
  const liam = new VirtualSocketClient(serverUrl, { userId: 'user-liam' });
  const alex = new VirtualSocketClient(serverUrl, { userId: 'user-alex' });

  // Connect all clients in parallel
  await Promise.all([cam.connect(), liam.connect(), alex.connect()]);

  const all = [cam, liam, alex];

  return {
    cam,
    liam,
    alex,
    all,
    closeAll: () => {
      all.forEach((client) => client.disconnect());
    },
    clearHistories: () => {
      all.forEach((client) => client.clearEventHistory());
    },
  };
}
