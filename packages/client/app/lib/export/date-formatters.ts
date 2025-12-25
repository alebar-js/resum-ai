/**
 * Shared date formatting utilities for resume exports (PDF and DOCX)
 */

const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
] as const;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;

/**
 * Formats a date string in YYYY-MM format to "MMM YYYY" format (e.g., "2021-01" -> "Jan 2021")
 * Returns "Present" if the date string is null or undefined.
 */
const formatMonthYear = (dateStr?: string | null): string => {
  if (!dateStr) return "Present";
  
  // Handle YYYY-MM format
  const match = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const [, year, month] = match;
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${MONTH_ABBREVIATIONS[monthIndex]} ${year}`;
    }
  }
  
  // Fallback: return as-is if format doesn't match
  return dateStr;
};

/**
 * Formats a date range for work experience.
 * Returns format like "Jan 2021 — Present" or "Jun 2020 — Jul 2020"
 */
export const formatDateRange = (startDate?: string | null, endDate?: string | null): string => {
  const start = formatMonthYear(startDate);
  const end = formatMonthYear(endDate);
  
  return `${start} — ${end}`;
};

/**
 * Formats a graduation date from YYYY-MM format to "Month YYYY" format (e.g., "2020-12" -> "December 2020")
 * Returns empty string if the date string is null or undefined.
 */
export const formatGraduationDate = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  
  // Handle YYYY-MM format
  const match = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const [, year, month] = match;
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${MONTH_NAMES[monthIndex]} ${year}`;
    }
  }
  
  // Fallback: return as-is if format doesn't match
  return dateStr;
};

