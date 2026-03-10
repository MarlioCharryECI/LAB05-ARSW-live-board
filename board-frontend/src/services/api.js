const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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