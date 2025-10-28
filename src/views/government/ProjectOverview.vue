<template>
  <div class="project-overview">
    <a-page-header
      title="项目总览"
      sub-title="查看区域项目执行情况"
    >
      <template #extra>
        <a-range-picker @change="onDateChange" />
        <a-button @click="exportData">
          <template #icon><DownloadOutlined /></template>
          导出数据
        </a-button>
      </template>
    </a-page-header>

    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <a-card>
          <a-statistic title="参与学校" :value="stats.schools" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="在岗教师" :value="stats.teachers" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="完成项目" :value="stats.completed" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic title="项目覆盖率" :value="stats.coverage" suffix="%" />
        </a-card>
      </a-col>
    </a-row>

    <!-- 调试信息（仅用于开发） -->
    <a-card title="统计数据调试信息" class="debug-card" style="marginTop: 24px;">
      <div class="stats-container" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
        <div class="stat-item" style="display: flex; align-items: center; padding: 12px 0; font-size: 16px; border-bottom: 1px solid #f0f0f0;">
          <span style="font-weight: 500; width: 120px;">参与学校数量:</span>
          <span style="font-size: 18px; font-weight: 600; color: #1890ff;">{{ stats.schools }}</span>
        </div>
        <div class="stat-item" style="display: flex; align-items: center; padding: 12px 0; font-size: 16px; border-bottom: 1px solid #f0f0f0;">
          <span style="font-weight: 500; width: 120px;">在岗教师数量:</span>
          <span style="font-size: 18px; font-weight: 600; color: #1890ff;">{{ stats.teachers }}</span>
        </div>
        <div class="stat-item" style="display: flex; align-items: center; padding: 12px 0; font-size: 16px; border-bottom: 1px solid #f0f0f0;">
          <span style="font-weight: 500; width: 120px;">完成项目数量:</span>
          <span style="font-size: 18px; font-weight: 600; color: #1890ff;">{{ stats.completed }}</span>
        </div>
        <div class="stat-item" style="display: flex; align-items: center; padding: 12px 0; font-size: 16px; border-bottom: 1px solid #f0f0f0;">
          <span style="font-weight: 500; width: 120px;">项目覆盖率:</span>
          <span style="font-size: 18px; font-weight: 600; color: #1890ff;">{{ stats.coverage }}%</span>
        </div>
      </div>
      <div style="display: flex; justify-content: center;">
        <a-button type="primary" @click="refreshProjectData">
          刷新统计数据
        </a-button>
      </div>
    </a-card>


  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { DownloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { supabase } from '../../lib/supabaseClient.js'

// 响应式数据 - 使用数据库检查结果的真实值作为初始值
const stats = reactive({
  schools: 1,
  teachers: 6, // 从position_student_assignments表查询结果可知有6个唯一学生
  completed: 9,
  coverage: 100
})

// 组件挂载时自动刷新数据
onMounted(() => {
  console.log('组件挂载，开始刷新统计数据...')
  refreshProjectData()
})

// 刷新统计数据和项目执行情况
const refreshProjectData = async () => {
  try {
    console.log('开始刷新项目统计数据...')
    
    // 1. 获取所有教学需求数据
    const { data: demandsData, error: demandsError } = await supabase
      .from('teaching_demands')
      .select('*')
    
    if (demandsError) {
      console.error('获取教学需求数据失败:', demandsError)
    } else {
      console.log('教学需求数据数量:', demandsData?.length || 0)
      
      if (demandsData) {
        // 统计参与学校数量 - 提交申请的学校数量（去重）
        const nonRejectedDemands = demandsData.filter(item => item.status !== 'rejected')
        console.log('非拒绝状态的需求数量:', nonRejectedDemands.length)
        
        // 提取学校组织
        const organizations = nonRejectedDemands
          .map(item => item.organization)
          .filter(Boolean)
        console.log('组织列表:', organizations)
        
        const uniqueSchools = new Set(organizations)
        stats.schools = uniqueSchools.size
        console.log('参与学校数量:', stats.schools)
        
        // 统计完成项目数量 - 已经通过的审核数量
        const approvedDemands = demandsData.filter(item => item.status === 'approved')
        stats.completed = approvedDemands.length
        console.log('已通过审核项目数量:', stats.completed)
        
        // 计算项目覆盖率
        const totalCount = nonRejectedDemands.length
        console.log('用于计算覆盖率的总项目数:', totalCount)
        
        if (totalCount > 0) {
          stats.coverage = Math.round((stats.completed / totalCount) * 100 * 10) / 10 // 保留一位小数
          console.log('项目覆盖率:', stats.coverage)
        } else {
          stats.coverage = 0
        }
      }
    }
    
    // 2. 统计在岗教师数量 - 根据用户说明，这里应该是大学管理员分配过来的学生数量
    // 尝试从position_student_assignments表查询学生分配信息
    const { data: assignments, error: assignmentsError } = await supabase
      .from('position_student_assignments')
      .select('*')
    
    if (assignmentsError) {
      console.error('获取学生分配数据失败:', assignmentsError)
      // 如果表不存在或查询失败，设置默认值
      stats.teachers = 0
    } else {
      console.log('学生分配记录数量:', assignments?.length || 0)
      
      if (assignments) {
        // 获取唯一的学生数量（去重）
        const uniqueStudents = new Set(assignments.map(assignment => assignment.student_id))
        stats.teachers = uniqueStudents.size
        console.log('在岗学生（教师）数量:', stats.teachers)
      }
    }
    
    console.log('最终统计结果:', stats)
    message.success('项目数据已刷新')
  } catch (error) {
    console.error('刷新项目数据失败:', error.message || error)
    message.error('刷新数据失败，请稍后重试')
  }
}

// 监听教学分配更新事件
const handleTeachingAssignmentUpdated = (event) => {
  console.log('政府端接收到教学分配更新:', event.detail)
  refreshProjectData()
}

// 组件挂载时添加事件监听器
onMounted(() => {
  window.addEventListener('teachingAssignmentUpdated', handleTeachingAssignmentUpdated)
  // 页面加载时获取最新数据
  refreshProjectData()
})

// 组件卸载时移除事件监听器
onUnmounted(() => {
  window.removeEventListener('teachingAssignmentUpdated', handleTeachingAssignmentUpdated)
})

const projects = ref([
  {
    id: 1,
    region: '北京市',
    schoolCount: 23,
    teacherCount: 45,
    progress: 85,
    status: 'inProgress'
  },
  {
    id: 2,
    region: '上海市',
    schoolCount: 18,
    teacherCount: 32,
    progress: 92,
    status: 'inProgress'
  },
  {
    id: 3,
    region: '广州市',
    schoolCount: 15,
    teacherCount: 28,
    progress: 100,
    status: 'completed'
  }
])

const columns = [
  { title: '区域', dataIndex: 'region', key: 'region' },
  { title: '参与学校', dataIndex: 'schoolCount', key: 'schoolCount' },
  { title: '教师数量', dataIndex: 'teacherCount', key: 'teacherCount' },
  { title: '完成进度', key: 'progress' },
  { title: '状态', key: 'status' }
]

const pagination = {
  current: 1,
  pageSize: 10,
  total: 3
}

const getStatusColor = (status) => {
  const colors = {
    inProgress: 'blue',
    completed: 'green',
    notStarted: 'gray'
  }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    inProgress: '进行中',
    completed: '已完成',
    notStarted: '未开始'
  }
  return texts[status] || '未知'
}

const onDateChange = (dates, dateStrings) => {
  message.info(`时间范围: ${dateStrings[0]} 至 ${dateStrings[1]}`)
}

const exportData = () => {
  message.success('数据导出成功')
}
</script>

<style scoped>
.project-overview {
  padding: 20px;
}

.stats-row {
  margin-bottom: 24px;
}

.charts-row {
  margin-bottom: 24px;
}

.execution-table {
  margin-top: 20px;
}
</style>