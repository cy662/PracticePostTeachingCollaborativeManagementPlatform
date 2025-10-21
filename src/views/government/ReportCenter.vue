<template>
  <div class="report-center">
    <a-page-header
      title="报告中心"
      sub-title="生成和分析项目报告"
    >
      <template #extra>
        <a-button type="primary" @click="generateReport">
          <template #icon><FileTextOutlined /></template>
          生成新报告
        </a-button>
      </template>
    </a-page-header>

    <a-row :gutter="16" class="report-templates">
      <a-col :span="8">
        <a-card 
          title="月度报告" 
          class="template-card"
          @click="generateMonthlyReport"
        >
          <template #extra>
            <FileTextOutlined />
          </template>
          <p>生成月度项目执行情况报告</p>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card 
          title="学期报告" 
          class="template-card"
          @click="generateSemesterReport"
        >
          <template #extra>
            <FileTextOutlined />
          </template>
          <p>生成学期项目总结报告</p>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card 
          title="年度报告" 
          class="template-card"
          @click="generateAnnualReport"
        >
          <template #extra>
            <FileTextOutlined />
          </template>
          <p>生成年度项目分析报告</p>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="历史报告" class="history-reports">
      <a-table
        :columns="columns"
        :data-source="reports"
        :pagination="pagination"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="viewReport(record)">
                查看
              </a-button>
              <a-button type="link" @click="downloadReport(record)">
                下载
              </a-button>
              <a-popconfirm title="确定删除这个报告吗？" @confirm="deleteReport(record.id)">
                <a style="color: #ff4d4f">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
          <template v-else-if="column.key === 'type'">
            <a-tag :color="getTypeColor(record.type)">
              {{ getTypeText(record.type) }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { FileTextOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const reports = ref([
  {
    id: 1,
    name: '2023年10月项目月报',
    type: 'monthly',
    createTime: '2023-10-21',
    size: '2.3MB',
    status: 'completed'
  },
  {
    id: 2,
    name: '2023-2024学年第一学期报告',
    type: 'semester',
    createTime: '2024-01-15',
    size: '5.1MB',
    status: 'completed'
  },
  {
    id: 3,
    name: '2023年度项目总结',
    type: 'annual',
    createTime: '2024-01-20',
    size: '8.7MB',
    status: 'completed'
  }
])

const columns = [
  { title: '报告名称', dataIndex: 'name', key: 'name' },
  { title: '类型', key: 'type' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '文件大小', dataIndex: 'size', key: 'size' },
  { title: '操作', key: 'action' }
]

const pagination = {
  current: 1,
  pageSize: 10,
  total: 3
}

const getTypeColor = (type) => {
  const colors = {
    monthly: 'blue',
    semester: 'green',
    annual: 'orange'
  }
  return colors[type] || 'default'
}

const getTypeText = (type) => {
  const texts = {
    monthly: '月度',
    semester: '学期',
    annual: '年度'
  }
  return texts[type] || '未知'
}

const generateReport = () => {
  message.info('打开报告生成向导')
}

const generateMonthlyReport = () => {
  message.success('开始生成月度报告')
}

const generateSemesterReport = () => {
  message.success('开始生成学期报告')
}

const generateAnnualReport = () => {
  message.success('开始生成年度报告')
}

const viewReport = (record) => {
  message.info(`查看报告: ${record.name}`)
}

const downloadReport = (record) => {
  message.success(`下载报告: ${record.name}`)
}

const deleteReport = (id) => {
  reports.value = reports.value.filter(report => report.id !== id)
  message.success('删除成功')
}
</script>

<style scoped>
.report-center {
  padding: 20px;
}

.report-templates {
  margin-bottom: 24px;
}

.template-card {
  cursor: pointer;
  transition: all 0.3s;
}

.template-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.history-reports {
  margin-top: 20px;
}
</style>