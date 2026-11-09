type SessionExpiredListener = (error: unknown) => void;

let listener: SessionExpiredListener | null = null;

export function setSessionExpiredListener(next: SessionExpiredListener | null) {
  listener = next;
}

export function notifySessionExpired(error: unknown) {
  listener?.(error);
}
