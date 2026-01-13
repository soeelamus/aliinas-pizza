export function getPickupCountdown(pickupTimeStr) {
  if (!pickupTimeStr) return null;

  // Convert full date string to "HH:MM"
  const date = new Date(pickupTimeStr);
  if (isNaN(date)) return null; // fallback if invalid

  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Create a new Date object for today at pickup time
  const now = new Date();
  const pickup = new Date();
  pickup.setHours(hours, minutes, 0, 0);

  // If pickup time has already passed today, move to tomorrow
  if (pickup < now) {
    pickup.setDate(pickup.getDate() + 1);
  }

  const diffMs = pickup - now;

  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const hoursLeft = Math.floor(totalSeconds / 3600);
  const minutesLeft = Math.floor((totalSeconds % 3600) / 60);
  const secondsLeft = totalSeconds % 60;

  return {
    ms: diffMs,
    hours: hoursLeft,
    minutes: minutesLeft,
    seconds: secondsLeft,
    totalMinutes: Math.floor(diffMs / 60000),
    pickupTimeFormatted: `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`, // "HH:MM"
  };
}
