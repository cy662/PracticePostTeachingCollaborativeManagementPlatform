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
        <a-button @click="refreshDemands">
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
import { ref, reactive, computed } from 'vue'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const activeTab = ref('pending')
const showRejectModal = ref(false)
const rejectLoading = ref(false)
const currentDemand = ref(null)

const rejectForm = reactive({
  reason: ''
})

const pendingDemands = ref([
  {
    id: 1,
    schoolName: '北京市第一中学',
    subject: '数学',
    grade: '高一',
    demand: 2,
    duration: '2023-2024学年',
    urgency: 'high',
    submitTime: '2023-10-20',
    region: '北京市',
    contact: '张老师 138****1234'
  },
  {
    id: 2,
    schoolName: '上海市实验学校',
    subject: '语文',
    grade: '初二',
    demand: 1,
    duration: '2023-2024学年',
    urgency: 'medium',
    submitTime: '2023-10-19',
    region: '上海市',
    contact: '李老师 139****5678'
  },
  {
    id: 3,
    schoolName: '广州市第七中学',
    subject: '英语',
    grade: '初三',
    demand: 1,
    duration: '2023-2024学年',
    urgency: 'low',
    submitTime: '2023-10-18',
    region: '广州市',
    contact: '王老师 136****9012'
  }
])

const approvedDemands = ref([
  {
    id: 4,
    schoolName: '深圳市实验学校',
    subject: '物理',
    grade: '高二',
    demand: 1,
    duration: '2023-2024学年',
    urgency: 'medium',
    submitTime: '2023-10-15',
    region: '深圳市',
    contact: '赵老师 135****3456',
    approveTime: '2023-10-17'
  }
])

const rejectedDemands = ref([])

// 统计数据
const stats = computed(() => {
  const total = pendingDemands.value.length + approvedDemands.value.length + rejectedDemands.value.length
  const pending = pendingDemands.value.length
  const approved = approvedDemands.value.length
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0
  
  return { total, pending, approved, approvalRate }
})

const columns = [
  { 
    title: '学校名称', 
    dataIndex: 'schoolName', 
    key: 'schoolName',
    width: 150
  },
  { 
    title: '所在地区', 
    dataIndex: 'region', 
    key: 'region',
    width: 100
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
    // 模拟审核通过逻辑
    await new Promise(resolve => setTimeout(resolve, 500))
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
    message.error('操作失败')
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
    // 模拟驳回逻辑
    await new Promise(resolve => setTimeout(resolve, 800))
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
    message.error('操作失败')
  } finally {
    rejectLoading.value = false
  }
}

const exportData = () => {
  message.success('数据导出成功')
}

const publishPosition = (demand) => {
  message.success(`已发布岗位: ${demand.schoolName}`)
}

const viewDetails = (record) => {
  message.info(`查看需求详情: ${record.schoolName}`)
}

const refreshDemands = () => {
  message.success('数据已刷新')
}
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