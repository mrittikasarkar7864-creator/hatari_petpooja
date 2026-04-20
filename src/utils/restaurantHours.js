/**
 * Returns current time in minutes since midnight, in Kolkata (IST, UTC+05:30).
 * Kolkata has no DST so the offset is always fixed.
 */
const getKolkataMinutes = (date = new Date()) => {
  const utcMillis = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const istMillis = utcMillis + (5 * 60 + 30) * 60 * 1000;
  const istDate = new Date(istMillis);
  return istDate.getHours() * 60 + istDate.getMinutes();
};

/**
 * Parses a time string like "11:30" or "22:30" into minutes since midnight.
 */
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [hours, mins] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(mins)) return null;
  return hours * 60 + mins;
};

/**
 * Returns true if the restaurant is currently closed, based on its
 * openingTime and closingTime fields (e.g. "11:30", "22:30").
 *
 * Handles overnight ranges (closingTime < openingTime) correctly.
 *
 * @param {string} openingTime  - "HH:MM" (24-hr), e.g. "11:30"
 * @param {string} closingTime  - "HH:MM" (24-hr), e.g. "22:30"
 * @param {Date}   [date]       - optional date to check against (defaults to now)
 */
export const isRestaurantClosed = (openingTime, closingTime, date = new Date()) => {
  const open = parseTimeToMinutes(openingTime);
  const close = parseTimeToMinutes(closingTime);

  if (open === null || close === null) {
    // If times are missing, treat as open to avoid false blocks
    return false;
  }

  const now = getKolkataMinutes(date);

  if (open <= close) {
    // Normal range: e.g. 11:30 – 22:30
    return now < open || now >= close;
  } else {
    // Overnight range: e.g. 20:00 – 02:00
    return now < open && now >= close;
  }
};

/**
 * Returns true if the restaurant is currently open.
 */
export const isRestaurantOpen = (openingTime, closingTime, date = new Date()) =>
  !isRestaurantClosed(openingTime, closingTime, date);

/**
 * Returns a human-readable message for when the restaurant is closed.
 *
 * @param {string} openingTime - "HH:MM"
 * @param {string} closingTime - "HH:MM"
 */
export const getClosedHoursMessage = (openingTime, closingTime) => {
  const fmt = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
  };
  return `Restaurant is closed. Opens at ${fmt(openingTime)} and closes at ${fmt(closingTime)} (Kolkata time).`;
};

/**
 * Returns true if this order type (delivery / takeaway) should be blocked
 * because the restaurant is currently closed.
 *
 * @param {string} type         - "delivery" | "takeaway"
 * @param {string} openingTime  - "HH:MM"
 * @param {string} closingTime  - "HH:MM"
 */
export const isOrderTypeBlockedNow = (type, openingTime, closingTime) => {
  if (!type) return false;
  const normalized = String(type).toLowerCase();
  const isOrderType = normalized === 'delivery' || normalized === 'takeaway';
  return isOrderType && isRestaurantClosed(openingTime, closingTime);
};
