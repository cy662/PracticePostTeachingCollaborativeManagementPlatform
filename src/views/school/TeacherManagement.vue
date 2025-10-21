<template>
  <div class="teacher-management">
    <a-page-header
      title="教师管理"
      sub-title="管理本校的支教教师"
    >
      <template #extra>
        <a-button @click="refreshTeachers">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </template>
    </a-page-header>

    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="current" tab="当前教师">
        <a-card>
          <a-table
            :columns="columns"
            :data-source="currentTeachers"
            :pagination="pagination"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" @click="viewDetails(record)">
                    详情
                  </a-button>
                  <a-button type="link" @click="startEvaluation(record)">
                    开始评价
                  </a-button>
                  <a-button type="link" @click="contactTeacher(record)">
                    联系
                  </a-button>
                </a-space>
              </template>
              <template v-else-if="column.key === 'performance'">
                <a-rate :value="record.performance" disabled />
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
      
      <a-tab-pane key="history" tab="历史教师">
        <a-card>
          <a-table
            :columns="columns"
            :data-source="historyTeachers"
            :pagination="pagination"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-button type="link" @click="viewHistory(record)">
                  查看记录
                </a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <!-- 教师详情模态框 -->
    <a-modal
      v-model:open="showDetailModal"
      title="教师详情"
      width="600px"
      :footer="null"
    >
      <a-descriptions :column="2" bordered v-if="currentTeacher">
        <a-descriptions-item label="姓名">{{ currentTeacher.name }}</a-descriptions-item>
        <a-descriptions-item label="学科">{{ currentTeacher.subject }}</a-descriptions-item>
        <a-descriptions-item label="年级">{{ currentTeacher.grade }}</a-descriptions-item>
        <a-descriptions-item label="到岗时间">{{ currentTeacher.startDate }}</a-descriptions-item>
        <a-descriptions-item label="预计结束">{{ currentTeacher.endDate }}</a-descriptions-item>
        <a-descriptions-item label="教学表现">
          <a-rate :value="currentTeacher.performance" disabled />
        </a-descriptions-item>
        <a-descriptions-item label="联系方式" :span="2">
          {{ currentTeacher.contact }}
        </a-descriptions-item>
        <a-descriptions-item label="备注" :span="2">
          {{ currentTeacher.remarks || '无' }}
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const activeTab = ref('current')
const showDetailModal = ref(false)
const currentTeacher = ref(null)

const currentTeachers = ref([
  {
    id: 1,
    name: '张三',
    subject: '数学',
    grade: '高一',
    university: '北京师范大学',
    startDate: '2023-09-01',
    endDate: '2024-01-31',
    performance: 4,
    contact: '138****1234'
  },
  {
    id: 2,
    name: '李四',
    subject: '语文',
    grade: '初二',
    university: '华东师范大学',
    startDate: '2023-09-01',
    endDate: '2024-01-31',
    performance: 5,
    contact: '139****5678'
  }
])

const historyTeachers = ref([
  {
    id: 3,
    name: '王五',
    subject: '英语',
    grade: '初三',
    university: '华南师范大学',
    period: '2022-2023学年',
    performance: 4
  }
])

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '学科', dataIndex: 'subject', key: 'subject' },
  { title: '年级', dataIndex: 'grade', key: 'grade' },
  { title: '毕业院校', dataIndex: 'university', key: 'university' },
  { title: '教学表现', key: 'performance' },
  { title: '操作', key: 'action' }
]

const pagination = {
  current: 1,
  pageSize: 10,
  total: 2
}

const viewDetails = (record) => {
  currentTeacher.value = record
  showDetailModal.value = true
}

const startEvaluation = (record) => {
  message.info(`开始评价教师: ${record.name}`)
}

const contactTeacher = (record) => {
  message.info(`联系教师: ${record.name} - ${record.contact}`)
}

const viewHistory = (record) => {
  message.info(`查看历史记录: ${record.name}`)
}

const refreshTeachers = () => {
  message.success('数据已刷新')
}
</script>

<style scoped>
.teacher-management {
  padding: 20px;
}
</style>