<template>
  <a-layout class="layout">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      width="200"
      class="sider"
    >
      <div class="logo">
        <h2 v-if="!collapsed">超级管理员</h2>
        <h2 v-else>超管</h2>
      </div>
      
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="handleMenuClick"
      >
        <a-menu-item key="/super-admin/dashboard">
          <dashboard-outlined />
          <span>控制台</span>
        </a-menu-item>
        <a-menu-item key="/super-admin/admin-management">
          <team-outlined />
          <span>管理员管理</span>
        </a-menu-item>
        <a-menu-item key="/super-admin/statistics">
          <bar-chart-outlined />
          <span>数据统计</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <!-- 主内容区 -->
    <a-layout>
      <!-- 顶部导航 -->
      <a-layout-header class="header">
        <div class="header-left">
          <menu-unfold-outlined
            v-if="collapsed"
            class="trigger"
            @click="() => (collapsed = !collapsed)"
          />
          <menu-fold-outlined
            v-else
            class="trigger"
            @click="() => (collapsed = !collapsed)"
          />
        </div>
        
        <div class="header-right">
          <a-dropdown>
            <a class="user-info" @click="e => e.preventDefault()">
              <user-outlined />
              <span>{{ userInfo?.name || '超级管理员' }}</span>
              <down-outlined />
            </a>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="handleLogout">
                  <logout-outlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <!-- 内容区域 -->
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { supabase } from '../lib/supabaseClient.js'
import {
  DashboardOutlined,
  TeamOutlined,
  BarChartOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  DownOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
const selectedKeys = ref([route.path])
const userInfo = ref(null)

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        userInfo.value = profile
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 菜单点击处理
const handleMenuClick = ({ key }) => {
  router.push(key)
}

// 退出登录
const handleLogout = async () => {
  try {
    await supabase.auth.signOut()
    message.success('退出成功')
    router.push('/login')
  } catch (error) {
    message.error('退出失败')
  }
}

// 监听路由变化
onMounted(() => {
  selectedKeys.value = [route.path]
  fetchUserInfo()
})
</script>

<style scoped>
.layout {
  min-height: 100vh;
}

.sider {
  background: #001529;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border-bottom: 1px solid #002140;
}

.logo h2 {
  color: white;
  margin: 0;
  font-size: 16px;
}

.header {
  background: white;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(0, 0, 0, 0.85);
}

.content {
  margin: 24px;
  padding: 24px;
  background: white;
  border-radius: 6px;
  min-height: calc(100vh - 112px);
}
</style>