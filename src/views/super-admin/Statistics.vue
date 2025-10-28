<template>
  <div class="statistics">
    <div class="page-header">
      <h1>数据统计</h1>
      <p>查看管理员统计数据和平台使用情况</p>
    </div>

    <!-- 统计概览 -->
    <a-row :gutter="16" class="overview-row">
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <team-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ overview.totalAdmins }}</div>
              <div class="stat-label">总管理员数</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon active">
              <check-circle-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ overview.activeAdmins }}</div>
              <div class="stat-label">活跃管理员</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon inactive">
              <pause-circle-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ overview.inactiveAdmins }}</div>
              <div class="stat-label">停用管理员</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon pending">
              <clock-circle-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ overview.pendingAdmins }}</div>
              <div class="stat-label">待审核管理员</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 角色分布图表 -->
    <a-row :gutter="16" class="charts-row">
      <a-col :span="12">
        <a-card title="管理员角色分布" class="chart-card">
          <div ref="roleChartRef" style="height: 300px;"></div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="管理员状态分布" class="chart-card">
          <div ref="statusChartRef" style="height: 300px;"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 时间趋势图表 -->
    <a-row :gutter="16" class="trend-row">
      <a-col :span="24">
        <a-card title="管理员增长趋势" class="trend-card">
          <div ref="trendChartRef" style="height: 400px;"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 详细统计表格 -->
    <a-row :gutter="16" class="table-row">
      <a-col :span="24">
        <a-card title="详细统计" class="table-card">
          <a-table
            :data-source="detailedStats"
            :loading="loading"
            :pagination="false"
            :row-key="record => record.role"
          >
            <a-table-column key="role" title="角色" data-index="role">
              <template #default="{ text: role }">
                <a-tag :color="getRoleColor(role)">
                  {{ formatRole(role) }}
                </a-tag>
              </template>
            </a-table-column>
            <a-table-column key="total" title="总数" data-index="total" align="center" />
            <a-table-column key="active" title="活跃" data-index="active" align="center">
              <template #default="{ text: active, record }">
                <span :class="{ 'success-text': active > 0 }">{{ active }}</span>
              </template>
            </a-table-column>
            <a-table-column key="inactive" title="停用" data-index="inactive" align="center">
              <template #default="{ text: inactive, record }">
                <span :class="{ 'danger-text': inactive > 0 }">{{ inactive }}</span>
              </template>
            </a-table-column>
            <a-table-column key="pending" title="待审核" data-index="pending" align="center">
              <template #default="{ text: pending, record }">
                <span :class="{ 'warning-text': pending > 0 }">{{ pending }}</span>
              </template>
            </a-table-column>
            <a-table-column key="percentage" title="占比" data-index="percentage" align="center">
              <template #default="{ text: percentage, record }">
                <a-progress 
                  :percent="percentage" 
                  :stroke-color="getRoleColor(record.role)"
                  size="small" 
                />
              </template>
            </a-table-column>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { supabase } from '../../lib/supabaseClient.js'
import * as echarts from 'echarts'
import {
  TeamOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue'

const loading = ref(false)
const roleChartRef = ref(null)
const statusChartRef = ref(null)
const trendChartRef = ref(null)

let roleChart = null
let statusChart = null
let trendChart = null

const overview = reactive({
  totalAdmins: 0,
  activeAdmins: 0,
  inactiveAdmins: 0,
  pendingAdmins: 0
})

const detailedStats = ref([])

// 获取统计数据
const fetchStatistics = async () => {
  try {
    loading.value = true
    
    // 获取管理员统计数据
    const { data: adminStats } = await supabase
      .from('admin_statistics')
      .select('*')
    
    if (adminStats) {
      // 计算总览数据
      overview.totalAdmins = adminStats.reduce((total, stat) => total + stat.total_admins, 0)
      overview.activeAdmins = adminStats.reduce((total, stat) => total + stat.active_count, 0)
      overview.inactiveAdmins = adminStats.reduce((total, stat) => total + stat.inactive_count, 0)
      overview.pendingAdmins = adminStats.reduce((total, stat) => total + stat.pending_count, 0)
      
      // 准备详细统计数据
      detailedStats.value = adminStats.map(stat => ({
        role: stat.role,
        total: stat.total_admins,
        active: stat.active_count,
        inactive: stat.inactive_count,
        pending: stat.pending_count,
        percentage: Math.round((stat.total_admins / overview.totalAdmins) * 100)
      }))
      
      // 渲染图表
      await renderCharts(adminStats)
    }
    
  } catch (error) {
    console.error('获取统计数据失败:', error)
    message.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 渲染角色分布图表
const renderRoleChart = (data) => {
  if (!roleChartRef.value) return
  
  roleChart = echarts.init(roleChartRef.value)
  
  // 过滤掉总数为0的角色
  const validData = data.filter(item => item.total_admins > 0)
  
  if (validData.length === 0) {
    const option = {
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#999',
          fontSize: 16
        }
      }
    }
    roleChart.setOption(option)
    return
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
      data: validData.map(item => formatRole(item.role))
    },
    series: [
      {
        name: '角色分布',
        type: 'pie',
        radius: ['50%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c} ({d}%)'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: true
        },
        data: validData.map(item => ({
          value: item.total_admins,
          name: formatRole(item.role),
          itemStyle: {
            color: getChartColor(item.role)
          }
        }))
      }
    ]
  }
  
  roleChart.setOption(option)
}

// 渲染状态分布图表
const renderStatusChart = (data) => {
  if (!statusChartRef.value) return
  
  statusChart = echarts.init(statusChartRef.value)
  
  // 汇总所有角色的状态数据
  const statusData = {
    active: data.reduce((sum, item) => sum + item.active_count, 0),
    inactive: data.reduce((sum, item) => sum + item.inactive_count, 0),
    pending: data.reduce((sum, item) => sum + item.pending_count, 0)
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: ['活跃', '停用', '待审核']
    },
    series: [
      {
        name: '状态分布',
        type: 'pie',
        radius: ['50%', '70%'],
        center: ['40%', '50%'],
        data: [
          { value: statusData.active, name: '活跃', itemStyle: { color: '#52c41a' } },
          { value: statusData.inactive, name: '停用', itemStyle: { color: '#ff4d4f' } },
          { value: statusData.pending, name: '待审核', itemStyle: { color: '#faad14' } }
        ],
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold'
          }
        },
        label: {
          show: true,
          formatter: '{b}: {c} ({d}%)'
        }
      }
    ]
  }
  
  statusChart.setOption(option)
}

// 渲染趋势图表
const renderTrendChart = async (data) => {
  if (!trendChartRef.value) return
  
  trendChart = echarts.init(trendChartRef.value)
  
  try {
    // 从数据库获取实际的创建时间数据
    const { data: adminData, error } = await supabase
      .from('admin_management')
      .select('role, created_at')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('获取管理员数据失败:', error)
      return
    }
    
    // 按月份统计各角色的增长趋势
    const monthlyStats = {}
    
    adminData.forEach(admin => {
      const date = new Date(admin.created_at)
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = `${date.getMonth() + 1}月`
      
      if (!monthlyStats[yearMonth]) {
        monthlyStats[yearMonth] = {
          month: monthLabel,
          university: 0,
          government: 0,
          school: 0
        }
      }
      
      // 累计各角色的数量
      switch (admin.role) {
        case 'university':
          monthlyStats[yearMonth].university++
          break
        case 'government':
          monthlyStats[yearMonth].government++
          break
        case 'school':
          monthlyStats[yearMonth].school++
          break
      }
    })
    
    // 转换为数组并按时间排序
    const trendData = Object.values(monthlyStats).sort((a, b) => {
      const monthA = parseInt(a.month)
      const monthB = parseInt(b.month)
      return monthA - monthB
    })
    
    console.log('月度统计数据:', trendData)
    
    // 转换为累计数据
    let cumulativeUni = 0
    let cumulativeGov = 0
    let cumulativeSchool = 0
    
    const cumulativeData = trendData.map(month => {
      cumulativeUni += month.university
      cumulativeGov += month.government
      cumulativeSchool += month.school
      
      return {
        month: month.month,
        university: cumulativeUni,
        government: cumulativeGov,
        school: cumulativeSchool
      }
    })
    
    console.log('累计数据:', cumulativeData)
    
    const months = cumulativeData.map(item => item.month)
    
    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: function (params) {
          let result = params[0].axisValue + '<br/>'
          params.forEach(param => {
            result += `${param.seriesName}: ${param.value}<br/>`
          })
          return result
        }
      },
      legend: {
        data: ['大学管理员', '政府管理员', '学校管理员'],
        top: '5%',
        left: 'center'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: months
      },
      yAxis: {
        type: 'value',
        name: '管理员数量'
      },
      series: [
        {
          name: '大学管理员',
          type: 'line',
          data: cumulativeData.map(item => item.university),
          itemStyle: { color: '#1890ff' },
          lineStyle: { color: '#1890ff' },
          smooth: true
        },
        {
          name: '政府管理员',
          type: 'line',
          data: cumulativeData.map(item => item.government),
          itemStyle: { color: '#52c41a' },
          lineStyle: { color: '#52c41a' },
          smooth: true
        },
        {
          name: '学校管理员',
          type: 'line',
          data: cumulativeData.map(item => item.school),
          itemStyle: { color: '#faad14' },
          lineStyle: { color: '#faad14' },
          smooth: true
        }
      ]
    }
    
    trendChart.setOption(option)
    
  } catch (error) {
    console.error('渲染趋势图表失败:', error)
    
    // 如果获取数据失败，显示错误提示
    const option = {
      title: {
        text: '数据加载失败',
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#ff4d4f',
          fontSize: 16
        }
      }
    }
    trendChart.setOption(option)
  }
}

// 渲染所有图表
const renderCharts = async (data) => {
  renderRoleChart(data)
  renderStatusChart(data)
  await renderTrendChart(data)
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

// 获取角色颜色
const getRoleColor = (role) => {
  const colorMap = {
    'university': 'blue',
    'government': 'green',
    'school': 'orange'
  }
  return colorMap[role] || 'default'
}

// 获取图表颜色
const getChartColor = (role) => {
  const colorMap = {
    'university': '#1890ff',
    'government': '#52c41a',
    'school': '#faad14'
  }
  return colorMap[role] || '#d9d9d9'
}

// 窗口大小变化时重绘图表
const handleResize = () => {
  roleChart?.resize()
  statusChart?.resize()
  trendChart?.resize()
}

onMounted(() => {
  fetchStatistics()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  roleChart?.dispose()
  statusChart?.dispose()
  trendChart?.dispose()
})
</script>

<style scoped>
.statistics {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #262626;
}

.page-header p {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
}

.overview-row {
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

.stat-icon.total {
  background: #722ed1;
}

.stat-icon.active {
  background: #52c41a;
}

.stat-icon.inactive {
  background: #ff4d4f;
}

.stat-icon.pending {
  background: #faad14;
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

.charts-row {
  margin-bottom: 24px;
}

.chart-card {
  border-radius: 8px;
  height: 400px;
}

.trend-row {
  margin-bottom: 24px;
}

.trend-card {
  border-radius: 8px;
  height: 500px;
}

.table-row {
  margin-bottom: 0;
}

.table-card {
  border-radius: 8px;
}

.success-text {
  color: #52c41a;
  font-weight: bold;
}

.danger-text {
  color: #ff4d4f;
  font-weight: bold;
}

.warning-text {
  color: #faad14;
  font-weight: bold;
}
</style>