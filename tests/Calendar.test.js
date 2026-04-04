import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Calendar from '../src/packages/Calendar/Calendar.vue'

describe('Calendar Component', () => {
  it('should update header label when changing month', async () => {
    const wrapper = mount(Calendar, {
      props: {
        initialSelectedDate: new Date('2024-01-01')
      }
    })

    // 初始状态检查
    expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年1月')

    // 点击下一页按钮 - 使用索引定位，但添加注释说明
    const toolbarIcons = wrapper.findAll('.ohhh-calendar-toolbar--icon')
    // 按钮顺序：[prev-year, prev-page, next-page, next-year]
    const prevPageButton = toolbarIcons[1] // 第二个图标是上一页按钮
    const nextPageButton = toolbarIcons[2] // 第三个图标是下一页按钮
    
    // 点击下一页按钮
    await nextPageButton.trigger('click')
    
    // 触发过渡动画结束事件
    await wrapper.find('.ohhh-calendar-days').trigger('transitionend')
    
    // 验证头部标签是否更新
    expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年2月')

    // 点击上一页按钮
    await prevPageButton.trigger('click')
    
    // 触发过渡动画结束事件
    await wrapper.find('.ohhh-calendar-days').trigger('transitionend')
    
    // 验证头部标签是否更新回初始状态
    expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年1月')
  })

  it('should handle leap year boundary correctly', async () => {
    const wrapper = mount(Calendar, {
      props: {
        initialSelectedDate: new Date('2024-02-29')
      }
    })

    // 初始状态检查
    expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年2月')

    // 点击下一页按钮，从2月29日切换到3月 - 使用索引定位
    const toolbarIcons = wrapper.findAll('.ohhh-calendar-toolbar--icon')
    // 按钮顺序：[prev-year, prev-page, next-page, next-year]
    const prevPageButton = toolbarIcons[1] // 第二个图标是上一页按钮
    const nextPageButton = toolbarIcons[2] // 第三个图标是下一页按钮
    
    // 点击下一页按钮
    await nextPageButton.trigger('click')
    
    // 触发过渡动画结束事件
    await wrapper.find('.ohhh-calendar-days').trigger('transitionend')
    
    // 验证头部标签是否更新为3月
    expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年3月')

    // 点击上一页按钮，从3月切换回2月
    await prevPageButton.trigger('click')
    
    // 触发过渡动画结束事件
    await wrapper.find('.ohhh-calendar-days').trigger('transitionend')
    
    // 验证头部标签是否更新回2月
    expect(wrapper.find('.ohhh-calendar-toolbar--text').text()).toBe('2024年2月')
  })
})
