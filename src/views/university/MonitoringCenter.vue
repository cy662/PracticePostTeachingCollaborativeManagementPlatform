<template>
  <div class="monitoring-center">
    <a-page-header
      title="监控中心"
      sub-title="实时监控学生支教状态"
    >
      <template #extra>
        <a-button @click="refreshData">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </template>
    </a-page-header>

    <a-row :gutter="16" class="stats-row">
      <a-col :span="6">
        <a-statistic title="在岗学生" :value="stats.onDuty" />
      </a-col>
      <a-col :span="6">
        <a-statistic title="完成支教" :value="stats.completed" />
      </a-col>
      <a-col :span="6">
        <a-statistic title="待分配" :value="stats.pending" />
      </a-col>
      <a-col :span="6">
        <a-statistic title="异常状态" :value="stats.abnormal" />
      </a-col>
    </a-row>

    <a-card title="学生状态监控" class="monitoring-table">
      <a-table
        :columns="columns"
        :data-source="students"
        :pagination="pagination"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'lastUpdate'">
            {{ formatTime(record.lastUpdate) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="viewDetails(record)">
                详情
              </a-button>
              <a-button 
                type="link" 
                danger 
                v-if="record.status === 'abnormal'"
                @click="handleAlert(record)"
              >
                处理
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const stats = reactive({
  onDuty: 45,
  completed: 23,
  pending: 12,
  abnormal: 3
})

const students = ref([
  {
    id: 1,
    name: '张三',
    school: '北京市第一中学',
    subject: '数学',
    status: 'onDuty',
    lastUpdate: new Date().toISOString()
  },
  {
    id: 2,
    name: '李四',
    school: '上海市实验学校',
    subject: '语文',
    status: 'abnormal',
    lastUpdate: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 3,
    name: '王五',
    school: '广州市第七中学',
    subject: '英语',
    status: 'completed',
    lastUpdate: new Date(Date.now() - 86400000).toISOString()
  }
])

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '支教学校', dataIndex: 'school', key: 'school' },
  { title: '学科', dataIndex: 'subject', key: 'subject' },
  { title: '状态', key: 'status' },
  { title: '最后更新', key: 'lastUpdate' },
  { title: '操作', key: 'action' }
]

const pagination = {
  current: 1,
  pageSize: 10,
  total: 3
}

const getStatusColor = (status) => {
  const colors = {
    onDuty: 'green',
    abnormal: 'red',
    completed: 'blue',
    pending: 'orange'
  }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    onDuty: '在岗',
    abnormal: '异常',
    completed: '完成',
    pending: '待分配'
  }
  return texts[status] || '未知'
}

const formatTime = (timeString) => {
  return new Date(timeString).toLocaleString('zh-CN')
}

const refreshData = () => {
  message.success('数据已刷新')
}

const viewDetails = (record) => {
  message.info(`查看学生详情: ${record.name}`)
}

const handleAlert = (record) => {
  message.warning(`处理异常状态: ${record.name}`)
}
</script>

<style scoped>
.monitoring-center {
  padding: 20px;
}

.stats-row {
  margin-bottom: 24px;
}

.monitoring-table {
  margin-top: 20px;
}
</style>