export function intervalsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && startB < endA;
}

export function isFutureStart(startTime: Date, now: Date = new Date()): boolean {
  return startTime > now;
}

export function hasNotStarted(startTime: Date, now: Date = new Date()): boolean {
  return startTime > now;
}

export function isActiveBooking(endTime: Date, now: Date = new Date()): boolean {
  return endTime > now;
}

export function hoursBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}
