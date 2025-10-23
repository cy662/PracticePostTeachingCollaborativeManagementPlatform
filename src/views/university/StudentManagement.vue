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
        <a-button type="primary" @click="handleImport">
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
      width="600px"
      @ok="handleAdd"
      :confirm-loading="addLoading"
    >
      <a-form :model="addForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="姓名" required>
              <a-input v-model:value="addForm.name" placeholder="请输入学生姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="学号" required>
              <a-input v-model:value="addForm.studentId" placeholder="请输入学号" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="性别" required>
              <a-select v-model:value="addForm.gender">
                <a-select-option value="male">男</a-select-option>
                <a-select-option value="female">女</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="出生日期">
              <a-date-picker v-model:value="addForm.birthDate" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="联系电话">
              <a-input v-model:value="addForm.phone" placeholder="请输入联系电话" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="邮箱">
              <a-input v-model:value="addForm.email" placeholder="请输入邮箱" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="专业" required>
              <a-input v-model:value="addForm.major" placeholder="请输入专业名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="年级" required>
              <a-select v-model:value="addForm.grade">
                <a-select-option value="大一">大一</a-select-option>
                <a-select-option value="大二">大二</a-select-option>
                <a-select-option value="大三">大三</a-select-option>
                <a-select-option value="大四">大四</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="班级">
              <a-input v-model:value="addForm.className" placeholder="请输入班级" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="入学年份" required>
              <a-input-number v-model:value="addForm.admissionYear" style="width: 100%" :min="2000" :max="2030" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="支教科目">
          <a-input v-model:value="addForm.teachingSubject" placeholder="请输入支教科目" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { UploadOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { supabase } from '../../lib/supabaseClient.js'

const showAddModal = ref(false)
const showImportModal = ref(false)
const addLoading = ref(false)
const loading = ref(false)
const currentUser = ref(null)

const addForm = reactive({
  name: '',
  studentId: '',
  gender: 'male',
  birthDate: '',
  phone: '',
  email: '',
  major: '',
  grade: '大三',
  className: '',
  admissionYear: new Date().getFullYear(),
  teachingSubject: ''
})

const students = ref([])

// 获取当前用户信息
const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      currentUser.value = user
      
      // 检查用户是否有大学管理员权限
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (!profile || profile.role !== 'university') {
        message.error('您没有权限访问此页面')
        return false
      }
      
      return true
    }
    return false
  } catch (error) {
    console.error('获取用户信息失败:', error)
    message.error('获取用户信息失败')
    return false
  }
}

// 加载学生数据
const loadStudents = async () => {
  loading.value = true
  try {
    if (!await getCurrentUser()) return

    // 查询学生数据
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    students.value = data || []
  } catch (error) {
    console.error('加载学生数据失败:', error)
    message.error('加载数据失败，请刷新页面重试')
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadStudents()
})

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
    dataIndex: 'student_id', 
    key: 'student_id',
    width: 120
  },
  { 
    title: '性别', 
    dataIndex: 'gender', 
    key: 'gender',
    width: 60
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
    title: '班级', 
    dataIndex: 'class_name', 
    key: 'class_name',
    width: 100
  },
  { 
    title: '状态', 
    key: 'status',
    width: 100
  },
  { 
    title: '创建时间', 
    dataIndex: 'created_at', 
    key: 'created_at',
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
    if (!await getCurrentUser()) return

    // 验证必填字段
    if (!addForm.name || !addForm.studentId || !addForm.major) {
      message.error('请填写必填字段')
      return
    }

    // 检查学号是否已存在
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('student_id', addForm.studentId)
      .single()

    if (existingStudent) {
      message.error('该学号已存在')
      return
    }

    // 添加学生到数据库
    const { data, error } = await supabase
      .from('students')
      .insert([{
        student_id: addForm.studentId,
        name: addForm.name,
        gender: addForm.gender,
        birth_date: addForm.birthDate || null,
        phone: addForm.phone || null,
        email: addForm.email || null,
        major: addForm.major,
        grade: addForm.grade,
        class_name: addForm.className || null,
        admission_year: addForm.admissionYear,
        graduation_year: addForm.admissionYear + 4,
        teaching_subject: addForm.teachingSubject || null,
        created_by: currentUser.value.id
      }])
      .select()

    if (error) throw error

    // 刷新数据
    await loadStudents()
    
    message.success('学生添加成功')
    showAddModal.value = false
    
    // 重置表单
    Object.keys(addForm).forEach(key => {
      if (key !== 'grade' && key !== 'admissionYear') {
        addForm[key] = ''
      }
    })
    addForm.grade = '大三'
    addForm.admissionYear = new Date().getFullYear()
  } catch (error) {
    console.error('添加学生失败:', error)
    message.error('添加失败，请重试')
  } finally {
    addLoading.value = false
  }
}

const refreshData = async () => {
  await loadStudents()
  message.success('数据已刷新')
}

const editStudent = (record) => {
  // 填充编辑表单
  Object.keys(addForm).forEach(key => {
    if (record[key]) {
      addForm[key] = record[key]
    }
  })
  
  // 处理字段映射
  addForm.studentId = record.student_id
  addForm.className = record.class_name
  addForm.birthDate = record.birth_date
  
  showAddModal.value = true
  message.info(`正在编辑学生: ${record.name}`)
}

const deleteStudent = async (id) => {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)

    if (error) throw error

    // 刷新数据
    await loadStudents()
    message.success('删除成功')
  } catch (error) {
    console.error('删除学生失败:', error)
    message.error('删除失败，请重试')
  }
}

// 导入学生功能
const handleImport = () => {
  message.info('导入功能开发中，请暂时使用手动添加功能')
}

// 重置表单
const resetForm = () => {
  Object.keys(addForm).forEach(key => {
    if (key !== 'grade' && key !== 'admissionYear') {
      addForm[key] = ''
    }
  })
  addForm.grade = '大三'
  addForm.admissionYear = new Date().getFullYear()
}
</script>

<style scoped>
.student-management {
  padding: 24px;
  background: #fafafa;
  min-height: 100vh;
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