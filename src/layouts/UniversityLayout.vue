<template>
  <a-layout class="layout">
    <a-layout-header class="header">
      <div class="logo">
        <h2>大学管理员工作台</h2>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="horizontal"
        :style="{ lineHeight: '64px' }"
      >
        <a-menu-item key="students" @click="navigateTo('students')">
          <template #icon>
            <TeamOutlined />
          </template>
          学生管理
        </a-menu-item>
        <a-menu-item key="positions" @click="navigateTo('positions')">
          <template #icon>
            <AppstoreOutlined />
          </template>
          岗位管理
        </a-menu-item>
        <a-menu-item key="monitoring" @click="navigateTo('monitoring')">
          <template #icon>
            <MonitorOutlined />
          </template>
          监控中心
        </a-menu-item>
      </a-menu>
      <div class="user-info">
        <a-dropdown>
          <a class="ant-dropdown-link" @click.prevent>
            <UserOutlined />
            {{ username }}
            <DownOutlined />
          </a>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="logout">退出登录</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </a-layout-header>
    
    <a-layout-content class="content">
      <router-view />
    </a-layout-content>
  </a-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  TeamOutlined, 
  AppstoreOutlined, 
  MonitorOutlined,
  UserOutlined, 
  DownOutlined 
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()
const selectedKeys = ref([route.name?.replace('University', '').toLowerCase()])

const username = computed(() => localStorage.getItem('username') || '大学管理员')

const navigateTo = (page) => {
  router.push(`/university/${page}`)
}

const logout = () => {
  localStorage.clear()
  message.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.logo h2 {
  color: white;
  margin: 0;
}

.user-info {
  color: white;
}

.content {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
}
</style>