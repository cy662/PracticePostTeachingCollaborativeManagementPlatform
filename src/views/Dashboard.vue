<template>
  <div class="dashboard">
    <a-page-header
      title="工作台"
      :sub-title="`欢迎回来，${userRoleText}`"
      @back="() => $router.back()"
    >
      <template #extra>
        <a-button @click="logout">退出登录</a-button>
      </template>
    </a-page-header>

    <div class="dashboard-content">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-card title="快速导航" class="quick-nav">
            <a-list item-layout="horizontal" :data-source="quickActions">
              <template #renderItem="{ item }">
                <a-list-item @click="handleQuickAction(item.key)">
                  <a-list-item-meta>
                    <template #title>
                      <a>{{ item.title }}</a>
                    </template>
                    <template #description>
                      <span>{{ item.description }}</span>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>

        <a-col :span="16">
          <a-card title="数据概览" class="stats-overview">
            <a-row :gutter="16">
              <a-col :span="8" v-for="stat in stats" :key="stat.title">
                <div class="stat-card">
                  <div class="stat-value">{{ stat.value }}</div>
                  <div class="stat-title">{{ stat.title }}</div>
                </div>
              </a-col>
            </a-row>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

const router = useRouter()
const userRole = localStorage.getItem('userRole')

const userRoleText = computed(() => {
  const roleMap = {
    university: '大学管理员',
    government: '政府管理员',
    school: '中小学校管理员'
  }
  return roleMap[userRole] || '用户'
})

const quickActions = computed(() => {
  const baseActions = {
    university: [
      { key: 'students', title: '学生管理', description: '管理师范生信息' },
      { key: 'positions', title: '岗位管理', description: '查看和分配岗位' },
      { key: 'monitoring', title: '监控中心', description: '实时监控学生状态' }
    ],
    government: [
      { key: 'demands', title: '需求审核', description: '审核中小学需求' },
      { key: 'overview', title: '项目总览', description: '查看区域项目情况' },
      { key: 'reports', title: '报告中心', description: '生成分析报告' }
    ],
    school: [
      { key: 'demand-application', title: '需求申报', description: '提交师资需求' },
      { key: 'teacher-management', title: '教师管理', description: '管理支教教师' },
      { key: 'evaluation', title: '评价中心', description: '进行教学评价' }
    ]
  }
  return baseActions[userRole] || []
})

const stats = ref([
  { title: '在岗人数', value: '156' },
  { title: '完成项目', value: '23' },
  { title: '待审核', value: '12' }
])

const handleQuickAction = (key) => {
  router.push(`/${userRole}/${key}`)
}

const logout = () => {
  // 检查是否为演示模式
  const demoMode = localStorage.getItem('demo_mode') === 'true'
  
  if (demoMode) {
    // 演示模式：清除演示数据
    localStorage.removeItem('demo_mode')
    localStorage.removeItem('demo_role')
    localStorage.removeItem('demo_user')
    message.success('已退出演示模式')
    // 使用 router.replace 确保路由正确跳转
    router.replace('/login')
  } else {
    // 真实模式：清除用户相关的本地存储
    localStorage.removeItem('current_user')
    localStorage.removeItem('user_role')
    message.success('已退出登录')
    // 使用 router.replace 确保路由正确跳转
    router.replace('/login')
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.dashboard-content {
  margin-top: 20px;
}

.quick-nav .ant-list-item {
  cursor: pointer;
  padding: 12px 0;
}

.quick-nav .ant-list-item:hover {
  background-color: #f5f5f5;
}

.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-title {
  color: #666;
  font-size: 14px;
}
</style>