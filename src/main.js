import { createApp } from 'vue'
import App from './App.vue'
import i18n, { setLocale, getLocale } from './i18n'

const app = createApp(App)
app.use(i18n)

const savedLocale = getLocale()
setLocale(savedLocale)

app.mount('#app')
