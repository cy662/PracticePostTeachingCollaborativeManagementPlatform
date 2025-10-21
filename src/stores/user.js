import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: {
      username: localStorage.getItem('username') || '',
      role: localStorage.getItem('userRole') || ''
    }
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.userInfo.role
  },
  
  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      localStorage.setItem('username', userInfo.username)
      localStorage.setItem('userRole', userInfo.role)
    },
    
    clearUserInfo() {
      this.token = ''
      this.userInfo = {
        username: '',
        role: ''
      }
      localStorage.clear()
    },
    
    // 模拟登录
    async login(credentials) {
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const userData = {
          username: credentials.username,
          role: credentials.role,
          token: 'demo-token-' + Date.now()
        }
        
        this.setToken(userData.token)
        this.setUserInfo({
          username: userData.username,
          role: userData.role
        })
        
        return userData
      } catch (error) {
        throw new Error('登录失败')
      }
    },
    
    // 模拟登出
    async logout() {
      this.clearUserInfo()
    }
  }
})