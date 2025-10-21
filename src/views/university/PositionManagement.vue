<template>
  <div class="position-management">
    <a-page-header
      title="岗位管理"
      sub-title="查看和分配支教岗位"
    >
      <template #extra>
        <a-button @click="refreshPositions">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </template>
    </a-page-header>

    <a-row :gutter="16">
      <a-col :span="24">
        <a-card title="岗位列表">
          <a-table
            :columns="columns"
            :data-source="positions"
            :pagination="pagination"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-space>
                  <a-button 
                    type="link" 
                    @click="openAssignModal(record)"
                    :disabled="record.status !== 'pending'"
                  >
                    分配学生
                  </a-button>
                  <a-button type="link" @click="viewDetails(record)">
                    查看详情
                  </a-button>
                </a-space>
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

    <!-- 分配学生模态框 -->
    <a-modal
      v-model:open="showAssignModal"
      title="分配学生"
      width="800px"
      @ok="handleAssign"
      :confirm-loading="assignLoading"
    >
      <a-row :gutter="16">
        <a-col :span="12">
          <a-card title="可选学生" size="small">
            <a-list
              :data-source="availableStudents"
              :loading="studentsLoading"
            >
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta
                    :title="item.name"
                    :description="`${item.major} - ${item.grade}`"
                  />
                  <template #actions>
                    <a-button type="link" @click="selectStudent(item)">
                      选择
                    </a-button>
                  </template>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="已选学生" size="small">
            <a-list :data-source="selectedStudents">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta
                    :title="item.name"
                    :description="`${item.major} - ${item.grade}`"
                  />
                  <template #actions>
                    <a-button type="link" danger @click="removeStudent(item)">
                      移除
                    </a-button>
                  </template>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const showAssignModal = ref(false)
const assignLoading = ref(false)
const studentsLoading = ref(false)
const currentPosition = ref(null)

const positions = ref([
  {
    id: 1,
    schoolName: '北京市第一中学',
    subject: '数学',
    grade: '高一',
    demand: 2,
    duration: '2023-2024学年',
    status: 'pending'
  },
  {
    id: 2,
    schoolName: '上海市实验学校',
    subject: '语文',
    grade: '初二',
    demand: 1,
    duration: '2023-2024学年',
    status: 'assigned'
  }
])

const availableStudents = ref([
  { id: 1, name: '张三', major: '数学教育', grade: '大三' },
  { id: 2, name: '李四', major: '语文教育', grade: '大四' }
])

const selectedStudents = ref([])

const columns = [
  { title: '学校名称', dataIndex: 'schoolName', key: 'schoolName' },
  { title: '学科', dataIndex: 'subject', key: 'subject' },
  { title: '年级', dataIndex: 'grade', key: 'grade' },
  { title: '需求人数', dataIndex: 'demand', key: 'demand' },
  { title: '支教时间', dataIndex: 'duration', key: 'duration' },
  { title: '状态', key: 'status' },
  { title: '操作', key: 'action' }
]

const pagination = {
  current: 1,
  pageSize: 10,
  total: 2
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    assigned: 'blue',
    completed: 'green'
  }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待分配',
    assigned: '已分配',
    completed: '已完成'
  }
  return texts[status] || '未知'
}

const openAssignModal = (position) => {
  currentPosition.value = position
  showAssignModal.value = true
  loadAvailableStudents()
}

const loadAvailableStudents = async () => {
  studentsLoading.value = true
  try {
    // 模拟加载学生数据
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    studentsLoading.value = false
  }
}

const selectStudent = (student) => {
  if (!selectedStudents.value.find(s => s.id === student.id)) {
    selectedStudents.value.push(student)
  }
}

const removeStudent = (student) => {
  selectedStudents.value = selectedStudents.value.filter(s => s.id !== student.id)
}

const handleAssign = async () => {
  if (selectedStudents.value.length === 0) {
    message.warning('请至少选择一个学生')
    return
  }

  assignLoading.value = true
  try {
    // 模拟分配逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))
    message.success('分配成功')
    showAssignModal.value = false
    selectedStudents.value = []
  } catch (error) {
    message.error('分配失败')
  } finally {
    assignLoading.value = false
  }
}

const viewDetails = (record) => {
  message.info(`查看岗位详情: ${record.schoolName}`)
}

const refreshPositions = () => {
  message.success('数据已刷新')
}
</script>

<style scoped>
.position-management {
  padding: 20px;
}
</style>