<template>
  <div class="admin-management">
    <div class="page-header">
      <h1>管理员管理</h1>
      <p>管理系统管理员账户，包括添加、编辑、停用和删除操作</p>
    </div>

    <!-- 搜索和筛选区域 -->
    <a-card class="search-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="姓名">
          <a-input
            v-model:value="searchForm.name"
            placeholder="请输入姓名"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input
            v-model:value="searchForm.phone"
            placeholder="请输入手机号"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="角色">
          <a-select
            v-model:value="searchForm.role"
            placeholder="请选择角色"
            style="width: 200px"
            allow-clear
          >
            <a-select-option value="university">大学管理员</a-select-option>
            <a-select-option value="government">政府管理员</a-select-option>
            <a-select-option value="school">学校管理员</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="searchForm.status"
            placeholder="请选择状态"
            style="width: 200px"
            allow-clear
          >
            <a-select-option value="active">活跃</a-select-option>
            <a-select-option value="inactive">停用</a-select-option>
            <a-select-option value="pending">待审核</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">
              <search-outlined />
              搜索
            </a-button>
            <a-button @click="handleReset">
              <redo-outlined />
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 操作按钮区域 -->
    <div class="action-bar">
      <a-button type="primary" @click="showAddModal">
        <user-add-outlined />
        添加管理员
      </a-button>
      <a-button @click="exportData" :loading="exportLoading">
        <export-outlined />
        导出数据
      </a-button>
    </div>

    <!-- 管理员列表 -->
    <a-card class="table-card">
      <a-table
        :data-source="adminList"
        :loading="loading"
        :pagination="pagination"
        :row-key="record => record.id"
        @change="handleTableChange"
      >
        <a-table-column key="name" title="姓名" data-index="name" />
        <a-table-column key="phone" title="手机号" data-index="phone_number" />
        <a-table-column key="organization" title="所属机构" data-index="organization" />
        <a-table-column key="role" title="角色" data-index="role">
          <template #default="{ text: role }">
            <a-tag :color="getRoleColor(role)">
              {{ formatRole(role) }}
            </a-tag>
          </template>
        </a-table-column>
        <a-table-column key="status" title="状态" data-index="status">
          <template #default="{ text: status }">
            <a-badge
              :status="getStatusType(status)"
              :text="formatStatus(status)"
            />
          </template>
        </a-table-column>
        <a-table-column key="created_at" title="创建时间" data-index="created_at">
          <template #default="{ text: date }">
            {{ formatDate(date) }}
          </template>
        </a-table-column>
        <a-table-column key="actions" title="操作" width="200">
          <template #default="{ record }">
            <a-space>
              <a-button size="small" @click="showEditModal(record)">
                <edit-outlined />
                编辑
              </a-button>
              <a-button
                size="small"
                :type="record.status === 'active' ? 'danger' : 'primary'"
                @click="toggleStatus(record)"
              >
                {{ record.status === 'active' ? '停用' : '启用' }}
              </a-button>
              <a-popconfirm
                title="确定要删除这个管理员吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <a-button size="small" danger>
                  <delete-outlined />
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <!-- 添加/编辑管理员模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      width="600px"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        ref="formRef"
        :model="formState"
        :rules="formRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="姓名" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入姓名" />
        </a-form-item>
        <a-form-item label="手机号" name="phone_number">
          <a-input v-model:value="formState.phone_number" placeholder="请输入手机号" />
        </a-form-item>
        <a-form-item label="所属机构" name="organization">
          <a-input v-model:value="formState.organization" placeholder="请输入所属机构" />
        </a-form-item>
        <a-form-item label="角色" name="role">
          <a-select v-model:value="formState.role" placeholder="请选择角色">
            <a-select-option value="university">大学管理员</a-select-option>
            <a-select-option value="government">政府管理员</a-select-option>
            <a-select-option value="school">学校管理员</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="初始密码" name="password" v-if="isAddMode">
          <a-input-password
            v-model:value="formState.password"
            placeholder="请输入初始密码"
          />
        </a-form-item>
        <a-form-item label="状态" name="status" v-if="!isAddMode">
          <a-select v-model:value="formState.status" placeholder="请选择状态">
            <a-select-option value="active">活跃</a-select-option>
            <a-select-option value="inactive">停用</a-select-option>
            <a-select-option value="pending">待审核</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { supabase } from '../../lib/supabaseClient.js'
import {
  SearchOutlined,
  RedoOutlined,
  UserAddOutlined,
  ExportOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

const loading = ref(false)
const exportLoading = ref(false)
const modalVisible = ref(false)
const modalLoading = ref(false)
const formRef = ref(null)

// 搜索表单
const searchForm = reactive({
  name: '',
  phone: '',
  role: undefined,
  status: undefined
})

// 表单状态
const formState = reactive({
  id: '',
  name: '',
  phone_number: '',
  organization: '',
  role: undefined,
  status: 'active',
  password: ''
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone_number: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  organization: [{ required: true, message: '请输入所属机构', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请输入初始密码', trigger: 'blur' }]
}

// 管理员列表
const adminList = ref([])

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: total => `共 ${total} 条记录`
})

// 计算属性
const isAddMode = computed(() => !formState.id)
const modalTitle = computed(() => isAddMode.value ? '添加管理员' : '编辑管理员')

// 获取管理员列表
const fetchAdminList = async () => {
  try {
    loading.value = true
    
    // 构建筛选条件
    let userQuery = supabase
      .from('user_profiles')
      .select('id')
    
    // 添加用户档案筛选条件
    if (searchForm.name) {
      userQuery = userQuery.ilike('name', `%${searchForm.name}%`)
    }
    if (searchForm.phone) {
      userQuery = userQuery.ilike('phone_number', `%${searchForm.phone}%`)
    }
    if (searchForm.role) {
      userQuery = userQuery.eq('role', searchForm.role)
    }
    
    // 执行用户档案查询
    const { data: userData } = await userQuery
    
    // 构建管理员查询
    let adminQuery = supabase
      .from('admin_management')
      .select(`
        *,
        user_profiles!admin_id (
          id,
          name,
          phone_number,
          organization,
          role,
          created_at
        )
      `)
    
    // 如果有用户筛选条件，添加管理员ID筛选
    if (userData && userData.length > 0) {
      const userIds = userData.map(user => user.id)
      adminQuery = adminQuery.in('admin_id', userIds)
    }
    
    // 添加状态筛选条件
    if (searchForm.status) {
      adminQuery = adminQuery.eq('status', searchForm.status)
    }
    
    // 执行管理员查询
    const { data, error, count } = await adminQuery
      .order('created_at', { ascending: false })
      .range(
        (pagination.current - 1) * pagination.pageSize,
        pagination.current * pagination.pageSize - 1
      )
    
    if (error) {
      console.error('Supabase查询错误:', error)
      throw error
    }
    
    // 处理查询结果
    if (data && data.length > 0) {
      adminList.value = data.map(item => ({
        ...item.user_profiles,
        status: item.status,
        id: item.admin_id,
        created_at: item.created_at // 使用 admin_management 的创建时间
      }))
      pagination.total = count || data.length
    } else {
      adminList.value = []
      pagination.total = 0
    }
    
    console.log('获取管理员列表成功:', adminList.value)
    
  } catch (error) {
    console.error('获取管理员列表失败:', error)
    message.error('获取数据失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.current = 1
  fetchAdminList()
}

// 重置搜索
const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  pagination.current = 1
  fetchAdminList()
}

// 表格变化处理
const handleTableChange = (pag, filters, sorter) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchAdminList()
}

// 显示添加模态框
const showAddModal = () => {
  resetForm()
  modalVisible.value = true
}

// 显示编辑模态框
const showEditModal = (record) => {
  resetForm()
  Object.assign(formState, {
    id: record.id,
    name: record.name,
    phone_number: record.phone_number,
    organization: record.organization,
    role: record.role,
    status: record.status
  })
  modalVisible.value = true
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(formState, {
    id: '',
    name: '',
    phone_number: '',
    organization: '',
    role: undefined,
    status: 'active',
    password: ''
  })
}

// 模态框确认
const handleModalOk = async () => {
  try {
    await formRef.value.validate()
    modalLoading.value = true
    
    if (isAddMode.value) {
      // 添加管理员
      await addAdmin()
    } else {
      // 编辑管理员
      await updateAdmin()
    }
    
    modalVisible.value = false
    fetchAdminList()
    message.success(isAddMode.value ? '添加成功' : '更新成功')
    
  } catch (error) {
    console.error('操作失败:', error)
    message.error(isAddMode.value ? '添加失败' : '更新失败')
  } finally {
    modalLoading.value = false
  }
}

// 添加管理员
const addAdmin = async () => {
  // 检查手机号是否已存在
  const { data: existingUsers } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('phone_number', formState.phone_number)
  
  if (existingUsers && existingUsers.length > 0) {
    throw new Error('该手机号已存在')
  }
  
  try {
    // 创建用户档案（让数据库自动生成ID）
    const userData = {
      phone_number: formState.phone_number,
      name: formState.name,
      organization: formState.organization,
      role: formState.role
    }
    
    // 尝试添加密码字段（如果数据库有该字段）
    // 使用RPC函数来设置密码，避免直接插入可能不存在的字段
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert(userData)
      .select()
      .single()
    
    // 如果用户创建成功，尝试设置密码
    if (profileData && !profileError) {
      try {
        // 使用RPC函数设置密码
        const { error: passwordError } = await supabase
          .rpc('set_user_password', {
            phone: formState.phone_number,
            new_password: formState.password
          })
        
        if (passwordError) {
          console.warn('设置密码失败，但用户已创建成功:', passwordError.message)
          // 继续执行，用户可以使用默认密码登录
        }
      } catch (error) {
        console.warn('密码设置函数可能不存在:', error)
      }
    }
    
    if (profileError) {
      console.error('创建用户档案失败:', profileError)
      throw new Error(`创建用户档案失败: ${profileError.message}`)
    }
    
    // 获取超级管理员ID（使用演示数据中的超级管理员ID）
    const { data: superAdmin } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone_number', '13800138000')
      .single()
    
    if (!superAdmin) {
      throw new Error('找不到超级管理员信息')
    }
    
    // 添加到管理员管理表
    const { error: managementError } = await supabase
      .from('admin_management')
      .insert({
        admin_id: profileData.id,
        managed_by: superAdmin.id,
        role: formState.role,
        status: 'active',
        created_by: superAdmin.id
      })
    
    if (managementError) {
      console.error('添加到管理员管理表失败:', managementError)
      throw new Error(`添加到管理员管理表失败: ${managementError.message}`)
    }
    
  } catch (error) {
    console.error('添加管理员过程中出错:', error)
    throw error
  }
}

// 更新管理员
const updateAdmin = async () => {
  // 更新用户档案
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      name: formState.name,
      phone_number: formState.phone_number,
      organization: formState.organization,
      role: formState.role
    })
    .eq('id', formState.id)
  
  if (profileError) throw profileError
  
  // 更新管理员管理表
  const { error: managementError } = await supabase
    .from('admin_management')
    .update({
      role: formState.role,
      status: formState.status
    })
    .eq('admin_id', formState.id)
  
  if (managementError) throw managementError
}

// 切换状态
const toggleStatus = async (record) => {
  try {
    const newStatus = record.status === 'active' ? 'inactive' : 'active'
    
    // 使用Supabase更新状态
    const { error } = await supabase
      .from('admin_management')
      .update({ status: newStatus })
      .eq('admin_id', record.id)
    
    if (error) throw error
    
    message.success(newStatus === 'active' ? '已启用' : '已停用')
    fetchAdminList()
    
  } catch (error) {
    console.error('切换状态失败:', error)
    message.error('操作失败')
  }
}

// 删除管理员
const handleDelete = async (record) => {
  try {
    // 这里需要谨慎处理，可能需要级联删除
    Modal.confirm({
      title: '确认删除',
      content: '此操作将永久删除该管理员账户，是否继续？',
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        // 从管理员管理表中删除
        const { error: managementError } = await supabase
          .from('admin_management')
          .delete()
          .eq('admin_id', record.id)
        
        if (managementError) throw managementError
        
        message.success('删除成功')
        fetchAdminList()
      }
    })
    
  } catch (error) {
    console.error('删除失败:', error)
    message.error('删除失败')
  }
}

// 导出数据
const exportData = async () => {
  try {
    exportLoading.value = true
    
    // 构建筛选条件
    let userQuery = supabase
      .from('user_profiles')
      .select('id')
    
    // 添加用户档案筛选条件
    if (searchForm.name) {
      userQuery = userQuery.ilike('name', `%${searchForm.name}%`)
    }
    if (searchForm.phone) {
      userQuery = userQuery.ilike('phone_number', `%${searchForm.phone}%`)
    }
    if (searchForm.role) {
      userQuery = userQuery.eq('role', searchForm.role)
    }
    
    // 执行用户档案查询
    const { data: userData } = await userQuery
    
    // 构建管理员查询
    let adminQuery = supabase
      .from('admin_management')
      .select(`
        *,
        user_profiles!admin_id (
          name,
          phone_number,
          organization,
          role,
          created_at
        )
      `)
    
    // 如果有用户筛选条件，添加管理员ID筛选
    if (userData && userData.length > 0) {
      const userIds = userData.map(user => user.id)
      adminQuery = adminQuery.in('admin_id', userIds)
    }
    
    // 添加状态筛选条件
    if (searchForm.status) {
      adminQuery = adminQuery.eq('status', searchForm.status)
    }
    
    // 执行管理员查询
    const { data, error } = await adminQuery
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // 转换为 CSV 格式
    const headers = ['姓名', '手机号', '所属机构', '角色', '状态', '创建时间']
    const csvData = data.map(item => [
      item.user_profiles.name,
      item.user_profiles.phone_number,
      item.user_profiles.organization,
      formatRole(item.user_profiles.role),
      formatStatus(item.status),
      formatDate(item.created_at) // 使用 admin_management 的创建时间
    ])
    
    // 创建 CSV 内容
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')
    
    // 创建下载链接
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `管理员列表_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    message.success('导出成功')
    
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

// 工具函数
const formatRole = (role) => {
  const roleMap = {
    'university': '大学管理员',
    'government': '政府管理员',
    'school': '学校管理员'
  }
  return roleMap[role] || role
}

const getRoleColor = (role) => {
  const colorMap = {
    'university': 'blue',
    'government': 'green',
    'school': 'orange'
  }
  return colorMap[role] || 'default'
}

const formatStatus = (status) => {
  const statusMap = {
    'active': '活跃',
    'inactive': '停用',
    'pending': '待审核'
  }
  return statusMap[status] || status
}

const getStatusType = (status) => {
  const typeMap = {
    'active': 'success',
    'inactive': 'error',
    'pending': 'warning'
  }
  return typeMap[status] || 'default'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 模态框取消
const handleModalCancel = () => {
  modalVisible.value = false
}

onMounted(() => {
  fetchAdminList()
})
</script>

<style scoped>
.admin-management {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #262626;
}

.page-header p {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
}

.search-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.action-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
}

.table-card {
  border-radius: 8px;
}

:deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
}
</style>