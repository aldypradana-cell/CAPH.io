import dayjs from 'dayjs';
import 'dayjs/locale/id';

// Set Indonesian locale globally
dayjs.locale('id');

/**
 * Returns today's date as YYYY-MM-DD string in local timezone.
 * Replaces: new Date().toISOString().split('T')[0]
 */
export const todayString = (): string => dayjs().format('YYYY-MM-DD');

/**
 * Converts a date (string, Date, or undefined) to YYYY-MM-DD in local timezone.
 * Replaces: getLocalYYYYMMDD() and manual .split('T')[0]
 */
export const toDateString = (date?: string | Date): string =>
    dayjs(date).format('YYYY-MM-DD');

/**
 * Formats a date string for display: "11 Mar 2026"
 * Replaces: new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
 */
export const formatDateShort = (s: string): string =>
    dayjs(s).format('D MMM YYYY');

/**
 * Formats a date string for display (day + short month only): "11 Mar"
 * Replaces: toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
 */
export const formatDateDayMonth = (s: string | Date): string =>
    dayjs(s).format('D MMM');

/**
 * Formats a date string for full display: "11 Maret 2026"
 * Replaces: toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
 */
export const formatDateLong = (s: string): string =>
    dayjs(s).format('D MMMM YYYY');

/**
 * Formats a date for month + year: "Mar 2026"
 * Replaces: toLocaleString('id-ID', { month: 'short', year: 'numeric' })
 */
export const formatMonthYear = (s: string | Date | { year: number; month: number }): string => {
    if (typeof s === 'object' && 'year' in s && 'month' in s) {
        return dayjs().year(s.year).month(s.month).format('MMM YYYY');
    }
    return dayjs(s).format('MMM YYYY');
};

/**
 * Formats a date for full month + year: "Maret 2026"
 * Replaces: toLocaleString('id-ID', { month: 'long', year: 'numeric' })
 */
export const formatMonthYearLong = (s: string | Date | { year: number; month: number }): string => {
    if (typeof s === 'object' && 'year' in s && 'month' in s) {
        return dayjs().year(s.year).month(s.month).format('MMMM YYYY');
    }
    return dayjs(s).format('MMMM YYYY');
};

/**
 * Formats locale-only date: "11/03/2026"
 * Replaces: toLocaleDateString('id-ID') with no options
 */
export const formatDateLocale = (s: string | Date): string =>
    dayjs(s).format('DD/MM/YYYY');

/**
 * Formats date + time: "11 Mar 2026, 17:30"
 * Replaces: toLocaleString('id-ID')
 */
export const formatDateTime = (s: string | Date): string =>
    dayjs(s).format('D MMM YYYY, HH:mm');

/**
 * Formats time only: "17:30"
 * Replaces: toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
 */
export const formatTime = (s: string | Date): string =>
    dayjs(s).format('HH:mm');

/**
 * Formats weekday name: "Senin"
 * Replaces: toLocaleDateString('id-ID', { weekday: 'long' })
 */
export const formatWeekday = (s: string | Date): string =>
    dayjs(s).format('dddd');

/**
 * Gets the start of a month as YYYY-MM-DD.
 */
export const startOfMonth = (date?: string | Date): string =>
    dayjs(date).startOf('month').format('YYYY-MM-DD');
