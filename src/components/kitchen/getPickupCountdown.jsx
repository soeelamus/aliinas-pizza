export function getPickupCountdown(pickupTimeStr) {
  if (!pickupTimeStr) return null;

  // Extract HH:MM from the string
  const match = pickupTimeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  const now = new Date();
  const pickup = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0
  );

  // Calculate remaining seconds
  let totalSeconds = Math.floor((pickup - now) / 1000);

  // Clamp negative to 0, max -1h can be used if needed
  totalSeconds = Math.max(0, totalSeconds);

  const hoursLeft = Math.floor(totalSeconds / 3600);
  const minutesLeft = Math.floor((totalSeconds % 3600) / 60);
  const secondsLeft = totalSeconds % 60;

  // Determine urgency classes
  const isRed = totalSeconds <= 10 * 60; // <=10min
  const isOrange = totalSeconds > 10 * 60 && totalSeconds <= 30 * 60; // 10-30min

  return {
    totalSeconds,
    hours: hoursLeft,
    minutes: minutesLeft,
    seconds: secondsLeft,
    pickupTimeFormatted: `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`,
    isRed,
    isOrange,
  };
}
