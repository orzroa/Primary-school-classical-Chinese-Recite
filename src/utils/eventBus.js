// 轻量级事件总线，用于跨组件通知
class EventBus {
  constructor() {
    this.listeners = {}
  }
  on(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(handler)
  }
  off(event, handler) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter(h => h !== handler)
  }
  emit(event, payload) {
    if (!this.listeners[event]) return
    this.listeners[event].forEach(h => {
      try { h(payload) } catch (e) { console.error(e) }
    })
  }
}

export const eventBus = new EventBus()
export const PERSON_CHANGED = 'person:changed'
export const RECORDS_CHANGED = 'records:changed'
