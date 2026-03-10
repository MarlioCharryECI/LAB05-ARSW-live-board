const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

let websocket = null;

// WebSocket connection
export const connectWebSocket = (onMessage, onError, onClose) => {
    const userId = localStorage.getItem('userId');
    
    if (websocket) {
        websocket.close();
    }

    websocket = new WebSocket(`${WS_URL}?userId=${userId}`);

    websocket.onopen = () => {
        console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            console.log('WebSocket message:', message);
            onMessage(message);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };

    websocket.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        if (onClose) onClose(event);
        
        // Auto-reconnect after 3 seconds if not a normal closure
        if (event.code !== 1000) {
            setTimeout(() => connectWebSocket(onMessage, onError, onClose), 3000);
        }
    };

    websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) onError(error);
    };

    return websocket;
};

export const disconnectWebSocket = () => {
    if (websocket) {
        websocket.close(1000, 'Client disconnect');
        websocket = null;
    }
};

export const sendWebSocketMessage = (message) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify(message));
        return true;
    }
    return false;
};

export async function join(userId) {
    const res = await fetch(`${API_URL}/join`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('join failed');
    return res.json();
}

export async function getBoard() {
    const res = await fetch(`${API_URL}/board`);
    if (!res.ok) throw new Error('getBoard failed');
    return res.json();
}

export async function sendStroke(stroke) {
    const res = await fetch(`${API_URL}/draw`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(stroke),
    });
    if (!res.ok) {
        const errorText = await res.text();
        console.error('Server response:', errorText);
        throw new Error(`sendStroke failed: ${res.status} - ${errorText}`);
    }
}

export async function clearBoard() {
    const res = await fetch(`${API_URL}/clear`, { method: 'POST' });
    if (!res.ok) {
        const errorText = await res.text();
        console.error('Server response for clear:', errorText);
        throw new Error(`clear failed: ${res.status} - ${errorText}`);
    }
}