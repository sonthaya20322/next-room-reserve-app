export function maxAttendeesOfActiveBookings(
  bookings: Array<{ attendeeCount: number; endTime: Date }>,
  now: Date = new Date(),
): number {
  let max = 0;
  for (const booking of bookings) {
    if (booking.endTime > now) {
      max = Math.max(max, booking.attendeeCount);
    }
  }
  return max;
}

export function canReduceCapacity(
  newCapacity: number,
  activeMaxAttendees: number,
): boolean {
  return newCapacity >= activeMaxAttendees;
}

export function fitsCapacity(attendeeCount: number, capacity: number): boolean {
  return attendeeCount <= capacity;
}
