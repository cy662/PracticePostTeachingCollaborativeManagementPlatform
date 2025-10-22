<template>
  <div class="demand-application">
    <!-- 面包屑导航 -->
    <div class="breadcrumb">
      <a-breadcrumb>
        <a-breadcrumb-item>中小学校</a-breadcrumb-item>
        <a-breadcrumb-item>需求申报</a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- 页面标题 -->
    <div class="page-header">
      <h1>需求申报</h1>
      <p class="page-subtitle">提交师资需求申请，获取优质支教教师支持</p>
    </div>

    <!-- 数据概览卡片 -->
    <a-row :gutter="16" class="stats-cards">
      <a-col :span="6">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.total }}</div>
          <div class="label">总申报数</div>
        </div>
      </a-col>
      <a-col :span="6">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.draft }}</div>
          <div class="label">草稿</div>
        </div>
      </a-col>
      <a-col :span="6">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.submitted }}</div>
          <div class="label">已提交</div>
        </div>
      </a-col>
      <a-col :span="6">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.approved }}</div>
          <div class="label">已通过</div>
        </div>
      </a-col>
    </a-row>

    <!-- 操作栏 -->
    <div class="action-bar">
      <a-space>
        <a-button type="primary" @click="showAddModal = true">
          <template #icon><PlusOutlined /></template>
          新增需求
        </a-button>
        <a-button @click="refreshData">
          <template #icon><ReloadOutlined /></template>
          刷新数据
        </a-button>
      </a-space>
    </div>

    <!-- 需求列表 -->
    <a-card class="content-card">
      <a-tabs v-model:activeKey="activeTab" type="card">
        <a-tab-pane key="draft" tab="草稿">
          <div class="tab-content">
            <a-table
              :columns="columns"
              :data-source="draftDemands"
              :pagination="pagination"
              row-key="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a-button type="link" size="small" @click="editDemand(record)">
                      编辑
                    </a-button>
                    <a-button type="link" size="small" @click="submitDemand(record)">
                      提交
                    </a-button>
                    <a-popconfirm 
                      title="确定删除这个需求吗？" 
                      @confirm="deleteDemand(record.id)"
                      ok-text="确定"
                      cancel-text="取消"
                    >
                      <a-button type="link" size="small" style="color: var(--error-color)">
                        删除
                      </a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
                <template v-else-if="column.key === 'urgency'">
                  <span :class="['status-tag', `status-${record.urgency}`]">
                    {{ getUrgencyText(record.urgency) }}
                  </span>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>
        
        <a-tab-pane key="submitted" tab="已提交">
          <div class="tab-content">
            <a-table
              :columns="columns"
              :data-source="submittedDemands"
              :pagination="pagination"
              row-key="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a-button type="link" size="small" @click="viewDetails(record)">
                      查看
                    </a-button>
                    <a-button 
                      type="link" 
                      size="small" 
                      @click="withdrawDemand(record)"
                      :disabled="record.status !== 'pending'"
                      style="color: var(--warning-color)"
                    >
                      撤回
                    </a-button>
                  </a-space>
                </template>
                <template v-else-if="column.key === 'status'">
                  <span :class="['status-tag', `status-${record.status}`]">
                    {{ getStatusText(record.status) }}
                  </span>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 新增需求模态框 -->
    <a-modal
      v-model:open="showAddModal"
      :title="isEditMode ? '编辑师资需求' : '新增师资需求'"
      width="600px"
      @ok="handleAdd"
      :confirm-loading="addLoading"
      @cancel="resetForm"
    >
      <a-form :model="addForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="学科" required>
              <a-select v-model:value="addForm.subject" placeholder="请选择学科">
                <a-select-option value="语文">语文</a-select-option>
                <a-select-option value="数学">数学</a-select-option>
                <a-select-option value="英语">英语</a-select-option>
                <a-select-option value="物理">物理</a-select-option>
                <a-select-option value="化学">化学</a-select-option>
                <a-select-option value="生物">生物</a-select-option>
                <a-select-option value="历史">历史</a-select-option>
                <a-select-option value="地理">地理</a-select-option>
                <a-select-option value="政治">政治</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="年级" required>
              <a-select v-model:value="addForm.grade" placeholder="请选择年级">
                <a-select-option value="小学一年级">小学一年级</a-select-option>
                <a-select-option value="小学二年级">小学二年级</a-select-option>
                <a-select-option value="小学三年级">小学三年级</a-select-option>
                <a-select-option value="小学四年级">小学四年级</a-select-option>
                <a-select-option value="小学五年级">小学五年级</a-select-option>
                <a-select-option value="小学六年级">小学六年级</a-select-option>
                <a-select-option value="初中一年级">初中一年级</a-select-option>
                <a-select-option value="初中二年级">初中二年级</a-select-option>
                <a-select-option value="初中三年级">初中三年级</a-select-option>
                <a-select-option value="高中一年级">高中一年级</a-select-option>
                <a-select-option value="高中二年级">高中二年级</a-select-option>
                <a-select-option value="高中三年级">高中三年级</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="需求人数" required>
          <a-input-number 
            v-model:value="addForm.demand" 
            :min="1" 
            :max="10"
            style="width: 100%"
            placeholder="请输入需求人数"
          />
        </a-form-item>
        
        <a-form-item label="支教时间" required>
          <a-input v-model:value="addForm.duration" placeholder="例如：2023-2024学年第一学期" />
        </a-form-item>
        
        <a-form-item label="紧急程度" required>
          <a-radio-group v-model:value="addForm.urgency">
            <a-radio value="high">
              <span class="urgency-option">
                <span class="urgency-dot high"></span>
                紧急
              </span>
            </a-radio>
            <a-radio value="medium">
              <span class="urgency-option">
                <span class="urgency-dot medium"></span>
                一般
              </span>
            </a-radio>
            <a-radio value="low">
              <span class="urgency-option">
                <span class="urgency-dot low"></span>
                不紧急
              </span>
            </a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="特殊要求" name="specialRequirements">
          <a-textarea
            v-model:value="addForm.specialRequirements"
            placeholder="请输入特殊要求（如：需要有班主任经验、擅长多媒体教学等）"
            :rows="3"
            show-count
            :maxlength="200"
          />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="closeModal">取消</a-button>
        <a-button type="primary" :loading="addLoading" @click="handleAdd">
          {{ isEditMode ? '保存修改' : '保存为草稿' }}
        </a-button>
      </template>
    </a-modal>
    
    <!-- 需求详情模态框 -->
    <a-modal
      v-model:open="showDetailModal"
      title="需求详情"
      width="600px"
      @cancel="closeDetailModal"
      footer="null"
    >
      <div class="detail-content" v-if="currentDetailDemand">
        <div class="detail-row">
          <div class="detail-label">学科：</div>
          <div class="detail-value">{{ currentDetailDemand.subject }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">年级：</div>
          <div class="detail-value">{{ currentDetailDemand.grade }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">需求人数：</div>
          <div class="detail-value">{{ currentDetailDemand.demand_count }}人</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">支教时间：</div>
          <div class="detail-value">{{ currentDetailDemand.duration }}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">紧急程度：</div>
          <div class="detail-value">
            <span :class="['status-tag', `status-${currentDetailDemand.urgency}`]">
              {{ getUrgencyText(currentDetailDemand.urgency) }}
            </span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">状态：</div>
          <div class="detail-value">
            <span :class="['status-tag', `status-${currentDetailDemand.status}`]">
              {{ getStatusText(currentDetailDemand.status) }}
            </span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">提交时间：</div>
          <div class="detail-value">{{ formatDateForDisplay(currentDetailDemand.submitted_at) }}</div>
        </div>
        <div class="detail-row" v-if="currentDetailDemand.special_requirements">
          <div class="detail-label">特殊要求：</div>
          <div class="detail-value">{{ currentDetailDemand.special_requirements }}</div>
        </div>
        <div class="detail-row" v-if="currentDetailDemand.rejected_reason">
          <div class="detail-label">驳回原因：</div>
          <div class="detail-value rejected-reason">{{ currentDetailDemand.rejected_reason }}</div>
        </div>
      </div>
      <template #footer>
        <a-button @click="closeDetailModal">关闭</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { supabase } from '../../lib/supabaseClient.js'

// 标签页状态
const activeTab = ref('draft')

// 新增需求模态框
const showAddModal = ref(false)
const showDetailModal = ref(false)
const addLoading = ref(false)
const loading = ref(false)
const isEditMode = ref(false)
const currentDemandId = ref(null)
const currentDetailDemand = ref(null)

// 新增需求表单
const addForm = reactive({
  subject: '',
  grade: '',
  demand: 1,
  duration: '',
  urgency: 'medium',
  specialRequirements: ''
})

// 数据存储
const draftDemands = ref([])
const submittedDemands = ref([])
const currentUser = ref(null)

// 获取当前用户信息
const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      currentUser.value = user
      return true
    }
    return false
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return false
  }
}

// 从数据库加载需求数据
const loadDemands = async () => {
    loading.value = true
    try {
      if (!await getCurrentUser()) return

      // 查询学校信息以获取school_id
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization')
        .eq('id', currentUser.value.id)
        .single()

      if (!profile) {
        message.error('未找到用户组织信息')
        return
      }

      // 查询草稿需求
      const { data: drafts, error: draftError } = await supabase
        .from('teaching_demands')
        .select('*')
        .eq('organization', profile.organization)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })

      if (draftError) throw draftError
      draftDemands.value = drafts.map(demand => ({
        ...demand,
        // 直接使用简化的日期格式化函数
        submitted_at_display: formatDateForDisplay()
      }))

      // 查询已提交需求，明确选择submitted_at字段
      const { data: submitted, error: submittedError } = await supabase
        .from('teaching_demands')
        .select('id, subject, grade, demand_count, duration, urgency, status, submitted_at, created_at')
        .eq('organization', profile.organization)
        .neq('status', 'draft')
        .order('submitted_at', { ascending: false })

      if (submittedError) throw submittedError
      
      // 验证并修复日期数据
      submittedDemands.value = submitted.map(demand => ({
        ...demand,
        // 直接使用简化的日期格式化函数
        submitted_at_display: formatDateForDisplay()
      }))
    
    console.log('最终处理后的已提交需求数据:', submittedDemands.value)
  } catch (error) {
    console.error('加载需求数据失败:', error)
    message.error('加载数据失败，请刷新页面重试')
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadDemands()
})

// 统计数据
const stats = computed(() => {
  const total = draftDemands.value.length + submittedDemands.value.length
  const draft = draftDemands.value.length
  const submitted = submittedDemands.value.length
  const approved = submittedDemands.value.filter(d => d.status === 'approved').length
  
  return { total, draft, submitted, approved }
})

const columns = [
  { 
    title: '学科', 
    dataIndex: 'subject', 
    key: 'subject',
    width: 80
  },
  { 
    title: '年级', 
    dataIndex: 'grade', 
    key: 'grade',
    width: 100
  },
  { 
    title: '需求人数', 
    dataIndex: 'demand_count', 
    key: 'demand',
    width: 100
  },
  { 
    title: '支教时间', 
    dataIndex: 'duration', 
    key: 'duration',
    width: 140
  },
  { 
    title: '紧急程度', 
    key: 'urgency',
    width: 100
  },
  { 
    title: '提交时间', 
    dataIndex: 'submitted_at_display', 
    key: 'submitTime',
    width: 120,
  },
  { 
    title: '状态', 
    key: 'status',
    width: 100
  },
  { 
    title: '操作', 
    key: 'action',
    width: 200
  }
]

const pagination = {
  current: 1,
  pageSize: 10,
  total: 4,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
}

const getStatusText = (status) => {
  const texts = {
    pending: '审核中',
    approved: '已通过',
    rejected: '已驳回'
  }
  return texts[status] || '未知'
}

const getUrgencyText = (urgency) => {
  const texts = {
    high: '紧急',
    medium: '一般',
    low: '不紧急'
  }
  return texts[urgency] || '未知'
}

// 日期格式化函数，支持显示指定日期或当前日期
const formatDateForDisplay = (dateString = null) => {
  const date = dateString ? new Date(dateString) : new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const resetForm = () => {
  Object.keys(addForm).forEach(key => {
    if (key !== 'urgency') {
      addForm[key] = key === 'demand' ? 1 : ''
    }
  })
  addForm.urgency = 'medium'
  currentDemandId.value = null
  isEditMode.value = false
}

const handleAdd = async () => {
  // 添加必填字段验证
  if (!addForm.subject || !addForm.grade || !addForm.demand || !addForm.duration) {
    message.error('请填写必填字段')
    return
  }
  
  addLoading.value = true
  try {
    // 确保获取到用户信息
    if (!await getCurrentUser()) {
      message.error('无法获取用户信息，请重新登录')
      return
    }

    // 查询学校信息
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('organization')
      .eq('id', currentUser.value.id)
      .single()

    if (profileError) {
      console.error('获取用户组织信息失败:', profileError)
      message.error('获取用户组织信息失败')
      return
    }

    if (!profile || !profile.organization) {
      message.error('未找到用户组织信息')
      return
    }

    // 准备更新数据
    const commonData = {
      subject: addForm.subject,
      grade: addForm.grade,
      demand_count: parseInt(addForm.demand) || 1,
      duration: addForm.duration,
      urgency: addForm.urgency || 'medium',
      special_requirements: addForm.specialRequirements || ''
    }

    if (isEditMode.value && currentDemandId.value) {
        console.log('编辑模式，更新需求ID:', currentDemandId.value)
        console.log('更新数据:', commonData)
        
        // 更新现有需求 - 注意表中没有updated_at字段，使用created_at更新
        const { data, error } = await supabase
          .from('teaching_demands')
          .update({
            ...commonData,
            created_at: new Date().toISOString() // 使用created_at字段代替不存在的updated_at
          })
          .eq('id', currentDemandId.value)
          .select()

      if (error) {
        console.error('更新需求失败:', error)
        message.error(`更新失败: ${error.message}`)
        return
      }
      
      console.log('更新成功，返回数据:', data)
      message.success('需求修改成功')
    } else {
      // 保存到数据库
      console.log('新增模式，保存数据:', commonData)
      
      const { data, error } = await supabase
        .from('teaching_demands')
        .insert({
          ...commonData,
          status: 'draft',
          organization: profile.organization,
          created_by: currentUser.value.id,
          created_at: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error('保存需求失败:', error)
        message.error(`保存失败: ${error.message}`)
        return
      }
      
      console.log('保存成功，返回数据:', data)
      message.success('需求已保存为草稿')
    }
  
    // 刷新数据
    await loadDemands()
  
    // 关闭模态框并重置表单
    showAddModal.value = false
    resetForm()
  } catch (error) {
    console.error('操作异常:', error)
    message.error('操作失败，请重试')
  } finally {
    addLoading.value = false
  }
}

const refreshData = async () => {
  await loadDemands()
  message.success('数据已刷新')
}

const editDemand = (record) => {
  console.log('编辑需求:', record)
  
  // 设置为编辑模式
  isEditMode.value = true
  currentDemandId.value = record.id
  
  // 填充表单数据
  addForm.subject = record.subject || ''
  addForm.grade = record.grade || ''
  addForm.demand = record.demand_count || 1
  addForm.duration = record.duration || ''
  addForm.urgency = record.urgency || 'medium'
  addForm.specialRequirements = record.special_requirements || ''
  
  // 打开模态框
  showAddModal.value = true
}

const submitDemand = async (record) => {
    try {
      const now = new Date().toISOString()
      console.log('提交需求，设置时间:', now)
      
      // 更新数据库中的状态
      const { data, error } = await supabase
        .from('teaching_demands')
        .update({
          status: 'pending',
          submitted_at: now
        })
        .eq('id', record.id)
        .select()

      if (error) {
        console.error('提交需求更新失败:', error)
        throw error
      }
      
      console.log('提交成功，返回数据:', data)

      // 刷新数据
      await loadDemands()
      message.success('需求提交成功')
    } catch (error) {
      console.error('提交需求失败:', error)
      message.error('提交失败，请重试')
    }
  }

const deleteDemand = async (id) => {
  try {
    const { error } = await supabase
      .from('teaching_demands')
      .delete()
      .eq('id', id)

    if (error) throw error

    // 刷新数据
    await loadDemands()
    message.success('删除成功')
  } catch (error) {
    console.error('删除需求失败:', error)
    message.error('删除失败，请重试')
  }
}

const withdrawDemand = async (record) => {
  try {
    // 显示确认对话框
    const confirmed = window.confirm(`确定要撤回「${record.subject} ${record.grade}」的需求吗？`)
    if (!confirmed) return
    
    // 更新数据库中的状态，将pending状态改为draft，并清除submitted_at
    const { data, error } = await supabase
      .from('teaching_demands')
      .update({
        status: 'draft',
        submitted_at: null,
        created_at: new Date().toISOString()
      })
      .eq('id', record.id)
      .select()

    if (error) {
      console.error('撤回需求失败:', error)
      message.error(`撤回失败: ${error.message}`)
      return
    }
    
    console.log('撤回成功，返回数据:', data)
    
    // 刷新数据
    await loadDemands()
    message.success('需求已成功撤回')
  } catch (error) {
    console.error('撤回需求异常:', error)
    message.error('撤回失败，请重试')
  }
}

const viewDetails = async (record) => {
  try {
    // 获取完整的需求详情（包含可能未在列表中获取的字段）
    const { data, error } = await supabase
      .from('teaching_demands')
      .select('*')
      .eq('id', record.id)
      .single()
    
    if (error) {
      console.error('获取需求详情失败:', error)
      message.error('获取详情失败')
      return
    }
    
    // 设置详情数据并显示模态框
    currentDetailDemand.value = data
    showDetailModal.value = true
  } catch (error) {
    console.error('查看需求详情异常:', error)
    message.error('查看详情失败，请重试')
  }
}

const closeModal = () => {
  showAddModal.value = false
  resetForm()
}

const closeDetailModal = () => {
  showDetailModal.value = false
  currentDetailDemand.value = null
}
</script>

<style scoped>
.demand-application {
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

.tab-content {
  padding: 8px 0;
}

/* 紧急程度选项样式 */
.urgency-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.urgency-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.urgency-dot.high {
  background: var(--error-color);
}

.urgency-dot.medium {
  background: var(--warning-color);
}

.urgency-dot.low {
  background: var(--success-color);
}

/* 状态标签样式 */
.status-pending {
  background: #FFFBEB;
  color: var(--warning-color);
  border: 1px solid #FCD34D;
}

.status-approved {
  background: #F0FDF4;
  color: var(--success-color);
  border: 1px solid #BBF7D0;
}

.status-rejected {
  background: #FEF2F2;
  color: var(--error-color);
  border: 1px solid #FECACA;
}

/* 紧急程度标签样式 */
.status-high {
  background: #FEF2F2;
  color: var(--error-color);
  border: 1px solid #FECACA;
}

.status-medium {
  background: #FFFBEB;
  color: var(--warning-color);
  border: 1px solid #FCD34D;
}

.status-low {
  background: #F0FDF4;
  color: var(--success-color);
  border: 1px solid #BBF7D0;
}

/* 需求详情样式 */
.detail-content {
  padding: 16px 0;
}

.detail-row {
  display: flex;
  margin-bottom: 16px;
  line-height: 24px;
}

.detail-label {
  width: 100px;
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-value {
  flex: 1;
  color: var(--text-primary);
}

.rejected-reason {
  color: var(--error-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .demand-application {
    padding: 16px;
  }
  
  .stats-cards .ant-col {
    margin-bottom: 16px;
  }
  
  .detail-row {
    flex-direction: column;
  }
  
  .detail-label {
    margin-bottom: 4px;
  }
}
</style>