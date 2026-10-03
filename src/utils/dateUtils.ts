export interface CalendarDay {
  dateString: string; // YYYY-MM-DD
  dayNumber: number;  // 1-31
  month: number;      // 0-11
  year: number;
  isWithinRange: boolean;
  isWeekend: boolean;
}

export interface CalendarMonth {
  year: number;
  month: number;      // 0-11
  name: string;       // e.g. "January 2027"
  startOffset: number;// 0 = Mon, 6 = Sun
  days: CalendarDay[];
}

/**
 * Format Date object to YYYY-MM-DD without timezone offset issues
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD safely into a local Date
 */
export function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format range for headers: e.g. "Jan 15 – Feb 28, 2027 (45 days)"
 */
export function formatRangeLabel(startDateStr: string, endDateStr: string): { label: string; daysCount: number } {
  if (!startDateStr || !endDateStr) return { label: '', daysCount: 0 };
  
  const start = parseDateKey(startDateStr);
  const end = parseDateKey(endDateStr);

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const daysCount = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  let label = '';
  if (startYear === endYear) {
    if (startMonth === endMonth) {
      label = `${startMonth} ${startDay} – ${endDay}, ${startYear}`;
    } else {
      label = `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${startYear}`;
    }
  } else {
    label = `${startMonth} ${startDay}, ${startYear} – ${endMonth} ${endDay}, ${endYear}`;
  }

  return { label, daysCount };
}

/**
 * Format a single day: e.g. "Saturday, Jan 18, 2027"
 */
export function formatFullDayLabel(dateStr: string): string {
  const d = parseDateKey(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Build the month grids spanning the start and end dates.
 */
export function generateCalendarMonths(startDateStr: string, endDateStr: string): CalendarMonth[] {
  if (!startDateStr || !endDateStr) return [];
  const start = parseDateKey(startDateStr);
  const end = parseDateKey(endDateStr);

  const months: CalendarMonth[] = [];

  let curYear = start.getFullYear();
  let curMonth = start.getMonth();

  const endYear = end.getFullYear();
  const endMonth = end.getMonth();

  while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
    const monthTitle = new Date(curYear, curMonth, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    // 1st day of month weekday: 0 = Sun, 1 = Mon ... 6 = Sat
    // We want Monday-first week: 0 = Mon, ..., 6 = Sun
    const firstDayWeekday = new Date(curYear, curMonth, 1).getDay();
    const startOffset = (firstDayWeekday + 6) % 7;

    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const days: CalendarDay[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(curYear, curMonth, day);
      const dateString = formatDateKey(dayDate);
      const dayOfWeek = dayDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isWithinRange = dateString >= startDateStr && dateString <= endDateStr;

      days.push({
        dateString,
        dayNumber: day,
        month: curMonth,
        year: curYear,
        isWithinRange,
        isWeekend
      });
    }

    months.push({
      year: curYear,
      month: curMonth,
      name: monthTitle,
      startOffset,
      days
    });

    curMonth++;
    if (curMonth > 11) {
      curMonth = 0;
      curYear++;
    }
  }

  return months;
}

/**
 * Add or subtract days from a YYYY-MM-DD string
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseDateKey(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateKey(d);
}

/**
 * Helper to get initial default dates for poll creation (start today, end 1 day later)
 */
export function getDefaultPollDates(): { startDate: string; endDate: string } {
  const today = new Date();
  const startDate = formatDateKey(today);
  const endDate = addDays(startDate, 1); // Begins at 1 day after start date

  return {
    startDate,
    endDate
  };
}
