<template>
  <div class="goal-toolbar">
    <div class="goal-toolbar--header">
      <span class="goal-toolbar--title">🎯 今日目标</span>
      <button class="goal-toolbar--add-btn" @click="openAddModal">
        <span class="goal-toolbar--add-icon">+</span>
        添加目标
      </button>
    </div>
    
    <div class="goal-toolbar--goals">
      <div
        v-for="goal in goals"
        :key="goal.id"
        class="goal-toolbar--goal-item"
        :style="{ '--goal-color': goal.color }"
      >
        <span class="goal-toolbar--goal-emoji">{{ goal.emoji }}</span>
        <div class="goal-toolbar--goal-info">
          <span class="goal-toolbar--goal-name">{{ goal.name }}</span>
          <span class="goal-toolbar--goal-target">{{ goal.target }}{{ goal.unit }}</span>
        </div>
        <div class="goal-toolbar--goal-actions">
          <button class="goal-toolbar--action-btn" @click="editGoal(goal)">✏️</button>
          <button class="goal-toolbar--action-btn" @click="deleteGoalById(goal.id)">🗑️</button>
        </div>
      </div>
      
      <div v-if="goals.length === 0" class="goal-toolbar--empty">
        <span class="goal-toolbar--empty-icon">🏃</span>
        <span class="goal-toolbar--empty-text">暂无目标，点击上方按钮添加</span>
      </div>
    </div>
  </div>

  <transition name="modal">
    <div v-if="showModal" class="goal-modal-overlay" @click.self="closeModal">
      <div class="goal-modal" :class="{ 'is-edit': isEdit }">
        <div class="goal-modal--header">
          <span class="goal-modal--title">{{ isEdit ? '编辑目标' : '添加目标' }}</span>
          <button class="goal-modal--close-btn" @click="closeModal">×</button>
        </div>
        
        <div class="goal-modal--form">
          <div class="goal-modal--form-item">
            <label class="goal-modal--label">表情符号</label>
            <div class="goal-modal--emoji-picker">
              <button
                v-for="emoji in availableEmojis"
                :key="emoji"
                class="goal-modal--emoji-btn"
                :class="{ 'is-active': formData.emoji === emoji }"
                @click="formData.emoji = emoji"
              >
                {{ emoji }}
              </button>
            </div>
          </div>
          
          <div class="goal-modal--form-item">
            <label class="goal-modal--label">任务名称</label>
            <input
              v-model="formData.name"
              type="text"
              class="goal-modal--input"
              placeholder="例如：深蹲"
              maxlength="10"
            />
          </div>
          
          <div class="goal-modal--form-row">
            <div class="goal-modal--form-item">
              <label class="goal-modal--label">目标值</label>
              <input
                v-model.number="formData.target"
                type="number"
                class="goal-modal--input"
                placeholder="50"
                min="1"
              />
            </div>
            <div class="goal-modal--form-item">
              <label class="goal-modal--label">单位</label>
              <input
                v-model="formData.unit"
                type="text"
                class="goal-modal--input"
                placeholder="个/kcal"
                maxlength="6"
              />
            </div>
          </div>
          
          <div class="goal-modal--form-item">
            <label class="goal-modal--label">主题颜色</label>
            <div class="goal-modal--color-picker">
              <button
                v-for="color in availableColors"
                :key="color"
                class="goal-modal--color-btn"
                :class="{ 'is-active': formData.color === color }"
                :style="{ background: color }"
                @click="formData.color = color"
              />
            </div>
          </div>
        </div>
        
        <div class="goal-modal--footer">
          <button class="goal-modal--cancel-btn" @click="closeModal">取消</button>
          <button class="goal-modal--confirm-btn" @click="saveGoal" :disabled="!isFormValid">
            {{ isEdit ? '保存' : '添加' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  goals: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['add-goal', 'update-goal', 'delete-goal'])

const showModal = ref(false)
const isEdit = ref(false)
const editingGoalId = ref(null)

const availableEmojis = ['🏋️', '💪', '🔥', '🏃', '🚴', '🧘', '🏊', '💃', '🥗', '💧', '😴', '🎯']
const availableColors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#A78BFA', '#60A5FA', '#F472B6', '#FB923C']

const defaultFormData = () => ({
  emoji: '🏋️',
  name: '',
  target: 50,
  unit: '个',
  color: '#FF6B6B'
})

const formData = ref(defaultFormData())

const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' && formData.value.target > 0 && formData.value.unit.trim() !== ''
})

function openAddModal() {
  isEdit.value = false
  editingGoalId.value = null
  formData.value = defaultFormData()
  showModal.value = true
}

function editGoal(goal) {
  isEdit.value = true
  editingGoalId.value = goal.id
  formData.value = {
    emoji: goal.emoji,
    name: goal.name,
    target: goal.target,
    unit: goal.unit,
    color: goal.color
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  formData.value = defaultFormData()
  isEdit.value = false
  editingGoalId.value = null
}

function saveGoal() {
  if (!isFormValid.value) return
  
  if (isEdit.value) {
    emit('update-goal', editingGoalId.value, {
      emoji: formData.value.emoji,
      name: formData.value.name,
      target: formData.value.target,
      unit: formData.value.unit,
      color: formData.value.color
    })
  } else {
    emit('add-goal', {
      emoji: formData.value.emoji,
      name: formData.value.name,
      target: formData.value.target,
      unit: formData.value.unit,
      color: formData.value.color
    })
  }
  
  closeModal()
}

function deleteGoalById(id) {
  if (confirm('确定要删除这个目标吗？')) {
    emit('delete-goal', id)
  }
}
</script>

<style scoped lang="scss">
.goal-toolbar {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.goal-toolbar--header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.goal-toolbar--title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.goal-toolbar--add-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.goal-toolbar--add-icon {
  font-size: 16px;
  font-weight: bold;
}

.goal-toolbar--goals {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.goal-toolbar--goal-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 3px solid var(--goal-color);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
}

.goal-toolbar--goal-emoji {
  font-size: 18px;
}

.goal-toolbar--goal-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.goal-toolbar--goal-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.goal-toolbar--goal-target {
  font-size: 11px;
  color: #64748b;
}

.goal-toolbar--goal-actions {
  display: flex;
  gap: 4px;
  margin-left: 4px;
}

.goal-toolbar--action-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e2e8f0;
    transform: scale(1.1);
  }
}

.goal-toolbar--empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
}

.goal-toolbar--empty-icon {
  font-size: 24px;
}

.goal-toolbar--empty-text {
  font-size: 13px;
  color: #64748b;
}

.goal-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.goal-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 380px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  animation: modalIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.goal-modal--header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0;
}

.goal-modal--title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.goal-modal--close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e2e8f0;
    color: #1e293b;
  }
}

.goal-modal--form {
  padding: 20px;
}

.goal-modal--form-item {
  margin-bottom: 16px;
}

.goal-modal--form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
  
  .goal-modal--form-item {
    margin-bottom: 0;
  }
}

.goal-modal--label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 8px;
}

.goal-modal--input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  color: #1e293b;
  transition: all 0.2s ease;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  &::placeholder {
    color: #94a3b8;
  }
}

.goal-modal--emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.goal-modal--emoji-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    border-color: #cbd5e1;
  }
  
  &.is-active {
    background: #eef2ff;
    border-color: #6366f1;
    transform: scale(1.15);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  }
}

.goal-modal--color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.goal-modal--color-btn {
  width: 32px;
  height: 32px;
  border: 3px solid white;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: scale(1.15);
  }
  
  &.is-active {
    transform: scale(1.2);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5);
  }
}

.goal-modal--footer {
  display: flex;
  gap: 12px;
  padding: 0 20px 20px;
}

.goal-modal--cancel-btn,
.goal-modal--confirm-btn {
  flex: 1;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.goal-modal--cancel-btn {
  background: #f1f5f9;
  border: none;
  color: #64748b;
  
  &:hover {
    background: #e2e8f0;
  }
}

.goal-modal--confirm-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  color: white;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .goal-modal,
.modal-leave-to .goal-modal {
  transform: scale(0.95) translateY(20px);
}
</style>
