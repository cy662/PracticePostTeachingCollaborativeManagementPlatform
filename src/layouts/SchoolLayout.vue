<template>
  <a-layout class="layout">
    <a-layout-header class="header">
      <div class="logo">
        <h2>中小学校工作台</h2>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="horizontal"
        :style="{ lineHeight: '64px' }"
      >
        <a-menu-item key="demand-application" @click="navigateTo('demand-application')">
          <template #icon>
            <FormOutlined />
          </template>
          需求申报
        </a-menu-item>
        <a-menu-item key="teacher-management" @click="navigateTo('teacher-management')">
          <template #icon>
            <TeamOutlined />
          </template>
          教师管理
        </a-menu-item>
        <a-menu-item key="evaluation" @click="navigateTo('evaluation')">
          <template #icon>
            <FileTextOutlined />
          </template>
          评价中心
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
  FormOutlined, 
  TeamOutlined, 
  FileTextOutlined,
  UserOutlined, 
  DownOutlined 
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()
const selectedKeys = ref([route.name?.replace('School', '').toLowerCase()])

const username = computed(() => localStorage.getItem('username') || '学校管理员')

const navigateTo = (page) => {
  router.push(`/school/${page}`)
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