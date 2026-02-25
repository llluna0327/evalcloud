import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    username: '',
    role: 'admin',
    avatar: '',
    isLoggedIn: false
  }),
  actions: {
    setUser(payload = {}) {
      this.username = payload.username ?? ''
      this.role = payload.role ?? 'member'
      this.avatar = payload.avatar ?? ''
      this.isLoggedIn = true
      // 本地持久化
      localStorage.setItem('user', JSON.stringify({
        id: this.id, username: this.username, role: this.role, avatar: this.avatar
      }))
      localStorage.setItem('role', this.role)
    },
    setRole(role) {
      this.role = role
      localStorage.setItem('role', role)
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({ ...u, role }))
    },
    hydrate() {
      const raw = localStorage.getItem('user')
      if (!raw) return
      try {
        const u = JSON.parse(raw)
        this.username = u.username ?? ''
        this.role = u.role ?? 'member'
        this.avatar = u.avatar ?? ''
        this.isLoggedIn = !!this.username
      } catch {}
    },
    logout() {
      this.$reset()
      localStorage.removeItem('user')
      localStorage.removeItem('role')
    }
  }
})