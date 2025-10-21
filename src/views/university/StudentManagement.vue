<template>
  <div class="student-management">
    <!-- 面包屑导航 -->
    <div class="breadcrumb">
      <a-breadcrumb>
        <a-breadcrumb-item>大学管理员</a-breadcrumb-item>
        <a-breadcrumb-item>学生管理</a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- 页面标题 -->
    <div class="page-header">
      <h1>学生管理</h1>
      <p class="page-subtitle">管理具备支教资格的师范生信息</p>
    </div>

    <!-- 数据概览卡片 -->
    <a-row :gutter="16" class="stats-cards">
      <a-col :span="6">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.total }}</div>
          <div class="label">学生总数</div>
        </div>
      </a-col>
      <a-col :span="6">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.available }}</div>
          <div class="label">可分配学生</div>
        </div>
      </a-col>
      <a-col :span="6">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.assigned }}</div>
          <div class="label">已分配学生</div>
        </div>
      </a-col>
      <a-col :span="6">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.completionRate }}%</div>
          <div class="label">分配完成率</div>
        </div>
      </a-col>
    </a-row>

    <!-- 操作栏 -->
    <div class="action-bar">
      <a-space>
        <a-button type="primary" @click="showImportModal = true">
          <template #icon><UploadOutlined /></template>
          导入学生
        </a-button>
        <a-button @click="showAddModal = true">
          <template #icon><PlusOutlined /></template>
          添加学生
        </a-button>
        <a-button @click="refreshData">
          <template #icon><ReloadOutlined /></template>
          刷新数据
        </a-button>
      </a-space>
    </div>

    <!-- 学生列表 -->
    <a-card class="content-card">
      <a-table
        :columns="columns"
        :data-source="students"
        :pagination="pagination"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="editStudent(record)">
                编辑
              </a-button>
              <a-popconfirm 
                title="确定删除这个学生吗？" 
                @confirm="deleteStudent(record.id)"
                ok-text="确定"
                cancel-text="取消"
              >
                <a-button type="link" size="small" style="color: var(--error-color)">
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
          <template v-else-if="column.key === 'status'">
            <span :class="['status-tag', `status-${record.status}`]">
              {{ getStatusText(record.status) }}
            </span>
          </template>
          <template v-else-if="column.key === 'performance'">
            <a-rate :value="record.performance" disabled />
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加学生模态框 -->
    <a-modal
      v-model:open="showAddModal"
      title="添加学生"
      @ok="handleAdd"
      :confirm-loading="addLoading"
    >
      <a-form :model="addForm" layout="vertical">
        <a-form-item label="姓名" required>
          <a-input v-model:value="addForm.name" />
        </a-form-item>
        <a-form-item label="学号" required>
          <a-input v-model:value="addForm.studentId" />
        </a-form-item>
        <a-form-item label="专业" required>
          <a-input v-model:value="addForm.major" />
        </a-form-item>
        <a-form-item label="年级" required>
          <a-select v-model:value="addForm.grade">
            <a-select-option value="大一">大一</a-select-option>
            <a-select-option value="大二">大二</a-select-option>
            <a-select-option value="大三">大三</a-select-option>
            <a-select-option value="大四">大四</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { UploadOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const showAddModal = ref(false)
const showImportModal = ref(false)
const addLoading = ref(false)

const addForm = reactive({
  name: '',
  studentId: '',
  major: '',
  grade: '大三',
  performance: 4
})

const students = ref([
  {
    id: 1,
    name: '张三',
    studentId: '20210001',
    major: '数学教育',
    grade: '大三',
    status: 'available',
    performance: 4,
    createTime: '2023-10-15'
  },
  {
    id: 2,
    name: '李四',
    studentId: '20210002',
    major: '语文教育',
    grade: '大四',
    status: 'assigned',
    performance: 5,
    createTime: '2023-10-10'
  },
  {
    id: 3,
    name: '王五',
    studentId: '20210003',
    major: '英语教育',
    grade: '大三',
    status: 'available',
    performance: 3,
    createTime: '2023-10-18'
  }
])

// 统计数据
const stats = computed(() => {
  const total = students.value.length
  const available = students.value.filter(s => s.status === 'available').length
  const assigned = students.value.filter(s => s.status === 'assigned').length
  const completionRate = total > 0 ? Math.round((assigned / total) * 100) : 0
  
  return { total, available, assigned, completionRate }
})

const columns = [
  { 
    title: '姓名', 
    dataIndex: 'name', 
    key: 'name',
    width: 100
  },
  { 
    title: '学号', 
    dataIndex: 'studentId', 
    key: 'studentId',
    width: 120
  },
  { 
    title: '专业', 
    dataIndex: 'major', 
    key: 'major',
    width: 150
  },
  { 
    title: '年级', 
    dataIndex: 'grade', 
    key: 'grade',
    width: 80
  },
  { 
    title: '教学表现', 
    key: 'performance',
    width: 150
  },
  { 
    title: '状态', 
    key: 'status',
    width: 100
  },
  { 
    title: '创建时间', 
    dataIndex: 'createTime', 
    key: 'createTime',
    width: 120
  },
  { 
    title: '操作', 
    key: 'action',
    width: 150
  }
]

const pagination = {
  current: 1,
  pageSize: 10,
  total: 3,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
}

const getStatusText = (status) => {
  const texts = {
    available: '可分配',
    assigned: '已分配',
    completed: '已完成'
  }
  return texts[status] || '未知'
}

const handleAdd = async () => {
  addLoading.value = true
  try {
    // 模拟添加逻辑
    students.value.push({
      id: Date.now(),
      ...addForm,
      status: 'available',
      createTime: new Date().toISOString().split('T')[0]
    })
    message.success({
      content: '学生添加成功',
      className: 'success-message'
    })
    showAddModal.value = false
    Object.keys(addForm).forEach(key => {
      if (key !== 'grade' && key !== 'performance') {
        addForm[key] = ''
      }
    })
    addForm.grade = '大三'
    addForm.performance = 4
  } catch (error) {
    message.error('添加失败')
  } finally {
    addLoading.value = false
  }
}

const refreshData = () => {
  message.success('数据已刷新')
}

const editStudent = (record) => {
  message.info(`编辑学生: ${record.name}`)
}

const deleteStudent = (id) => {
  students.value = students.value.filter(student => student.id !== id)
  message.success('删除成功')
}
</script>

<style scoped>
.student-management {
  padding: 24px;
  background: #fafafa;
  min-height: 100%;
}

.breadcrumb {
  margin-bottom: 16px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.stats-cards {
  margin-bottom: 24px;
}

.action-bar {
  margin-bottom: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.content-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .student-management {
    padding: 16px;
  }
  
  .stats-cards .ant-col {
    margin-bottom: 16px;
  }
}
</style>