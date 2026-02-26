import type { App } from 'vue'
import OhhhVueCalendar from './Calendar/Calendar.vue'
import './Calendar/style/index.scss'

const components = [{ name: 'OhhhVueCalendar', comp: OhhhVueCalendar }]

export { OhhhVueCalendar }

export default {
  install(app: App) {
    components.forEach(({ name, comp }) => {
      app.component(name, comp)
    })
  }
}

declare module 'vue' {
  export interface GlobalComponents {
    OhhhVueCalendar: typeof OhhhVueCalendar
  }
}
