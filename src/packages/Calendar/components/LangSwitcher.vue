<template>
  <div class="lang-switcher">
    <select :value="currentLocale" @change="handleChange" class="lang-select">
      <option value="zh-CN">{{ t('chinese') }}</option>
      <option value="en-US">{{ t('english') }}</option>
    </select>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()

const currentLocale = computed({
  get: () => locale.value,
  set: (val) => {
    locale.value = val
  }
})

function handleChange(e) {
  const newLocale = e.target.value
  locale.value = newLocale
  localStorage.setItem('ohhh-calendar-locale', newLocale)
}
</script>

<style scoped>
.lang-switcher {
  display: inline-block;
}

.lang-select {
  padding: 8px 12px;
  border: 1px solid var(--calendar-border-color, #ddd);
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 28px;
}

.lang-select:focus {
  outline: none;
  border-color: var(--calendar-theme-color, #409eff);
}
</style>
