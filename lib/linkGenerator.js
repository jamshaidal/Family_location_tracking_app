import { randomUUID } from 'crypto';

export function generateTrackingToken() {
    return randomUUID();
}

export function createShareableLink(baseUrl, token) {
    return `${baseUrl}/track/${token}`;
}
