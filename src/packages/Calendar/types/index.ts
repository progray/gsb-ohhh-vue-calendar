export interface CalendarEvent {
 id: string;
 title: string;
 startDate: Date;
 endDate: Date;
 color?: string;
 description?: string;
 allDay?: boolean;
}
export interface EventConflict {
 event: CalendarEvent;
 conflicts: CalendarEvent[];
}
export type EventColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
export const EVENT_COLORS: Record<EventColor, string> = {
 blue: '#409eff',
 green: '#67c23a',
 red: '#f56c6c',
 yellow: '#e6a23c',
 purple: '#909399',
 orange: '#f97316'
};
