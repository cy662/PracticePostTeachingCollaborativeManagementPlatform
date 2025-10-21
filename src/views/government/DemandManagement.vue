<template>
  <div class="demand-management">
    <a-page-header
      title="需求审核"
      sub-title="审核辖区内中小学的师资需求申请"
    >
      <template #extra>
        <a-button @click="refreshDemands">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </template>
    </a-page-header>

    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="pending" tab="待审核">
        <a-card>
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
                  <a-button size="small" @click="openRejectModal(record)">
                    驳回
                  </a-button>
                  <a-button type="link" @click="viewDetails(record)">
                    详情
                  </a-button>
                </a-space>
              </template>
              <template v-else-if="column.key === 'urgency'">
                <a-tag :color="getUrgencyColor(record.urgency)">
                  {{ getUrgencyText(record.urgency) }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
      
      <a-tab-pane key="approved" tab="已通过">
        <a-card>
          <a-table
            :columns="columns"
            :data-source="approvedDemands"
            :pagination="pagination"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" @click="publishPosition(record)">
                    发布岗位
                  </a-button>
                  <a-button type="link" @click="viewDetails(record)">
                    详情
                  </a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
      
      <a-tab-pane key="rejected" tab="已驳回">
        <a-card>
          <a-table
            :columns="columns"
            :data-source="rejectedDemands"
            :pagination="pagination"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-button type="link" @click="viewDetails(record)">
                  详情
                </a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <!-- 驳回原因模态框 -->
    <a-modal
      v-model:open="showRejectModal"
      title="驳回原因"
      @ok="handleReject"
      :confirm-loading="rejectLoading"
    >
      <a-form :model="rejectForm" layout="vertical">
        <a-form-item label="驳回原因" required>
          <a-textarea
            v-model:value="rejectForm.reason"
            placeholder="请输入驳回原因"
            :rows="4"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
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
    submitTime: '2023-10-20'
  },
  {
    id: 2,
    schoolName: '上海市实验学校',
    subject: '语文',
    grade: '初二',
    demand: 1,
    duration: '2023-2024学年',
    urgency: 'medium',
    submitTime: '2023-10-19'
  }
])

const approvedDemands = ref([])
const rejectedDemands = ref([])

const columns = [
  { title: '学校名称', dataIndex: 'schoolName', key: 'schoolName' },
  { title: '学科', dataIndex: 'subject', key: 'subject' },
  { title: '年级', dataIndex: 'grade', key: 'grade' },
  { title: '需求人数', dataIndex: 'demand', key: 'demand' },
  { title: '支教时间', dataIndex: 'duration', key: 'duration' },
  { title: '紧急程度', key: 'urgency' },
  { title: '提交时间', dataIndex: 'submitTime', key: 'submitTime' },
  { title: '操作', key: 'action' }
]

const pagination = {
  current: 1,
  pageSize: 10,
  total: 2
}

const getUrgencyColor = (urgency) => {
  const colors = {
    high: 'red',
    medium: 'orange',
    low: 'green'
  }
  return colors[urgency] || 'default'
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
    approvedDemands.value.push(demand)
    pendingDemands.value = pendingDemands.value.filter(d => d.id !== demand.id)
    message.success('审核通过')
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
    await new Promise(resolve => setTimeout(resolve, 500))
    rejectedDemands.value.push({
      ...currentDemand.value,
      rejectReason: rejectForm.reason
    })
    pendingDemands.value = pendingDemands.value.filter(d => d.id !== currentDemand.value.id)
    message.success('已驳回')
    showRejectModal.value = false
    rejectForm.reason = ''
  } catch (error) {
    message.error('操作失败')
  } finally {
    rejectLoading.value = false
  }
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
  padding: 20px;
}
</style>