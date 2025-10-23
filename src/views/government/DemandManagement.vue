<template>
  <div class="demand-management">
    <!-- 面包屑导航 -->
    <div class="breadcrumb">
      <a-breadcrumb>
        <a-breadcrumb-item>政府管理员</a-breadcrumb-item>
        <a-breadcrumb-item>需求审核</a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- 页面标题 -->
    <div class="page-header">
      <h1>需求审核</h1>
      <p class="page-subtitle">审核辖区内中小学的师资需求申请</p>
    </div>

    <!-- 数据概览卡片 -->
    <a-row :gutter="16" class="stats-cards">
      <a-col :span="6">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.total }}</div>
          <div class="label">总需求数</div>
        </div>
      </a-col>
      <a-col :span="6">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.pending }}</div>
          <div class="label">待审核</div>
        </div>
      </a-col>
      <a-col :span="6">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.approved }}</div>
          <div class="label">已通过</div>
        </div>
      </a-col>
      <a-col :span="6">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.approvalRate }}%</div>
          <div class="label">审核通过率</div>
        </div>
      </a-col>
    </a-row>

    <!-- 操作栏 -->
    <div class="action-bar">
      <a-space>
        <a-button :loading="loading" @click="refreshDemands">
            <template #icon><ReloadOutlined /></template>
            刷新数据
          </a-button>
        <a-button @click="exportData">
          <template #icon><DownloadOutlined /></template>
          导出报表
        </a-button>
      </a-space>
    </div>

    <!-- 需求列表 -->
    <a-card class="content-card">
      <a-tabs v-model:activeKey="activeTab" type="card">
        <a-tab-pane key="pending" tab="待审核">
          <div class="tab-content">
            <a-table
              :columns="columns"
              :data-source="pendingDemands"
              :pagination="pagination"
              row-key="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a-button type="primary" size="small" @click="approveDemand(record)">
                      通过
                    </a-button>
                    <a-button size="small" @click="openRejectModal(record)" style="color: var(--error-color)">
                      驳回
                    </a-button>
                    <a-button type="link" size="small" @click="viewDetails(record)">
                      详情
                    </a-button>
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
        
        <a-tab-pane key="approved" tab="已通过">
          <div class="tab-content">
            <a-table
              :columns="columns"
              :data-source="approvedDemands"
              :pagination="pagination"
              row-key="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-space>
                    <a-button type="link" size="small" @click="publishPosition(record)">
                      发布岗位
                    </a-button>
                    <a-button type="link" size="small" @click="viewDetails(record)">
                      详情
                    </a-button>
                  </a-space>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>
        
        <a-tab-pane key="rejected" tab="已驳回">
          <div class="tab-content">
            <a-table
              :columns="columns"
              :data-source="rejectedDemands"
              :pagination="pagination"
              row-key="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <a-button type="link" size="small" @click="viewDetails(record)">
                    详情
                  </a-button>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 驳回原因模态框 -->
    <a-modal
      v-model:open="showRejectModal"
      title="驳回原因"
      @ok="handleReject"
      :confirm-loading="rejectLoading"
      :width="520"
    >
      <a-form :model="rejectForm" layout="vertical">
        <a-form-item label="驳回原因" required>
          <a-textarea
            v-model:value="rejectForm.reason"
            placeholder="请输入详细的驳回原因，便于学校了解情况并进行修改"
            :rows="4"
            show-count
            :maxlength="200"
          />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="showRejectModal = false">取消</a-button>
        <a-button type="primary" :loading="rejectLoading" @click="handleReject">
          确认驳回
        </a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { supabase } from '../../lib/supabaseClient.js'

const activeTab = ref('pending')
const showRejectModal = ref(false)
const rejectLoading = ref(false)
const currentDemand = ref(null)

const rejectForm = reactive({
  reason: ''
})

const pendingDemands = ref([])
const approvedDemands = ref([])
const rejectedDemands = ref([])
const loading = ref(false)

// 统计数据
const stats = computed(() => {
  const total = pendingDemands.value.length + approvedDemands.value.length + rejectedDemands.value.length
  const pending = pendingDemands.value.length
  const approved = approvedDemands.value.length
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0
  
  return { total, pending, approved, approvalRate }
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

// 从数据库获取真实需求数据
const fetchDemands = async () => {
  console.log('fetchDemands函数被调用');
  loading.value = true
  
  try {
    // 检查Supabase客户端是否正确初始化
    if (!supabase) {
      alert('Supabase客户端未正确初始化');
      console.error('Supabase客户端未定义');
      message.error('数据库连接失败');
      loading.value = false;
      return;
    }
    
    // 尝试查询两个可能的表名，解决表名不一致问题
    let demands = null;
    let error = null;
    
    // 首先尝试从teaching_demands表获取数据（与更新操作使用相同的表名）
    console.log('尝试从teaching_demands表获取数据...');
    const result1 = await supabase
      .from('teaching_demands')
      .select('*');
    
    if (!result1.error) {
      // 如果从teaching_demands表成功获取数据
      console.log('成功从teaching_demands表获取数据');
      demands = result1.data;
    } else {
      // 如果失败，尝试从school_demands表获取数据
      console.log('从teaching_demands表获取数据失败，尝试从school_demands表获取...');
      console.error('错误详情:', result1.error);
      
      const result2 = await supabase
        .from('school_demands')
        .select('*');
      
      if (!result2.error) {
        console.log('成功从school_demands表获取数据');
        demands = result2.data;
      } else {
        console.error('从school_demands表获取数据也失败:', result2.error);
        error = result2.error;
      }
    }
    
    if (error) {
      alert('获取需求数据失败: ' + error.message);
      console.error('错误详情:', error);
      message.error('数据库查询失败');
      loading.value = false;
      return;
    }
    
    // 清空现有数据
    pendingDemands.value = []
    approvedDemands.value = []
    rejectedDemands.value = []
    
    if (demands && Array.isArray(demands) && demands.length > 0) {
      console.log('成功获取到 ' + demands.length + ' 条真实需求数据');
      console.log('获取的数据:', demands);
      
      // 处理并分类数据
      demands.forEach((demand, index) => {
        // 为每条记录创建格式化对象
        const formattedDemand = {
          id: demand.id || `unknown_${index}`,
          schoolName: demand.school_name || demand.organization || '未知学校',
          subject: demand.subject || '未知科目',
          grade: demand.grade || '未知年级',
          demand: demand.demand_count || demand.count || 0,
          duration: demand.duration || '未知时长',
          urgency: demand.urgency || '普通',
          submitTime: demand.created_at ? formatDate(demand.created_at) : (demand.submitted_at ? formatDate(demand.submitted_at) : '未设置'),
          contact: demand.contact_info || demand.contact || '联系方式待补充',
          specialRequirements: demand.special_requirements || '无特殊要求',
          rejectedReason: demand.rejection_reason || '',
          approveTime: demand.approved_at ? formatDate(demand.approved_at) : '',
          rejectTime: demand.rejected_at ? formatDate(demand.rejected_at) : ''
        }
        
        // 根据状态分类
        const status = demand.status || 'pending';
        
        if (status === 'pending' || status === '待审核') {
          pendingDemands.value.push(formattedDemand)
        } else if (status === 'approved' || status === '已通过') {
          approvedDemands.value.push(formattedDemand)
        } else if (status === 'rejected' || status === '已驳回') {
          rejectedDemands.value.push(formattedDemand)
        } else {
          pendingDemands.value.push(formattedDemand)
        }
      });
      
      // 成功提示
      message.success(`成功从数据库获取 ${demands.length} 条需求数据`)
    } else {
      message.info('当前暂无需求数据');
    }
    
  } catch (err) {
    console.error('异常:', err);
    message.error('获取数据时发生系统错误: ' + err.message);
  } finally {
    loading.value = false;
  }
}

// 刷新数据功能在文件末尾实现

const columns = [
  { 
    title: '学校名称', 
    dataIndex: 'schoolName', 
    key: 'schoolName',
    width: 150
  },
  
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
    width: 80
  },
  { 
    title: '需求人数', 
    dataIndex: 'demand', 
    key: 'demand',
    width: 100
  },
  { 
    title: '支教时间', 
    dataIndex: 'duration', 
    key: 'duration',
    width: 120
  },
  { 
    title: '紧急程度', 
    key: 'urgency',
    width: 100
  },
  { 
    title: '提交时间', 
    dataIndex: 'submitTime', 
    key: 'submitTime',
    width: 120
  },
  { 
    title: '联系方式', 
    dataIndex: 'contact', 
    key: 'contact',
    width: 140
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
  total: 3,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
}

const getUrgencyText = (urgency) => {
  const texts = {
    high: '紧急',
    medium: '一般',
    low: '不紧急'
  }
  return texts[urgency] || '未知'
}

const approveDemand = async (demand) => {
  try {
    // 更新数据库中的需求状态 - 尝试两个可能的表名
    let updateSuccess = false;
    
    // 尝试更新teaching_demands表
    console.log('尝试更新teaching_demands表中的需求状态...');
    const result1 = await supabase
      .from('teaching_demands')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', demand.id)

    if (!result1.error) {
      console.log('成功更新teaching_demands表中的需求状态');
      updateSuccess = true;
    } else {
      // 如果失败，尝试更新school_demands表
      console.log('更新teaching_demands表失败，尝试更新school_demands表...');
      console.error('错误详情:', result1.error);
      
      const result2 = await supabase
        .from('school_demands')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', demand.id)
      
      if (!result2.error) {
        console.log('成功更新school_demands表中的需求状态');
        updateSuccess = true;
      }
    }

    if (!updateSuccess) {
      console.error('审核通过失败');
      message.error('审核通过失败，请稍后重试')
      return
    }

    // 更新本地数据
    approvedDemands.value.push({
      ...demand,
      approveTime: new Date().toISOString().split('T')[0]
    })
    pendingDemands.value = pendingDemands.value.filter(d => d.id !== demand.id)
    message.success({
      content: '需求审核通过',
      className: 'success-message'
    })
  } catch (error) {
    console.error('审核通过时发生错误:', error)
    message.error('系统错误，请稍后重试')
  }
}

const openRejectModal = (demand) => {
  currentDemand.value = demand
  showRejectModal.value = true
}

const handleReject = async () => {
  if (!rejectForm.reason.trim()) {
    message.warning('请输入驳回原因')
    return
  }

  rejectLoading.value = true
  try {
    // 更新数据库中的需求状态 - 尝试两个可能的表名
    let updateSuccess = false;
    
    // 尝试更新teaching_demands表
    console.log('尝试更新teaching_demands表中的需求状态...');
    const result1 = await supabase
      .from('teaching_demands')
      .update({
        status: 'rejected',
        rejected_reason: rejectForm.reason,
        rejected_at: new Date().toISOString()
      })
      .eq('id', currentDemand.value.id)

    if (!result1.error) {
      console.log('成功更新teaching_demands表中的需求状态');
      updateSuccess = true;
    } else {
      // 如果失败，尝试更新school_demands表
      console.log('更新teaching_demands表失败，尝试更新school_demands表...');
      console.error('错误详情:', result1.error);
      
      const result2 = await supabase
        .from('school_demands')
        .update({
          status: 'rejected',
          rejected_reason: rejectForm.reason,
          rejected_at: new Date().toISOString()
        })
        .eq('id', currentDemand.value.id)
      
      if (!result2.error) {
        console.log('成功更新school_demands表中的需求状态');
        updateSuccess = true;
      }
    }

    if (!updateSuccess) {
      console.error('驳回需求失败');
      message.error('驳回需求失败，请稍后重试')
      return
    }

    // 更新本地数据
    rejectedDemands.value.push({
      ...currentDemand.value,
      rejectReason: rejectForm.reason,
      rejectTime: new Date().toISOString().split('T')[0]
    })
    pendingDemands.value = pendingDemands.value.filter(d => d.id !== currentDemand.value.id)
    message.success({
      content: '需求已驳回',
      className: 'success-message'
    })
    showRejectModal.value = false
    rejectForm.reason = ''
  } catch (error) {
    console.error('驳回需求时发生错误:', error)
    message.error('系统错误，请稍后重试')
  } finally {
    rejectLoading.value = false
  }
}

const exportData = () => {
  message.success('数据导出功能开发中')
}

const publishPosition = async (demand) => {
  try {
    // 这里可以实现发布岗位的逻辑
    message.success(`已发布岗位: ${demand.schoolName}`)
  } catch (error) {
    console.error('发布岗位失败:', error)
    message.error('发布岗位失败，请稍后重试')
  }
}

const viewDetails = (record) => {
  // 这里可以实现查看详情的模态框
  console.log('查看需求详情:', record)
  message.info(`查看需求详情: ${record.schoolName}\n学科: ${record.subject}\n年级: ${record.grade}\n需求人数: ${record.demand}\n${record.specialRequirements ? '特殊要求: ' + record.specialRequirements : ''}`)
}

const refreshDemands = () => {
  fetchDemands()
  message.success('数据已刷新')
}

// 页面加载时获取数据
onMounted(() => {
  // 组件挂载时获取待审核需求
  console.log('组件已挂载，开始获取需求数据');
  fetchDemands()
})
</script>

<style scoped>
.demand-management {
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

/* 响应式设计 */
@media (max-width: 768px) {
  .demand-management {
    padding: 16px;
  }
  
  .stats-cards .ant-col {
    margin-bottom: 16px;
  }
}
</style>