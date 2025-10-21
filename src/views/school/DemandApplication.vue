<template>
  <div class="demand-application">
    <a-page-header
      title="需求申报"
      sub-title="提交师资需求申请"
    >
      <template #extra>
        <a-button type="primary" @click="showAddModal = true">
          <template #icon><PlusOutlined /></template>
          新增需求
        </a-button>
      </template>
    </a-page-header>

    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="draft" tab="草稿">
        <a-card>
          <a-table
            :columns="columns"
            :data-source="draftDemands"
            :pagination="pagination"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" @click="editDemand(record)">
                    编辑
                  </a-button>
                  <a-button type="link" @click="submitDemand(record)">
                    提交
                  </a-button>
                  <a-popconfirm title="确定删除这个需求吗？" @confirm="deleteDemand(record.id)">
                    <a style="color: #ff4d4f">删除</a>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
      
      <a-tab-pane key="submitted" tab="已提交">
        <a-card>
          <a-table
            :columns="columns"
            :data-source="submittedDemands"
            :pagination="pagination"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" @click="viewDetails(record)">
                    查看
                  </a-button>
                  <a-button 
                    type="link" 
                    @click="withdrawDemand(record)"
                    :disabled="record.status !== 'pending'"
                  >
                    撤回
                  </a-button>
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
      </a-tab-pane>
    </a-tabs>

    <!-- 新增需求模态框 -->
    <a-modal
      v-model:open="showAddModal"
      title="新增师资需求"
      width="600px"
      @ok="handleAdd"
      :confirm-loading="addLoading"
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
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="年级" required>
              <a-select v-model:value="addForm.grade" placeholder="请选择年级">
                <a-select-option value="小学">小学</a-select-option>
                <a-select-option value="初中">初中</a-select-option>
                <a-select-option value="高中">高中</a-select-option>
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
          />
        </a-form-item>
        
        <a-form-item label="支教时间" required>
          <a-input v-model:value="addForm.duration" placeholder="例如：2023-2024学年" />
        </a-form-item>
        
        <a-form-item label="紧急程度">
          <a-radio-group v-model:value="addForm.urgency">
            <a-radio value="high">紧急</a-radio>
            <a-radio value="medium">一般</a-radio>
            <a-radio value="low">不紧急</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="特殊要求">
          <a-textarea
            v-model:value="addForm.requirements"
            placeholder="请输入特殊要求（如：需要有班主任经验等）"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const activeTab = ref('draft')
const showAddModal = ref(false)
const addLoading = ref(false)

const addForm = reactive({
  subject: '',
  grade: '',
  demand: 1,
  duration: '',
  urgency: 'medium',
  requirements: ''
})

const draftDemands = ref([
  {
    id: 1,
    subject: '数学',
    grade: '高一',
    demand: 2,
    duration: '2023-2024学年',
    urgency: 'high',
    createTime: '2023-10-20'
  }
])

const submittedDemands = ref([
  {
    id: 2,
    subject: '语文',
    grade: '初二',
    demand: 1,
    duration: '2023-2024学年',
    urgency: 'medium',
    submitTime: '2023-10-19',
    status: 'pending'
  }
])

const columns = [
  { title: '学科', dataIndex: 'subject', key: 'subject' },
  { title: '年级', dataIndex: 'grade', key: 'grade' },
  { title: '需求人数', dataIndex: 'demand', key: 'demand' },
  { title: '支教时间', dataIndex: 'duration', key: 'duration' },
  { title: '紧急程度', key: 'urgency', 
    customRender: ({ text }) => getUrgencyText(text) 
  },
  { title: '提交时间', dataIndex: 'submitTime', key: 'submitTime' },
  { title: '状态', key: 'status' },
  { title: '操作', key: 'action' }
]

const pagination = {
  current: 1,
  pageSize: 10,
  total: 1
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red'
  }
  return colors[status] || 'default'
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

const handleAdd = async () => {
  addLoading.value = true
  try {
    // 模拟添加逻辑
    draftDemands.value.push({
      id: Date.now(),
      ...addForm,
      createTime: new Date().toISOString().split('T')[0]
    })
    message.success('需求已保存为草稿')
    showAddModal.value = false
    Object.keys(addForm).forEach(key => {
      if (key !== 'urgency') {
        addForm[key] = key === 'demand' ? 1 : ''
      }
    })
    addForm.urgency = 'medium'
  } catch (error) {
    message.error('保存失败')
  } finally {
    addLoading.value = false
  }
}

const editDemand = (record) => {
  message.info(`编辑需求: ${record.subject} ${record.grade}`)
}

const submitDemand = async (record) => {
  try {
    // 模拟提交逻辑
    await new Promise(resolve => setTimeout(resolve, 500))
    submittedDemands.value.push({
      ...record,
      submitTime: new Date().toISOString().split('T')[0],
      status: 'pending'
    })
    draftDemands.value = draftDemands.value.filter(d => d.id !== record.id)
    message.success('需求提交成功')
  } catch (error) {
    message.error('提交失败')
  }
}

const deleteDemand = (id) => {
  draftDemands.value = draftDemands.value.filter(d => d.id !== id)
  message.success('删除成功')
}

const withdrawDemand = (record) => {
  message.info(`撤回需求: ${record.subject} ${record.grade}`)
}

const viewDetails = (record) => {
  message.info(`查看需求详情: ${record.subject} ${record.grade}`)
}
</script>

<style scoped>
.demand-application {
  padding: 20px;
}
</style>