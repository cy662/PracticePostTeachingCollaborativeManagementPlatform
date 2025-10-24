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
          <template v-else-if="column.key === 'created_at'">
            {{ formatDateTimeToCST(record.created_at) }}
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

    <!-- 添加/编辑学生模态框 -->
    <a-modal
      v-model:open="showAddModal"
      :title="isEditing ? '编辑学生' : '添加学生'"
      width="600px"
      @ok="handleModalOk"
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
import { UploadOutlined, PlusOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { supabase } from '../../lib/supabaseClient.js'
import * as XLSX from 'xlsx'

const showAddModal = ref(false)
const showImportModal = ref(false)
const addLoading = ref(false)
const importLoading = ref(false)
const loading = ref(false)
const currentUser = ref(null)
const isEditing = ref(false)
const editingStudentId = ref(null)

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

    // 处理日期格式
    let birthDateValue = null
    if (addForm.birthDate) {
      // 确保日期格式正确
      const date = new Date(addForm.birthDate)
      if (!isNaN(date.getTime())) {
        birthDateValue = date.toISOString().split('T')[0] // 格式化为 YYYY-MM-DD
      }
    }

    // 添加学生到数据库
    const { data, error } = await supabase
      .from('students')
      .insert([{
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
        created_by: currentUser.value.id
      }])
      .select()

    if (error) throw error

    // 刷新数据
    await loadStudents()
    
    message.success('学生添加成功')
    showAddModal.value = false
    resetForm()
  } catch (error) {
    console.error('添加学生失败:', error)
    message.error('添加失败，请重试')
  } finally {
    addLoading.value = false
  }
}

const handleEdit = async () => {
  addLoading.value = true
  try {
    if (!await getCurrentUser()) return

    // 验证必填字段
    if (!addForm.name || !addForm.studentId || !addForm.major) {
      message.error('请填写必填字段')
      return
    }

    // 检查学号是否与其他学生重复（排除当前编辑的学生）
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('student_id', addForm.studentId)
      .neq('id', editingStudentId.value)
      .single()

    if (existingStudent) {
      message.error('该学号已存在')
      return
    }

    // 处理日期格式
    let birthDateValue = null
    if (addForm.birthDate) {
      // 确保日期格式正确
      const date = new Date(addForm.birthDate)
      if (!isNaN(date.getTime())) {
        birthDateValue = date.toISOString().split('T')[0] // 格式化为 YYYY-MM-DD
      }
    }

    // 更新学生信息
    const { error } = await supabase
      .from('students')
      .update({
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
        updated_at: new Date().toISOString()
      })
      .eq('id', editingStudentId.value)

    if (error) throw error

    // 刷新数据
    await loadStudents()
    
    message.success('学生信息更新成功')
    showAddModal.value = false
    resetForm()
    
    // 重置编辑状态
    isEditing.value = false
    editingStudentId.value = null
  } catch (error) {
    console.error('编辑学生失败:', error)
    message.error('编辑失败，请重试')
  } finally {
    addLoading.value = false
  }
}

const refreshData = async () => {
  await loadStudents()
  message.success('数据已刷新')
}

const handleEditClick = (record) => {
  console.log('编辑按钮被点击，学生信息:', record)
  
  // 检查记录是否有效
  if (!record || !record.id) {
    console.error('无效的学生记录:', record)
    message.error('无法编辑该学生，记录无效')
    return
  }
  
  // 调用编辑函数
  editStudent(record)
}

const editStudent = (record) => {
  console.log('编辑按钮被点击，学生信息:', record)
  
  try {
    // 直接设置编辑模式
    isEditing.value = true
    editingStudentId.value = record.id
    
    // 填充表单数据 - 确保字段映射正确
    addForm.name = record.name || ''
    addForm.studentId = record.student_id || ''
    addForm.gender = record.gender || 'male'
    
    // 处理日期格式
    if (record.birth_date) {
      // 将数据库日期转换为前端可用的格式
      const birthDate = new Date(record.birth_date)
      if (!isNaN(birthDate.getTime())) {
        addForm.birthDate = birthDate
      } else {
        addForm.birthDate = ''
      }
    } else {
      addForm.birthDate = ''
    }
    
    addForm.phone = record.phone || ''
    addForm.email = record.email || ''
    addForm.major = record.major || ''
    addForm.grade = record.grade || '大三'
    addForm.className = record.class_name || ''
    addForm.admissionYear = record.admission_year || new Date().getFullYear()
    addForm.teachingSubject = record.teaching_subject || ''
    
    // 打开模态框
    showAddModal.value = true
    
    console.log('模态框状态设置为true，准备打开编辑框')
    message.info(`正在编辑学生: ${record.name}`)
  } catch (error) {
    console.error('编辑按钮点击出错:', error)
    message.error('编辑功能出现错误，请刷新页面重试')
  }
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
    if (row.学号 && !/^\d{8,12}$/.test(row.学号)) {
      errors.push('学号格式不正确，应为8-12位数字')
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

// 重置表单
const handleModalOk = () => {
  if (isEditing.value) {
    handleEdit()
  } else {
    handleAdd()
  }
}

const handleModalCancel = () => {
  // 重置表单和编辑状态
  resetForm()
  isEditing.value = false
  editingStudentId.value = null
}

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