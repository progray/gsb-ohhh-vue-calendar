export class CalendarDate {
  constructor(date: Date, current: boolean);
  key: string;
  date: Date;
  fullDate: { year: number; month: number; date: number };
  current: boolean;
}

export function isSameDay(date1: Date, date2: Date): boolean;
export function createWeekdays(start: number): string[];
export function getDayOfWeek(date: Date): number;
export function getDaysDiff(date1: Date, date2: Date): number;
export function createMonthDates(date: Date, index: number): CalendarDate[];
export function createWeekDates(date: Date, index: number): CalendarDate[];
