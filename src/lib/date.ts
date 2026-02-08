import { format, formatDistance, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function formatDate(date: Date | string, formatStr: string = 'PPP'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'PPP p');
}

export function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'p')}`;
  }
  
  if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, 'p')}`;
  }
  
  return format(dateObj, 'PPP');
}

export function formatDateRange(
  startDate: Date | string,
  endDate: Date | string
): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  return `${format(start, 'PP')} - ${format(end, 'PP')}`;
}
