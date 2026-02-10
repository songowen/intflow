const MAX_BACKOFF = 30_000;
const BASE_DELAY = 1_000;

export interface ResilientWsOptions {
  url: string;
  onMessage: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface ResilientWsHandle {
  close: () => void;
}

/**
 * 지수 백오프 재연결 + 단일 연결 보장 WebSocket.
 * 반환된 handle.close()로 cleanup(언마운트 시 호출).
 */
export function createResilientWs(opts: ResilientWsOptions): ResilientWsHandle {
  let ws: WebSocket | null = null;
  let attempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  function connect() {
    // 단일 연결 보장: 이미 열려있으면 무시
    if (disposed) return;
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return;

    ws = new WebSocket(opts.url);

    ws.onopen = () => {
      attempt = 0;
      opts.onOpen?.();
    };

    ws.onmessage = (e) => {
      try {
        opts.onMessage(JSON.parse(e.data));
      } catch {
        opts.onMessage(e.data);
      }
    };

    ws.onclose = () => {
      opts.onClose?.();
      scheduleReconnect();
    };

    ws.onerror = () => {
      // onerror 후 onclose가 항상 호출되므로 여기서 reconnect하지 않음
      ws?.close();
    };
  }

  function scheduleReconnect() {
    if (disposed) return;
    // 지수 백오프: 1s, 2s, 4s, 8s, … max 30s
    const delay = Math.min(BASE_DELAY * 2 ** attempt, MAX_BACKOFF);
    attempt++;
    reconnectTimer = setTimeout(connect, delay);
  }

  function close() {
    disposed = true;
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      // cleanup: onclose에서 재연결 방지 (disposed=true)
      ws.close();
      ws = null;
    }
  }

  connect();

  return { close };
}
