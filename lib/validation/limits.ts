export const FIELD_LIMITS = {
  roomCode: 64,
  roomName: 255,
  location: 255,
  bookerName: 255,
  purpose: 500,
} as const;

export type LimitedField = keyof typeof FIELD_LIMITS;
