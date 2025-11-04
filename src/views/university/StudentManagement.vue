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
              <a-button type="link" size="small" @click="() => handleEditClick(record)">
                修改
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
          <template v-else-if="column.key === 'created_at'">
            {{ formatDateTimeToCST(record.created_at) }}
          </template>
          <template v-else-if="column.key === 'gender'">
            {{ getGenderText(record.gender) }}
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 导入学生模态框 -->
    <a-modal
      v-model:open="showImportModal"
      title="导入学生"
      width="800px"
      @ok="handleImportSubmit"
      :confirm-loading="importLoading"
    >
      <div class="import-container">
        <!-- 文件上传区域 -->
        <div class="upload-section">
          <a-upload-dragger
            :before-upload="beforeUpload"
            :file-list="fileList"
            :multiple="false"
            accept=".xlsx,.xls"
            @change="handleUploadChange"
            :show-upload-list="false"
            :custom-request="customUploadRequest"
          >
            <p class="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p class="ant-upload-text">点击或拖拽Excel文件到此区域上传</p>
            <p class="ant-upload-hint">
              支持 .xlsx 和 .xls 格式文件，文件大小不超过10MB
            </p>
          </a-upload-dragger>
        </div>

        <!-- 导入进度和结果 -->
        <div v-if="importResult" class="import-result">
          <a-divider />
          <h4>导入结果</h4>
          <a-descriptions bordered size="small">
            <a-descriptions-item label="总记录数">{{ importResult.total }}</a-descriptions-item>
            <a-descriptions-item label="成功导入">{{ importResult.success }}</a-descriptions-item>
            <a-descriptions-item label="失败记录">{{ importResult.failed }}</a-descriptions-item>
          </a-descriptions>
          
          <div v-if="importResult.errors && importResult.errors.length > 0" class="error-list">
            <h5>错误详情：</h5>
            <a-list size="small" :data-source="importResult.errors">
              <template #renderItem="{ item }">
                <a-list-item>
                  <span style="color: #ff4d4f">第{{ item.row }}行: {{ item.message }}</span>
                </a-list-item>
              </template>
            </a-list>
          </div>
        </div>

        <!-- 模板下载 -->
        <div class="template-section">
          <a-button type="link" @click="downloadTemplate">
            <DownloadOutlined />
            下载导入模板
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 添加学生模态框 -->
    <a-modal
      v-model:open="showAddModal"
      title="添加学生"
      width="600px"
      @ok="handleAdd"
      @cancel="handleModalCancel"
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
            <a-form-item label="学号" required
              :validate-status="getStudentIdStatus(addForm.studentId)"
              :help="getStudentIdHelp(addForm.studentId)">
              <a-input v-model:value="addForm.studentId" placeholder="请输入8-12位字母和数字组合" />
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
            <a-form-item label="联系电话"
              :validate-status="getPhoneStatus(addForm.phone)"
              :help="getPhoneHelp(addForm.phone)">
              <a-input v-model:value="addForm.phone" placeholder="请输入11位中国大陆手机号码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="邮箱"
              :validate-status="getEmailStatus(addForm.email)"
              :help="getEmailHelp(addForm.email)">
              <a-input v-model:value="addForm.email" placeholder="请输入有效的邮箱地址" />
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

    <!-- 修改学生模态框 -->
    <a-modal
      v-model:open="showEditModal"
      title="修改学生信息"
      width="600px"
      @ok="handleEditSubmit"
      @cancel="handleEditCancel"
      :confirm-loading="editLoading"
    >
      <a-form :model="editForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="姓名" required>
              <a-input v-model:value="editForm.name" placeholder="请输入学生姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="学号" required>
              <a-input v-model:value="editForm.studentId" placeholder="请输入学号" disabled />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="性别" required>
              <a-select v-model:value="editForm.gender">
                <a-select-option value="male">男</a-select-option>
                <a-select-option value="female">女</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="出生日期">
              <a-date-picker v-model:value="editForm.birthDate" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="联系电话"
              :validate-status="getPhoneStatus(editForm.phone)"
              :help="getPhoneHelp(editForm.phone)">
              <a-input v-model:value="editForm.phone" placeholder="请输入11位中国大陆手机号码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="邮箱"
              :validate-status="getEmailStatus(editForm.email)"
              :help="getEmailHelp(editForm.email)">
              <a-input v-model:value="editForm.email" placeholder="请输入有效的邮箱地址" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="专业" required>
              <a-input v-model:value="editForm.major" placeholder="请输入专业名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="年级" required>
              <a-select v-model:value="editForm.grade">
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
              <a-input v-model:value="editForm.className" placeholder="请输入班级" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="入学年份" required>
              <a-input-number v-model:value="editForm.admissionYear" style="width: 100%" :min="2000" :max="2030" />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="支教科目">
          <a-input v-model:value="editForm.teachingSubject" placeholder="请输入支教科目" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { UploadOutlined, PlusOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { supabase } from '../../lib/supabaseClient.js'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import { useUserStore } from '../../stores/user.js'

const showAddModal = ref(false)
const showImportModal = ref(false)
const showEditModal = ref(false)
const addLoading = ref(false)
const importLoading = ref(false)
const editLoading = ref(false)
const loading = ref(false)
const currentUser = ref(null)
const isEditing = ref(false)
const editingStudentId = ref(null)

// 使用Pinia store
const userStore = useUserStore()

// 导入相关变量
const fileList = ref([])
const importResult = ref(null)

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

const editForm = reactive({
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
    // 优先从Pinia store获取用户信息
    if (userStore.isAuthenticated) {
      currentUser.value = userStore.userInfo
      console.log('使用Pinia store用户信息:', currentUser.value)
    } else {
      // 首先尝试从localStorage获取用户信息（兼容演示模式和真实模式）
      const currentUserStr = localStorage.getItem('current_user') || localStorage.getItem('demo_user')
      
      if (!currentUserStr) {
        message.error('未找到用户信息，请重新登录')
        // 清除可能存在的过时用户数据
        localStorage.clear()
        // 跳转到登录页
        window.location.href = '/login'
        return false
      }
      
      let userInfo
      try {
        userInfo = JSON.parse(currentUserStr)
      } catch (e) {
        message.error('用户信息解析失败')
        localStorage.clear()
        window.location.href = '/login'
        return false
      }
      
      currentUser.value = userInfo
      // 同时更新到Pinia store
      userStore.setUserInfo(currentUser.value)
    }
    
    // 检查是否为演示模式
    const demoMode = localStorage.getItem('demo_mode') === 'true'
    
    if (demoMode) {
      // 演示模式：直接检查角色
      if (currentUser.value.role !== 'university') {
        message.error('您没有权限访问此页面')
        return false
      }
      return true
    }
    
    // 真实模式：尝试检查用户权限
    // 方法1：直接从用户信息检查角色
    if (currentUser.value.role && currentUser.value.role === 'university') {
      return true
    }
    
    // 方法2：如果用户信息中没有角色信息，尝试从Supabase获取
    try {
      // 尝试获取用户ID
      let userId
      if (currentUser.value.id) {
        userId = currentUser.value.id
      } else {
        // 作为后备，尝试使用Supabase认证
        try {
          const { data: authData } = await supabase.auth.getUser()
          if (authData.user) {
            userId = authData.user.id
          }
        } catch (authError) {
          console.warn('Supabase认证失败，使用本地用户信息')
        }
      }
      
      if (userId) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', userId)
          .single()
        
        if (!profile || profile.role !== 'university') {
          message.error('您没有权限访问此页面')
          return false
        }
        
        // 更新用户信息到store
      userStore.setUserInfo(profile)
      } else {
        // 如果无法获取用户ID，回退到检查本地角色
        const userRole = localStorage.getItem('user_role') || localStorage.getItem('demo_role')
        if (!userRole || userRole !== 'university') {
          message.error('您没有权限访问此页面')
          return false
        }
        
        // 更新用户角色信息到store
      if (currentUser.value) {
        currentUser.value.role = userRole
        userStore.setUserInfo(currentUser.value)
      }
      }
      
      return true
    } catch (profileError) {
      console.error('获取用户权限失败:', profileError)
      // 作为最后的后备，检查本地存储的角色
      const userRole = localStorage.getItem('user_role') || localStorage.getItem('demo_role')
      if (!userRole || userRole !== 'university') {
        message.error('您没有权限访问此页面')
        return false
      }
      
      // 更新用户角色信息到store
      if (currentUser.value) {
        currentUser.value.role = userRole
        userStore.setUserInfo(currentUser.value)
      }
      return true
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    message.error('获取用户信息失败')
    return false
  }
}

// 加载学生数据
const loadStudents = async (usePagination = true) => {
  loading.value = true
  try {
    if (!await getCurrentUser()) return

    // 构建查询 - 使用更明确的方式避免 406 错误
    const columns = 'id,student_id,name,gender,birth_date,phone,email,major,grade,class_name,admission_year,graduation_year,teaching_subject,created_by,status,created_at'
    let query = supabase
      .from('students')
      .select(columns)
      .order('created_at', { ascending: false })
    
    // 应用分页（除非指定不使用）
    if (usePagination) {
      const offset = (pagination.current - 1) * pagination.pageSize
      query = query.range(offset, offset + pagination.pageSize - 1)
      
      // 获取总数
      const { count: totalCount, error: countError } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
      
      if (countError) {
        console.error('获取总数失败:', countError)
        // 使用默认值继续，避免整个功能失败
        pagination.total = 0
      } else {
        pagination.total = totalCount || 0
      }
    }

    const { data, error } = await query
    
    if (error) {
      console.error('查询学生数据失败:', error)
      throw error
    }
    students.value = data || []
  } catch (error) {
    console.error('加载学生数据失败:', error)
    message.error('加载数据失败，请检查网络连接或联系管理员')
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  await loadStudents()
  // 可以选择在加载数据后更新统计信息
  
  // 添加事件监听器，响应学生状态变化
  window.addEventListener('studentStatusChanged', async () => {
    console.log('收到学生状态变化事件，更新数据...')
    await loadStudents()
  })
})

// 组件卸载时移除事件监听器
onUnmounted(() => {
  window.removeEventListener('studentStatusChanged', async () => {
    await loadStudents()
  })
})

// 更新统计数据的函数
const updateStats = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('status')
    
    if (error) throw error
    
    const total = data.length
    const available = data.filter(s => s.status === 'available').length
    const assigned = data.filter(s => s.status === 'assigned').length
    const completionRate = total > 0 ? Math.round((assigned / total) * 100) : 0
    
    // 直接更新stats值，保持使用computed
    // 这里stats仍是computed，但我们确保在数据变化时调用此函数更新显示
  } catch (error) {
    console.error('更新统计数据失败:', error)
  }
}

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
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  onChange: async (page, pageSize) => {
    pagination.current = page
    pagination.pageSize = pageSize
    await loadStudents()
  },
  onShowSizeChange: async (current, pageSize) => {
    pagination.pageSize = pageSize
    pagination.current = 1
    await loadStudents()
  }
}

const getStatusText = (status) => {
  const texts = {
    available: '可分配',
    assigned: '已分配',
    completed: '已完成'
  }
  return texts[status] || '未知'
}

// 性别中文转换
const getGenderText = (gender) => {
  const texts = {
    male: '男',
    female: '女'
  }
  return texts[gender] || gender
}

// 格式化时间为东八区（CST）格式
const formatDateTimeToCST = (dateString) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    
    // 添加8小时转换为东八区时间
    const cstDate = new Date(date.getTime() + 8 * 60 * 60 * 1000)
    
    const year = cstDate.getUTCFullYear()
    const month = String(cstDate.getUTCMonth() + 1).padStart(2, '0')
    const day = String(cstDate.getUTCDate()).padStart(2, '0')
    const hours = String(cstDate.getUTCHours()).padStart(2, '0')
    const minutes = String(cstDate.getUTCMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    console.error('日期格式化错误:', error)
    return ''
  }
}

// 学号验证状态函数
const getStudentIdStatus = (studentId) => {
  if (!studentId) return ''
  if (/^[A-Za-z0-9]{8,12}$/.test(studentId)) return 'success'
  return 'error'
}

const getStudentIdHelp = (studentId) => {
  if (!studentId) return '请输入8-12位字母和数字组合'
  if (/^[A-Za-z0-9]{8,12}$/.test(studentId)) return ''
  return '学号格式不正确，应为8-12位字母和数字组合'
}

// 电话号码验证状态函数
const getPhoneStatus = (phone) => {
  if (!phone) return ''
  if (/^1[3-9]\d{9}$/.test(phone)) return 'success'
  return 'error'
}

const getPhoneHelp = (phone) => {
  if (!phone) return '请输入11位中国大陆手机号码'
  if (/^1[3-9]\d{9}$/.test(phone)) return ''
  return '电话号码格式不正确，应为11位中国大陆手机号码'
}

// 邮箱验证状态函数
const getEmailStatus = (email) => {
  if (!email) return ''
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return 'success'
  return 'error'
}

const getEmailHelp = (email) => {
  if (!email) return '请输入有效的邮箱地址'
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return ''
  return '邮箱格式不正确，请输入有效的邮箱地址'
}

// 处理学生添加提交
const handleAdd = async () => {
  addLoading.value = true
  try {
    // 验证用户权限
    if (!await getCurrentUser()) {
      closeModalAndReset()
      return
    }

    // 验证必填字段
    if (!addForm.name || !addForm.studentId || !addForm.major) {
      message.error('请填写必填字段')
      return
    }

    // 验证学号格式 - 更严格的验证
    if (!/^[A-Za-z0-9]{8,12}$/.test(addForm.studentId)) {
      message.error('学号格式不正确，请使用8-12位字母和数字组合')
      return
    }

    // 验证电话号码格式
    if (addForm.phone && !/^1[3-9]\d{9}$/.test(addForm.phone)) {
      message.error('电话号码格式不正确，请输入11位中国大陆手机号码')
      return
    }

    // 验证邮箱格式
    if (addForm.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(addForm.email)) {
      message.error('邮箱格式不正确，请输入有效的邮箱地址')
      return
    }

    // 检查学号是否已存在（使用更可靠的查询方式）
    const { data: existingStudents, error: checkError } = await supabase
      .from('students')
      .select('id')
      .eq('student_id', addForm.studentId)
      .limit(1)

    if (checkError) {
      console.error('检查学号是否存在时出错:', checkError)
      message.error('系统错误，请稍后重试')
      return
    }

    if (existingStudents && existingStudents.length > 0) {
      message.error('该学号已存在，请使用不同的学号')
      return
    }

    // 处理日期格式
    let birthDateValue = null
    if (addForm.birthDate) {
      const date = dayjs(addForm.birthDate)
      if (date.isValid()) {
        birthDateValue = date.format('YYYY-MM-DD')
      } else {
        message.error('出生日期格式不正确')
        return
      }
    }

    // 验证入学年份
    const currentYear = new Date().getFullYear()
    if (addForm.admissionYear < 2000 || addForm.admissionYear > currentYear + 1) {
      message.error('入学年份应该在2000年到' + (currentYear + 1) + '年之间')
      return
    }

    // 添加学生到数据库
    const newStudentData = {
      student_id: addForm.studentId,
      name: addForm.name,
      gender: addForm.gender,
      birth_date: birthDateValue,
      phone: addForm.phone || null,
      email: addForm.email || null,
      major: addForm.major,
      grade: addForm.grade,
      class_name: addForm.className || null,
      admission_year: addForm.admissionYear,
      graduation_year: addForm.admissionYear + 4,
      teaching_subject: addForm.teachingSubject || null,
      created_by: currentUser.value.id,
      status: 'available'
    }

    const { data, error } = await supabase
      .from('students')
      .insert([newStudentData])
      .select()

    if (error) {
      console.error('添加学生失败:', error)
      // 特殊处理冲突错误
      if (error.code === '23505') { // PostgreSQL 唯一约束冲突错误码
        message.error('添加失败：学号已存在')
      } else if (error.code === '409') {
        message.error('添加失败：数据冲突，请检查输入')
      } else {
        throw error
      }
      return
    }

    if (!data || data.length === 0) {
      message.error('添加失败：未返回新添加的学生数据')
      return
    }

    // 重新加载数据以显示新添加的学生
    await loadStudents()
    
    message.success('学生添加成功')
    closeModalAndReset()
  } catch (error) {
    console.error('添加学生失败:', error)
    message.error('添加失败，请检查网络连接或联系管理员')
    closeModalAndReset()
  } finally {
    addLoading.value = false
  }
}



// 点击修改按钮
const handleEditClick = (record) => {
  try {
    // 检查记录是否有效
    if (!record || !record.id) {
      console.error('无效的学生记录:', record)
      message.error('无法修改该学生，记录无效')
      return
    }
    
    console.log('修改学生记录:', record.id)
    
    // 重置编辑表单
    resetEditForm()
    editingStudentId.value = record.id
    
    // 填充表单数据
    editForm.name = record.name || ''
    editForm.studentId = record.student_id || ''
    editForm.gender = record.gender || 'male'
    editForm.phone = record.phone || ''
    editForm.email = record.email || ''
    editForm.major = record.major || ''
    editForm.grade = record.grade || '大三'
    editForm.className = record.class_name || ''
    editForm.admissionYear = record.admission_year || new Date().getFullYear()
    editForm.teachingSubject = record.teaching_subject || ''
    
    // 处理日期
    if (record.birth_date) {
      try {
        const date = dayjs(record.birth_date)
        if (date.isValid()) {
          editForm.birthDate = date
        } else {
          editForm.birthDate = null
        }
      } catch (e) {
        console.warn('日期解析错误:', e)
        editForm.birthDate = null
      }
    } else {
      editForm.birthDate = null
    }
    
    // 打开修改模态框
    showEditModal.value = true
    console.log('修改模态框已打开')
  } catch (error) {
    console.error('修改学生时出错:', error)
    message.error('加载学生数据失败')
  }
}

// 处理修改提交
const handleEditSubmit = async () => {
  editLoading.value = true
  try {
    // 验证用户权限
    const user = await getCurrentUser()
    if (!user) {
      message.error('用户未登录')
      closeEditModal()
      return
    }

    // 验证必填字段
    if (!editForm.name.trim()) {
      message.error('请输入学生姓名')
      return
    }
    if (!editForm.major.trim()) {
      message.error('请输入专业')
      return
    }

    // 验证电话号码格式
    if (editForm.phone && !/^1[3-9]\d{9}$/.test(editForm.phone)) {
      message.error('电话号码格式不正确，请输入11位中国大陆手机号码')
      return
    }

    // 验证邮箱格式
    if (editForm.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(editForm.email)) {
      message.error('邮箱格式不正确，请输入有效的邮箱地址')
      return
    }

    // 处理日期格式
    let birthDateValue = null
    if (editForm.birthDate) {
      const date = dayjs(editForm.birthDate)
      if (date.isValid()) {
        birthDateValue = date.format('YYYY-MM-DD')
      }
    }

    // 准备更新数据
    const updateData = {
      name: editForm.name.trim(),
      gender: editForm.gender,
      birth_date: birthDateValue,
      phone: editForm.phone?.trim() || null,
      email: editForm.email?.trim() || null,
      major: editForm.major.trim(),
      grade: editForm.grade,
      class_name: editForm.className?.trim() || null,
      admission_year: Number(editForm.admissionYear),
      graduation_year: Number(editForm.admissionYear) + 4,
      teaching_subject: editForm.teachingSubject?.trim() || null,
      updated_at: new Date().toISOString()
    }

    // 执行数据库更新
    const { error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', editingStudentId.value)
      .select()

    if (error) {
      console.error('数据库更新错误:', error)
      throw error
    }

    // 更新本地学生列表
    const index = students.value.findIndex(s => s.id === editingStudentId.value)
    if (index !== -1) {
      students.value[index] = { ...students.value[index], ...updateData }
      students.value = [...students.value] // 强制数组更新，触发UI重新渲染
    }
    
    message.success('学生信息修改成功')
    
    // 关闭模态框
    closeEditModal()
  } catch (error) {
    console.error('修改学生失败:', error)
    message.error('修改失败，请重试')
  } finally {
    editLoading.value = false
  }
}

// 处理修改取消
const handleEditCancel = () => {
  message.info('已取消修改操作')
  closeEditModal()
}

// 关闭修改模态框
const closeEditModal = () => {
  showEditModal.value = false
  setTimeout(() => {
    resetEditForm()
    editingStudentId.value = null
  }, 100)
}

// 重置修改表单
const resetEditForm = () => {
  editForm.name = ''
  editForm.studentId = ''
  editForm.gender = 'male'
  editForm.birthDate = null
  editForm.phone = ''
  editForm.email = ''
  editForm.major = ''
  editForm.grade = '大三'
  editForm.className = ''
  editForm.admissionYear = new Date().getFullYear()
  editForm.teachingSubject = ''
}

const refreshData = async () => {
  await loadStudents()
  message.success('数据已刷新')
}



const deleteStudent = async (id) => {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)

    if (error) throw error

    // 从本地列表中移除，避免重新加载全部数据
    const index = students.value.findIndex(s => s.id === id)
    if (index !== -1) {
      students.value.splice(index, 1)
      pagination.total-- // 更新总数
    }
    message.success('删除成功')
  } catch (error) {
    console.error('删除学生失败:', error)
    message.error('删除失败，请重试')
  }
}

// 导入学生功能
const handleImport = () => {
  showImportModal.value = true
  importResult.value = null
  fileList.value = []
}

// 文件上传前验证
const beforeUpload = (file) => {
  // 检查文件扩展名
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isExcel) {
    message.error('只能上传Excel文件（.xlsx 或 .xls 格式）!')
    return false
  }
  if (!isLt10M) {
    message.error('文件大小不能超过10MB!')
    return false
  }
  
  // 返回true允许文件被添加到上传列表，然后通过customRequest处理
  return true
}

// 自定义上传请求（直接处理文件，不进行HTTP上传）
const customUploadRequest = (options) => {
  const { file, onSuccess, onError, onProgress } = options
  
  // 立即开始处理文件，不需要模拟上传进度
  try {
    // 立即标记为上传成功
    onProgress({ percent: 100 })
    
    // 延迟一点时间调用成功回调，让进度条有显示时间
    setTimeout(() => {
      onSuccess('ok', file)
      
      // 直接解析文件
      if (file) {
        parseExcelFile(file)
      }
    }, 500)
  } catch (error) {
    console.error('文件处理失败:', error)
    onError(error)
  }
}

// 处理文件上传变化
const handleUploadChange = (info) => {
  const { file } = info
  
  // 更新文件列表
  fileList.value = [file]
  
  if (file.status === 'uploading') {
    // 上传中，不需要额外处理
    return
  }
  
  if (file.status === 'done') {
    message.success(`${file.name} 文件上传成功`)
    // 文件解析已经在customRequest中处理
  } else if (file.status === 'error') {
    message.error(`${file.name} 文件上传失败`)
  }
}

// 解析Excel文件
const parseExcelFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      // 验证数据格式
      const validatedData = validateImportData(jsonData)
      importResult.value = validatedData
      
      if (validatedData.errors.length > 0) {
        message.warning(`发现 ${validatedData.errors.length} 条数据错误，请检查后重新导入`)
      } else {
        message.success(`成功解析 ${validatedData.total} 条学生数据`)
      }
    } catch (error) {
      console.error('解析Excel文件失败:', error)
      message.error('文件解析失败，请检查文件格式')
    }
  }
  reader.readAsArrayBuffer(file)
}

// 验证导入数据
const validateImportData = (data) => {
  const result = {
    total: data.length,
    success: 0,
    failed: 0,
    errors: [],
    validData: []
  }

  data.forEach((row, index) => {
    const rowNumber = index + 2 // Excel行号从2开始（第一行是标题）
    const errors = []

    // 必填字段验证
    if (!row.学号 || !row.姓名 || !row.专业) {
      errors.push('学号、姓名、专业为必填字段')
    }

    // 学号格式验证
    if (row.学号 && !/^[A-Za-z0-9]{8,12}$/.test(row.学号)) {
      errors.push('学号格式不正确，应为8-12位字母和数字组合')
    }

    // 电话号码格式验证
    if (row.联系电话 && !/^1[3-9]\d{9}$/.test(row.联系电话)) {
      errors.push('电话号码格式不正确，应为11位中国大陆手机号码')
    }

    // 邮箱格式验证
    if (row.邮箱 && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(row.邮箱)) {
      errors.push('邮箱格式不正确，请输入有效的邮箱地址')
    }

    // 性别验证
    if (row.性别 && !['男', '女'].includes(row.性别)) {
      errors.push('性别只能是"男"或"女"')
    }

    // 年级验证
    if (row.年级 && !['大一', '大二', '大三', '大四'].includes(row.年级)) {
      errors.push('年级格式不正确，应为：大一、大二、大三、大四')
    }

    if (errors.length === 0) {
      result.validData.push({
        student_id: row.学号,
        name: row.姓名,
        gender: row.性别 === '男' ? 'male' : 'female',
        birth_date: row.出生日期,
        phone: row.联系电话,
        email: row.邮箱,
        major: row.专业,
        grade: row.年级,
        class_name: row.班级,
        admission_year: row.入学年份 || new Date().getFullYear(),
        teaching_subject: row.支教科目
      })
      result.success++
    } else {
      result.failed++
      result.errors.push({
        row: rowNumber,
        message: errors.join('; ')
      })
    }
  })

  return result
}

// 提交导入
const handleImportSubmit = async () => {
  if (!importResult.value || importResult.value.validData.length === 0) {
    message.error('没有有效数据可导入')
    return
  }

  importLoading.value = true
  try {
    if (!await getCurrentUser()) return

    // 检查重复学号
    const studentIds = importResult.value.validData.map(item => item.student_id)
    const { data: existingStudents } = await supabase
      .from('students')
      .select('student_id')
      .in('student_id', studentIds)

    const existingIds = existingStudents?.map(s => s.student_id) || []
    const duplicateIds = studentIds.filter(id => existingIds.includes(id))

    if (duplicateIds.length > 0) {
      message.error(`以下学号已存在: ${duplicateIds.join(', ')}`)
      return
    }

    // 批量插入数据
    const studentsToInsert = importResult.value.validData.map(student => ({
      ...student,
      created_by: currentUser.value.id,
      status: 'available'
    }))

    const { error } = await supabase
      .from('students')
      .insert(studentsToInsert)

    if (error) throw error

    // 刷新数据
    await loadStudents()
    
    message.success(`成功导入 ${importResult.value.validData.length} 名学生`)
    showImportModal.value = false
    importResult.value = null
    fileList.value = []
    
  } catch (error) {
    console.error('导入学生失败:', error)
    message.error('导入失败，请重试')
  } finally {
    importLoading.value = false
  }
}

// 下载导入模板
const downloadTemplate = () => {
  // 创建模板数据
  const templateData = [
    {
      '学号': '20210001',
      '姓名': '张三',
      '性别': '男',
      '出生日期': '2000-01-15',
      '联系电话': '13800138000',
      '邮箱': 'zhangsan@example.com',
      '专业': '数学教育',
      '年级': '大三',
      '班级': '数学1班',
      '入学年份': '2021',
      '支教科目': '数学'
    }
  ]

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(templateData)
  XLSX.utils.book_append_sheet(wb, ws, '学生模板')
  
  // 下载文件
  XLSX.writeFile(wb, '学生导入模板.xlsx')
  message.success('模板下载成功')
}

// 关闭模态框并重置所有状态的通用函数
const closeModalAndReset = () => {
  console.log('关闭模态框并重置状态')
  
  // 先关闭模态框
  showAddModal.value = false
  
  // 然后重置状态
  setTimeout(() => {
    resetForm()
    console.log('状态重置完成')
  }, 100)
}

// 处理模态框取消按钮
const handleModalCancel = () => {
  message.info('已取消操作')
  closeModalAndReset()
}

// 重置表单
const resetForm = () => {
  addForm.name = ''
  addForm.studentId = ''
  addForm.gender = 'male'
  addForm.birthDate = ''
  addForm.phone = ''
  addForm.email = ''
  addForm.major = ''
  addForm.grade = '大三'
  addForm.className = ''
  addForm.admissionYear = new Date().getFullYear()
  addForm.teachingSubject = ''
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

/* 导入功能样式 */
.import-container {
  padding: 16px 0;
}

.upload-section {
  margin-bottom: 24px;
}

.import-result {
  margin-top: 24px;
}

.error-list {
  margin-top: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.error-list h5 {
  margin-bottom: 8px;
  color: #ff4d4f;
}

.template-section {
  margin-top: 16px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .student-management {
    padding: 16px;
  }
  
  .stats-cards .ant-col {
    margin-bottom: 16px;
  }
  
  .import-container {
    padding: 8px 0;
  }
}
</style>