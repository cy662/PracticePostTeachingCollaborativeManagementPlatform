<template>
  <div class="student-management">
    <a-page-header
      title="学生管理"
      sub-title="管理具备支教资格的师范生信息"
    >
      <template #extra>
        <a-button type="primary" @click="showImportModal = true">
          <template #icon><UploadOutlined /></template>
          导入学生
        </a-button>
        <a-button @click="showAddModal = true">
          <template #icon><PlusOutlined /></template>
          添加学生
        </a-button>
      </template>
    </a-page-header>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="students"
        :pagination="pagination"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a @click="editStudent(record)">编辑</a>
              <a-popconfirm title="确定删除这个学生吗？" @confirm="deleteStudent(record.id)">
                <a style="color: #ff4d4f">删除</a>
              </a-popconfirm>
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
import { ref, reactive } from 'vue'
import { UploadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const showAddModal = ref(false)
const showImportModal = ref(false)
const addLoading = ref(false)

const addForm = reactive({
  name: '',
  studentId: '',
  major: '',
  grade: '大三'
})

const students = ref([
  {
    id: 1,
    name: '张三',
    studentId: '20210001',
    major: '数学教育',
    grade: '大三',
    status: 'available'
  },
  {
    id: 2,
    name: '李四',
    studentId: '20210002',
    major: '语文教育',
    grade: '大四',
    status: 'assigned'
  }
])

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '学号', dataIndex: 'studentId', key: 'studentId' },
  { title: '专业', dataIndex: 'major', key: 'major' },
  { title: '年级', dataIndex: 'grade', key: 'grade' },
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
    available: 'green',
    assigned: 'blue',
    completed: 'gray'
  }
  return colors[status] || 'default'
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
      id: students.value.length + 1,
      ...addForm,
      status: 'available'
    })
    message.success('添加成功')
    showAddModal.value = false
    Object.keys(addForm).forEach(key => {
      addForm[key] = key === 'grade' ? '大三' : ''
    })
  } catch (error) {
    message.error('添加失败')
  } finally {
    addLoading.value = false
  }
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
  padding: 20px;
}
</style>