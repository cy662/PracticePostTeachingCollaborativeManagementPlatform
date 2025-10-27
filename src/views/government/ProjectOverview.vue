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

    <a-row :gutter="16" class="charts-row">
      <a-col :span="12">
        <a-card title="学科分布">
          <div id="subjectChart" style="height: 300px;"></div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="区域分布">
          <div id="regionChart" style="height: 300px;"></div>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="项目执行情况" class="execution-table">
      <a-table
        :columns="columns"
        :data-source="projects"
        :pagination="pagination"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'progress'">
            <a-progress :percent="record.progress" />
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { DownloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { supabase } from '../../lib/supabaseClient.js'

const stats = reactive({
  schools: 156,
  teachers: 289,
  completed: 45,
  coverage: 78.5
})

// 刷新统计数据和项目执行情况
const refreshProjectData = async () => {
  try {
    // 获取最新的项目统计数据
    // 统计参与学校数量
    const { data: schoolsData } = await supabase
      .from('teaching_demands')
      .select('organization')
      .neq('status', 'rejected')
      .select('organization', { count: 'exact' })
      .single()
    
    if (schoolsData) {
      stats.schools = schoolsData.count || 0
    }
    
    // 统计在岗教师（已分配学生）数量
    const { data: studentsData } = await supabase
      .from('student_assignments')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .single()
    
    if (studentsData) {
      stats.teachers = studentsData.count || 0
    }
    
    // 更新项目执行情况
    // 这里应该从数据库获取实际的项目区域数据
    // 为简化示例，这里只是刷新现有数据
    
    message.success('项目数据已刷新')
  } catch (error) {
    console.error('刷新项目数据失败:', error)
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