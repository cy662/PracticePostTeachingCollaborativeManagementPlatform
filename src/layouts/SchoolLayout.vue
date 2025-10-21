<template>
  <a-layout class="layout">
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      width="200"
      theme="dark"
    >
      <div class="logo">
        <h2 v-if="!collapsed">中小学校</h2>
        <h2 v-else>学校</h2>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
      >
        <a-menu-item key="demand-application" @click="navigateTo('demand-application')">
          <template #icon>
            <FormOutlined />
          </template>
          <span>需求申报</span>
        </a-menu-item>
        <a-menu-item key="teacher-management" @click="navigateTo('teacher-management')">
          <template #icon>
            <TeamOutlined />
          </template>
          <span>教师管理</span>
        </a-menu-item>
        <a-menu-item key="evaluation" @click="navigateTo('evaluation')">
          <template #icon>
            <FileTextOutlined />
          </template>
          <span>评价中心</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    
    <a-layout>
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
  DownOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()
const selectedKeys = ref([route.name?.replace('School', '').toLowerCase()])
const collapsed = ref(false)

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

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  margin: 16px;
  border-radius: 6px;
}

.logo h2 {
  color: white;
  margin: 0;
  font-size: 16px;
  text-align: center;
}

.header {
  background: #fff;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.trigger {
  font-size: 18px;
  line-height: 64px;
  padding: 0 24px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
}

.content {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
}
</style>