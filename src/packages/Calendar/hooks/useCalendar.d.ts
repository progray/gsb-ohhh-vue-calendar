import { Ref, ComputedRef } from 'vue'

interface DateObject {
  date: Date
  fullDate: { date: number }
  current: boolean
  key: string
}

interface UseCalendarOptions {
  initialSelectedDate: Ref<Date>
  initialViewMode: Ref<string>
  weekStart: Ref<number>
  duration: Ref<string>
}

type EmitFunction = (event: any, ...args: any[]) => void

export function useCalendar(
  options: UseCalendarOptions,
  emit: EmitFunction
): {
  selected: Ref<Date>
  viewMode: Ref<string>
  currentYear: Ref<number>
  currentMonth: Ref<number>
  currentRenderDates: ComputedRef<DateObject[]>
  allRenderDates: ComputedRef<DateObject[][]>
  transformDistance: Ref<string>
  transitionDuration: Ref<string>
  isInTransition: Ref<boolean>
  renderRows: Ref<number>
  switchPageToTargetDate: (date: Date) => void
  startTransitionAnimation: (direction: string) => void
  onTransitionEnd: () => void
  toggleViewMode: () => void
}
