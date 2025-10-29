import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => {
    // 尝试从localStorage获取当前用户信息
    let userInfo = {}
    try {
      const currentUser = localStorage.getItem('current_user')
      if (currentUser) {
        userInfo = JSON.parse(currentUser)
      } else {
        // 尝试获取演示用户数据
        const demoUser = localStorage.getItem('demo_user')
        if (demoUser) {
          userInfo = JSON.parse(demoUser)
        }
      }
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }
    
    return {
      token: localStorage.getItem('token') || '',
      userInfo: userInfo,
      role: localStorage.getItem('user_role') || localStorage.getItem('demo_role') || ''
    }
  },
  
  getters: {
    isAuthenticated: (state) => !!state.token || !!state.userInfo.phone || !!state.role,
    userRole: (state) => state.role || state.userInfo.role || ''
  },
  
  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      this.role = userInfo.role
      // 使用与登录页面和路由一致的键名
      localStorage.setItem('current_user', JSON.stringify(userInfo))
      localStorage.setItem('user_role', userInfo.role)
    },
    
    clearUserInfo() {
      this.token = ''
      this.userInfo = {}
      this.role = ''
      // 清除所有相关的用户信息
      localStorage.removeItem('token')
      localStorage.removeItem('current_user')
      localStorage.removeItem('user_role')
      localStorage.removeItem('demo_mode')
      localStorage.removeItem('demo_role')
      localStorage.removeItem('demo_user')
      localStorage.removeItem('username')
      localStorage.removeItem('userRole')
    },
    
    // 模拟登录
    async login(credentials) {
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const userData = {
          username: credentials.username,
          role: credentials.role,
          token: 'demo-token-' + Date.now(),
          phone: credentials.phone || ''
        }
        
        this.setToken(userData.token)
        this.setUserInfo(userData)
        
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