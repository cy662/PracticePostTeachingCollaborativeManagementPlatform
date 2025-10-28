<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>超级管理员控制台</h1>
      <p>管理系统管理员和监控平台运行状态</p>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon university">
              <bank-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ statistics.universityAdmins }}</div>
              <div class="stat-label">大学管理员</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon government">
              <global-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ statistics.governmentAdmins }}</div>
              <div class="stat-label">政府管理员</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon school">
              <home-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ statistics.schoolAdmins }}</div>
              <div class="stat-label">学校管理员</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <team-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ statistics.totalAdmins }}</div>
              <div class="stat-label">总管理员数</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 快速操作 -->
    <a-row :gutter="16" class="quick-actions-row">
      <a-col :span="24">
        <a-card title="快速操作" class="quick-actions-card">
          <a-space :size="16">
            <a-button type="primary" @click="$router.push('/super-admin/admin-management')">
              <user-add-outlined />
              添加管理员
            </a-button>
            <a-button @click="$router.push('/super-admin/admin-management')">
              <team-outlined />
              管理管理员
            </a-button>
            <a-button @click="$router.push('/super-admin/statistics')">
              <bar-chart-outlined />
              查看统计
            </a-button>
          </a-space>
        </a-card>
      </a-col>
    </a-row>

    <!-- 最近活动 -->
    <a-row :gutter="16" class="recent-activities-row">
      <a-col :span="12">
        <a-card title="最近添加的管理员" class="recent-activities-card">
          <a-list
            :data-source="recentAdmins"
            :loading="loading"
            item-layout="horizontal"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta
                  :description="`${item.organization} | ${formatRole(item.role)}`"
                >
                  <template #title>
                    <a>{{ item.name }}</a>
                  </template>
                  <template #avatar>
                    <a-avatar style="background-color: #87d068">
                      {{ item.name.charAt(0) }}
                    </a-avatar>
                  </template>
                </a-list-item-meta>
                <div>{{ formatDate(item.created_at) }}</div>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="系统状态" class="system-status-card">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item label="平台版本">v1.0.0</a-descriptions-item>
            <a-descriptions-item label="最后更新">{{ formatDate(new Date()) }}</a-descriptions-item>
            <a-descriptions-item label="数据库状态">
              <a-tag color="green">正常</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="认证服务">
              <a-tag color="green">正常</a-tag>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { supabase } from '../../lib/supabaseClient.js'
import {
  BankOutlined,
  GlobalOutlined,
  HomeOutlined,
  TeamOutlined,
  UserAddOutlined,
  BarChartOutlined
} from '@ant-design/icons-vue'

const loading = ref(false)
const statistics = ref({
  universityAdmins: 0,
  governmentAdmins: 0,
  schoolAdmins: 0,
  totalAdmins: 0
})
const recentAdmins = ref([])

// 获取统计数据
const fetchStatistics = async () => {
  try {
    loading.value = true
    
    // 获取各角色管理员数量
    const { data: adminStats } = await supabase
      .from('admin_statistics')
      .select('*')
    
    if (adminStats) {
      adminStats.forEach(stat => {
        switch (stat.role) {
          case 'university':
            statistics.value.universityAdmins = stat.active_count
            break
          case 'government':
            statistics.value.governmentAdmins = stat.active_count
            break
          case 'school':
            statistics.value.schoolAdmins = stat.active_count
            break
        }
      })
      
      statistics.value.totalAdmins = adminStats.reduce((total, stat) => total + stat.active_count, 0)
    }
    
    // 获取最近添加的管理员
    const { data: recent } = await supabase
      .from('admin_management')
      .select(`
        *,
        user_profiles!admin_id (name, organization, role, created_at)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (recent) {
      recentAdmins.value = recent.map(item => ({
        ...item.user_profiles,
        created_at: item.created_at
      }))
    }
    
  } catch (error) {
    console.error('获取统计数据失败:', error)
    message.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 格式化角色名称
const formatRole = (role) => {
  const roleMap = {
    'university': '大学管理员',
    'government': '政府管理员',
    'school': '学校管理员'
  }
  return roleMap[role] || role
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchStatistics()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #262626;
}

.dashboard-header p {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.university {
  background: #1890ff;
}

.stat-icon.government {
  background: #52c41a;
}

.stat-icon.school {
  background: #faad14;
}

.stat-icon.total {
  background: #722ed1;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #262626;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
}

.quick-actions-row {
  margin-bottom: 24px;
}

.quick-actions-card {
  border-radius: 8px;
}

.recent-activities-row {
  margin-bottom: 0;
}

.recent-activities-card,
.system-status-card {
  border-radius: 8px;
  min-height: 300px;
}

.recent-activities-card {
  height: auto;
  min-height: 300px;
}

.system-status-card {
  height: auto;
  min-height: 300px;
}

/* 优化最近添加管理员列表样式 */
.recent-activities-card .ant-list {
  max-height: 400px;
  overflow-y: auto;
}

.recent-activities-card .ant-list-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.recent-activities-card .ant-list-item:last-child {
  border-bottom: none;
}

.recent-activities-card .ant-list-item-meta {
  align-items: center;
}

.recent-activities-card .ant-list-item-meta-title {
  margin-bottom: 4px;
}

.recent-activities-card .ant-list-item-meta-description {
  font-size: 12px;
  color: #8c8c8c;
}
</style>