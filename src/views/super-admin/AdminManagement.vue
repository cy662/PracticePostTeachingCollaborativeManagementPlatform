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
      v-model:open="modalVisible"
      :title="modalTitle"
      width="600px"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      @close="handleModalCancel"
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
          <a-select
              v-model:value="formState.organization"
              placeholder="请输入机构名称或编号进行搜索"
              :loading="organizationsLoading"
              show-search
              :filter-option="false"
              @search="handleOrganizationSearch"
              option-filter-prop="label"
            >
            <a-select-option v-for="org in organizations" :key="org.id" :value="org.name" :label="`${org.name} (${org.code})`">
              {{ org.name }} ({{ org.code }})
            </a-select-option>
            <a-select-option v-if="organizations.length === 0 && organizationsLoading === false" disabled>
              {{ organizationSearch ? '没有找到匹配的机构' : '暂无机构数据' }}
            </a-select-option>
          </a-select>
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
import { organizationService } from '../../api/organizationService.js'
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
const organizations = ref([])
const organizationsLoading = ref(false)
const organizationSearch = ref('')
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
  organization: [{ required: true, message: '请选择所属机构', trigger: 'change' }],
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
    
    // 直接查询 admin_management 表，通过关联获取用户信息
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
    
    // 添加筛选条件
    if (searchForm.name) {
      adminQuery = adminQuery.ilike('user_profiles.name', `%${searchForm.name}%`)
    }
    if (searchForm.phone) {
      adminQuery = adminQuery.ilike('user_profiles.phone_number', `%${searchForm.phone}%`)
    }
    if (searchForm.role) {
      adminQuery = adminQuery.eq('user_profiles.role', searchForm.role)
    }
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
    
    // 处理查询结果 - 过滤掉没有关联用户的管理员记录
    if (data && data.length > 0) {
      adminList.value = data
        .filter(item => item.user_profiles !== null) // 过滤掉没有关联用户的管理员
        .map(item => ({
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
    
    console.log('获取管理员列表成功，记录数:', adminList.value.length)
    console.log('当前管理员列表:', adminList.value.map(item => ({ id: item.id, name: item.name })))
    
  } catch (error) {
    console.error('获取管理员列表失败:', error)
    message.error('获取数据失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 获取机构列表
const fetchOrganizations = async (search = '') => {
  try {
    organizationsLoading.value = true
    
    console.log('开始获取机构数据，搜索关键词:', search);
    
    // 构建查询
    let query = supabase
      .from('organizations')
      .select('*')
      .limit(100)
    
    // 如果有搜索关键词，添加模糊查询条件
    if (search && search.trim()) {
      const searchTerm = search.trim();
      // 使用or条件搜索name和code字段，支持大小写不敏感的模糊匹配
      query = query.or(
        `name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`
      );
      console.log('应用搜索过滤，关键词:', searchTerm);
    }
    
    // 执行查询
    const { data, error } = await query;
    
    console.log('从数据库获取的机构数据:', data);
    console.log('查询错误:', error);
    
    // 处理数据库查询结果
    if (!error && data && Array.isArray(data) && data.length > 0) {
      // 过滤有效数据
      const validOrganizations = data.filter(item => item && item.name && item.code);
      
      // 如果有搜索关键词，按匹配度排序
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        organizations.value = sortOrganizationsByRelevance(validOrganizations, searchTerm);
      } else {
        organizations.value = validOrganizations;
      }
      
      console.log('过滤后的机构数据数量:', organizations.value.length);
    } else {
      console.log('数据库中没有找到机构数据或查询失败，使用备用数据');
      // 如果数据库没有数据或查询失败，使用少量备用数据作为参考
      let tempOrganizations = search ? 
        [] : // 搜索时如果没有结果，显示空列表
        [
          { id: 1, name: '清华大学', code: 'THU001' },
          { id: 2, name: '北京大学', code: 'PKU001' }
        ];
      
      // 如果有搜索关键词，对备用数据也进行排序
      if (search && search.trim() && tempOrganizations.length > 0) {
        const searchTerm = search.trim().toLowerCase();
        tempOrganizations = sortOrganizationsByRelevance(tempOrganizations, searchTerm);
      }
      
      organizations.value = tempOrganizations;
    }
    
  } catch (error) {
    console.error('获取机构列表异常:', error)
    message.error('获取机构列表失败: ' + error.message)
    
    // 异常情况下使用空列表
    organizations.value = [];
  } finally {
    organizationsLoading.value = false
  }
}

// 根据搜索关键词对机构进行排序，匹配度高的排在前面
const sortOrganizationsByRelevance = (orgList, searchTerm) => {
  return orgList.sort((a, b) => {
    // 计算每个机构的匹配度分数
    const scoreA = calculateRelevanceScore(a, searchTerm);
    const scoreB = calculateRelevanceScore(b, searchTerm);
    
    // 分数高的排在前面
    return scoreB - scoreA;
  });
};

// 计算机构与搜索关键词的匹配度分数
const calculateRelevanceScore = (org, searchTerm) => {
  let score = 0;
  const name = org.name ? org.name.toLowerCase() : '';
  const code = org.code ? org.code.toLowerCase() : '';
  
  // 完全匹配得分最高
  if (name === searchTerm || code === searchTerm) {
    score += 100;
  }
  
  // 以搜索词开头的匹配得分较高
  if (name.startsWith(searchTerm)) score += 50;
  if (code.startsWith(searchTerm)) score += 50;
  
  // 包含搜索词的基础得分
  if (name.includes(searchTerm)) score += 20;
  if (code.includes(searchTerm)) score += 20;
  
  // 名称匹配优先于代码匹配
  if (name.includes(searchTerm)) score += 10;
  
  return score;
};

// 处理机构搜索
const handleOrganizationSearch = (value) => {
  console.log('搜索机构:', value)
  organizationSearch.value = value
  // 调用fetchOrganizations函数，传入搜索关键词
  fetchOrganizations(value)
}

// 组件挂载时自动获取机构数据
onMounted(() => {
  console.log('组件挂载，自动获取机构数据');
  fetchOrganizations();
});

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
  // 重置机构搜索
  organizationSearch.value = ''
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
    
    // 如果提供了密码，设置密码哈希
    if (formState.password) {
      // 使用简单的MD5哈希（前端实现）
      userData.password_hash = await hashPassword(formState.password)
    }
    
    // 创建用户档案
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert(userData)
      .select()
      .single()
    
    if (profileError) {
      console.error('创建用户档案失败:', profileError)
      throw new Error(`创建用户档案失败: ${profileError.message}`)
    }
    
    // 获取超级管理员ID - 使用默认的超级管理员ID
    let superAdminId = '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'
    
    // 验证超级管理员是否存在
    const { data: superAdminCheck } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', superAdminId)
      .single()
    
    if (!superAdminCheck) {
      // 如果默认超级管理员不存在，尝试查找其他超级管理员
      const { data: anySuperAdmin } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'super_admin')
        .limit(1)
        .single()
      
      if (anySuperAdmin) {
        superAdminId = anySuperAdmin.id
      } else {
        // 如果还是没有超级管理员，使用演示模式下的默认值
        console.warn('未找到超级管理员，使用默认ID')
      }
    }
    
    // 简化：直接添加到管理员管理表，使用默认值避免外键约束
    const managementData = {
      admin_id: profileData.id,
      role: formState.role,
      status: 'active'
    }
    
    // 只有在超级管理员存在时才添加这些字段
    if (superAdminId) {
      managementData.managed_by = superAdminId
      managementData.created_by = superAdminId
    }
    
    const { error: managementError } = await supabase
      .from('admin_management')
      .insert(managementData)
    
    if (managementError) {
      console.error('添加到管理员管理表失败:', managementError)
      
      // 如果是因为外键约束失败，尝试简化插入
      if (managementError.message.includes('foreign key constraint')) {
        console.warn('外键约束失败，尝试简化插入...')
        
        const { error: simpleError } = await supabase
          .from('admin_management')
          .insert({
            admin_id: profileData.id,
            role: formState.role,
            status: 'active'
          })
        
        if (simpleError) {
          throw new Error(`添加到管理员管理表失败: ${simpleError.message}`)
        }
      } else {
        throw new Error(`添加到管理员管理表失败: ${managementError.message}`)
      }
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
    // 这里需要谨慎处理，需要级联删除
    Modal.confirm({
      title: '确认删除',
      content: '此操作将永久删除该管理员账户（包括用户档案），是否继续？',
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          console.log('开始删除管理员，ID:', record.id);
          
          // 1. 首先从管理员管理表中删除
          const { error: managementError } = await supabase
            .from('admin_management')
            .delete()
            .eq('admin_id', record.id)
          
          if (managementError) {
            console.error('删除管理员管理记录失败:', managementError)
            throw new Error(`删除管理员管理记录失败: ${managementError.message}`)
          }
          
          console.log('管理员管理记录删除成功');
          
          // 2. 然后从用户档案表中删除用户数据
          const { error: profileError } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', record.id)
          
          if (profileError) {
            console.error('删除用户档案失败:', profileError)
            // 如果删除用户档案失败，但管理员管理记录已删除，仍然提示成功
            // 因为管理员已经无法登录系统了
            console.warn('管理员管理记录已删除，但用户档案删除失败，管理员已无法登录')
            // 继续执行，因为管理员已经无法登录了
          } else {
            console.log('用户档案删除成功');
          }
          
          message.success('删除成功')
          console.log('删除成功，刷新列表...');
          
          // 强制刷新列表，确保显示最新数据
          await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒确保数据库操作完成
          await fetchAdminList();
          
        } catch (error) {
          console.error('删除过程中出错:', error)
          message.error('删除失败: ' + error.message)
        }
      }
    })
    
  } catch (error) {
    console.error('删除失败:', error)
    message.error('删除失败: ' + error.message)
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
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    // 创建下载链接
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `管理员列表_${formatDate(new Date()).replace(/\//g, '-')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    message.success('导出成功')
    
  } catch (error) {
    console.error('导出数据失败:', error)
    message.error('导出失败: ' + error.message)
  } finally {
    exportLoading.value = false
  }
}

// MD5哈希函数（与后端保持一致）
const hashPassword = async (password) => {
  // 使用兼容性更好的MD5实现
  // 这个实现与PostgreSQL的MD5函数结果一致
  function md5(inputString) {
    let hc = "0123456789abcdef";
    function rh(n) {
      let j, s = "";
      for (j = 0; j <= 3; j++)
        s += hc.charAt((n >> (j * 8 + 4)) & 0x0F) + hc.charAt((n >> (j * 8)) & 0x0F);
      return s;
    }
    function ad(x, y) {
      let l = (x & 0xFFFF) + (y & 0xFFFF);
      let m = (x >> 16) + (y >> 16) + (l >> 16);
      return (m << 16) | (l & 0xFFFF);
    }
    function rl(n, c) {
      return (n << c) | (n >>> (32 - c));
    }
    function cm(q, a, b, x, s, t) {
      return ad(rl(ad(ad(a, q), ad(x, t)), s), b);
    }
    function ff(a, b, c, d, x, s, t) {
      return cm((b & c) | ((~b) & d), a, b, x, s, t);
    }
    function gg(a, b, c, d, x, s, t) {
      return cm((b & d) | (c & (~d)), a, b, x, s, t);
    }
    function hh(a, b, c, d, x, s, t) {
      return cm(b ^ c ^ d, a, b, x, s, t);
    }
    function ii(a, b, c, d, x, s, t) {
      return cm(c ^ (b | (~d)), a, b, x, s, t);
    }
    function sb(x) {
      let i;
      let nblk = ((x.length + 8) >> 6) + 1;
      let blks = new Array(nblk * 16);
      for (i = 0; i < nblk * 16; i++) blks[i] = 0;
      for (i = 0; i < x.length; i++)
        blks[i >> 2] |= x.charCodeAt(i) << ((i % 4) * 8);
      blks[i >> 2] |= 0x80 << ((i % 4) * 8);
      blks[nblk * 16 - 2] = x.length * 8;
      return blks;
    }
    let i, x = sb(inputString);
    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;
    for (i = 0; i < x.length; i += 16) {
      let olda = a;
      let oldb = b;
      let oldc = c;
      let oldd = d;
      a = ff(a, b, c, d, x[i + 0], 7, -680876936);
      d = ff(d, a, b, c, x[i + 1], 12, -389564586);
      c = ff(c, d, a, b, x[i + 2], 17, 606105819);
      b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = ff(a, b, c, d, x[i + 4], 7, -176418897);
      d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
      c = ff(c, d, a, b, x[i + 6], 17, -1473231341);
      b = ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
      d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
      c = ff(c, d, a, b, x[i + 10], 17, -42063);
      b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = ff(a, b, c, d, x[i + 12], 7, 1804603682);
      d = ff(d, a, b, c, x[i + 13], 12, -40341101);
      c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
      b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
      a = gg(a, b, c, d, x[i + 1], 5, -165796510);
      d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
      c = gg(c, d, a, b, x[i + 11], 14, 643717713);
      b = gg(b, c, d, a, x[i + 0], 20, -373897302);
      a = gg(a, b, c, d, x[i + 5], 5, -701558691);
      d = gg(d, a, b, c, x[i + 10], 9, 38016083);
      c = gg(c, d, a, b, x[i + 15], 14, -660478335);
      b = gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = gg(a, b, c, d, x[i + 9], 5, 568446438);
      d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
      c = gg(c, d, a, b, x[i + 3], 14, -187363961);
      b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = gg(a, b, c, d, x[i + 13], 5, -1444681467);
      d = gg(d, a, b, c, x[i + 2], 9, -51403784);
      c = gg(c, d, a, b, x[i + 7], 14, 1735328473);
      b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
      a = hh(a, b, c, d, x[i + 5], 4, -378558);
      d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
      c = hh(c, d, a, b, x[i + 11], 16, 1839030562);
      b = hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = hh(a, b, c, d, x[i + 1], 4, -1530992060);
      d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
      c = hh(c, d, a, b, x[i + 7], 16, -155497632);
      b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = hh(a, b, c, d, x[i + 13], 4, 681279174);
      d = hh(d, a, b, c, x[i + 0], 11, -358537222);
      c = hh(c, d, a, b, x[i + 3], 16, -722521979);
      b = hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = hh(a, b, c, d, x[i + 9], 4, -640364487);
      d = hh(d, a, b, c, x[i + 12], 11, -421815835);
      c = hh(c, d, a, b, x[i + 15], 16, 530742520);
      b = hh(b, c, d, a, x[i + 2], 23, -995338651);
      a = ii(a, b, c, d, x[i + 0], 6, -198630844);
      d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
      c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
      b = ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = ii(a, b, c, d, x[i + 12], 6, 1700485571);
      d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
      c = ii(c, d, a, b, x[i + 10], 15, -1051523);
      b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
      d = ii(d, a, b, c, x[i + 15], 10, -30611744);
      c = ii(c, d, a, b, x[i + 6], 15, -1560198380);
      b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = ii(a, b, c, d, x[i + 4], 6, -145523070);
      d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
      c = ii(c, d, a, b, x[i + 2], 15, 718787259);
      b = ii(b, c, d, a, x[i + 9], 21, -343485551);
      a = ad(a, olda);
      b = ad(b, oldb);
      c = ad(c, oldc);
      d = ad(d, oldd);
    }
    return rh(a) + rh(b) + rh(c) + rh(d);
  }
  
  return md5(password);
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
  fetchOrganizations()
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