export class GreenroomWebSocketClient {
  constructor(options = {}) {
    this.onMessage = options.onMessage || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
    this.reconnectInterval = options.reconnectInterval || 2000;
    this.ws = null;
    this.isExplicitClosed = false;
    this.status = 'DISCONNECTED';
  }

  getWebSocketUrl() {
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }

  connect() {
    this.isExplicitClosed = false;
    const url = this.getWebSocketUrl();
    
    this.setStatus('CONNECTING');

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.setStatus('CONNECTED');
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.onMessage(payload);
        } catch (err) {
          console.error('[GreenroomWS] Message parse error:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[GreenroomWS] Socket error:', err);
      };

      this.ws.onclose = () => {
        this.setStatus('DISCONNECTED');
        if (!this.isExplicitClosed) {
          setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };
    } catch (err) {
      console.error('[GreenroomWS] Connection initialization error:', err);
      this.setStatus('DISCONNECTED');
      if (!this.isExplicitClosed) {
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    }
  }

  disconnect() {
    this.isExplicitClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }

  setStatus(newStatus) {
    this.status = newStatus;
    this.onStatusChange(newStatus);
  }
}
