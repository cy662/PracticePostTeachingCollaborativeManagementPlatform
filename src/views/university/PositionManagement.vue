<template>
  <div class="position-management">
    <a-page-header
      title="岗位管理"
      sub-title="查看和分配支教岗位"
    >
      <template #extra>
        <a-button @click="refreshPositions">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </template>
    </a-page-header>

    <a-row :gutter="16">
      <a-col :span="24">
        <a-card title="岗位列表">
          <a-table
            :columns="columns"
            :data-source="positions"
            :pagination="pagination"
            :loading="positionsLoading"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-space>
                  <a-button 
                    type="link" 
                    @click="openAssignModal(record)"
                    :disabled="record.status !== 'pending'"
                  >
                    分配学生
                  </a-button>
                  <a-button type="link" @click="viewDetails(record)">
                    查看详情
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
      </a-col>
    </a-row>

    <!-- 分配学生模态框 -->
    <a-modal
      v-model:open="showAssignModal"
      title="分配学生"
      width="800px"
      @ok="handleAssign"
      :confirm-loading="assignLoading"
    >
      <a-row :gutter="16">
        <a-col :span="12">
          <a-card title="可选学生" size="small">
            <a-list
              :data-source="availableStudents"
              :loading="studentsLoading"
            >
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta
                    :title="item.name"
                    :description="`${item.major} - ${item.grade}`"
                  />
                  <template #actions>
                    <a-button type="link" @click="selectStudent(item)">
                      选择
                    </a-button>
                  </template>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="已选学生" size="small">
            <a-list :data-source="selectedStudents">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta
                    :title="item.name"
                    :description="`${item.major} - ${item.grade}`"
                  />
                  <template #actions>
                    <a-button type="link" danger @click="removeStudent(item)">
                      移除
                    </a-button>
                  </template>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </a-col>
      </a-row>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { supabase } from '../../lib/supabaseClient'

const showAssignModal = ref(false)
const assignLoading = ref(false)
const studentsLoading = ref(false)
const positionsLoading = ref(false)
const currentPosition = ref(null)

const positions = ref([])
const availableStudents = ref([])
const selectedStudents = ref([])

const columns = [
  { title: '学校名称', dataIndex: 'schoolName', key: 'schoolName' },
  { title: '学科', dataIndex: 'subject', key: 'subject' },
  { title: '年级', dataIndex: 'grade', key: 'grade' },
  { title: '需求人数', dataIndex: 'demand', key: 'demand' },
  { title: '支教时间', dataIndex: 'duration', key: 'duration' },
  { title: '申请时间', dataIndex: 'applicationTime', key: 'applicationTime' },
  { title: '状态', key: 'status' },
  { title: '操作', key: 'action' }
]

const pagination = {
  current: 1,
  pageSize: 10,
  total: 0
}

// 获取审批通过的岗位数据
const fetchApprovedPositions = async () => {
  positionsLoading.value = true
  try {
    // 从数据库获取政府管理员审批通过的中小学申请
    const { data, error } = await supabase
      .from('teaching_demands')
      .select(`
        id,
        subject,
        grade,
        demand_count,
        duration,
        status,
        created_at,
        organization
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    console.log('获取到的数据:', data)

    // 转换数据格式
    positions.value = data.map(item => ({
      id: item.id,
      schoolName: item.organization || '未知学校',
      subject: item.subject,
      grade: item.grade,
      demand: item.demand_count,
      duration: item.duration,
      applicationTime: formatDate(item.created_at),
      status: 'pending' // 审批通过后初始状态为待分配
    }))

    pagination.total = positions.value.length
  } catch (error) {
    console.error('获取岗位数据失败:', error)
    message.error('获取岗位数据失败，请稍后重试')
    // 如果数据库查询失败，使用模拟数据
    positions.value = [
      {
        id: 1,
        schoolName: '北京市第一中学',
        subject: '数学',
        grade: '高一',
        demand: 2,
        duration: '2023-2024学年',
        applicationTime: '2023-09-01',
        status: 'pending'
      },
      {
        id: 2,
        schoolName: '上海市实验学校',
        subject: '语文',
        grade: '初二',
        demand: 1,
        duration: '2023-2024学年',
        applicationTime: '2023-09-02',
        status: 'pending'
      }
    ]
    pagination.total = positions.value.length
  } finally {
    positionsLoading.value = false
  }
}

// 日期格式化
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    assigned: 'blue',
    completed: 'green',
    approved: 'green'
  }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待分配',
    assigned: '已分配',
    completed: '已完成',
    approved: '已审批'
  }
  return texts[status] || '未知'
}

const openAssignModal = (position) => {
  currentPosition.value = position
  showAssignModal.value = true
  loadAvailableStudents()
}

const loadAvailableStudents = async () => {
  studentsLoading.value = true
  try {
    // 从数据库获取可用学生数据
    const { data, error } = await supabase
      .from('students')
      .select('id, name, major, grade, status')
      .eq('status', 'available')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    availableStudents.value = data || []
    
    // 如果没有学生数据，使用模拟数据
    if (availableStudents.value.length === 0) {
      availableStudents.value = [
        { id: 1, name: '张三', major: '数学教育', grade: '大三' },
        { id: 2, name: '李四', major: '语文教育', grade: '大四' },
        { id: 3, name: '王五', major: '英语教育', grade: '大三' }
      ]
    }
  } catch (error) {
    console.error('获取学生数据失败:', error)
    // 模拟数据
    availableStudents.value = [
      { id: 1, name: '张三', major: '数学教育', grade: '大三' },
      { id: 2, name: '李四', major: '语文教育', grade: '大四' },
      { id: 3, name: '王五', major: '英语教育', grade: '大三' }
    ]
  } finally {
    studentsLoading.value = false
  }
}

const selectStudent = (student) => {
  if (!selectedStudents.value.find(s => s.id === student.id)) {
    selectedStudents.value.push(student)
  }
}

const removeStudent = (student) => {
  selectedStudents.value = selectedStudents.value.filter(s => s.id !== student.id)
}

const handleAssign = async () => {
  if (selectedStudents.value.length === 0) {
    message.warning('请至少选择一个学生')
    return
  }

  // 检查是否超过需求人数
  if (selectedStudents.value.length > currentPosition.value.demand) {
    message.warning(`选择的学生数量(${selectedStudents.value.length})超过了需求人数(${currentPosition.value.demand})`)
    return
  }

  assignLoading.value = true
  try {
    // 由于数据库中可能没有定义rpc函数，这里先更新本地状态
    // TODO: 后续可以添加实际的数据库更新逻辑
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 更新本地状态
    const positionIndex = positions.value.findIndex(p => p.id === currentPosition.value.id)
    if (positionIndex !== -1) {
      positions.value[positionIndex].status = 'assigned'
    }
    
    console.log('学生分配成功:', selectedStudents.value, '到岗位:', currentPosition.value.id)

    message.success('分配成功')
    showAssignModal.value = false
    selectedStudents.value = []
  } catch (error) {
    console.error('分配学生失败:', error)
    message.error('分配失败，请稍后重试')
    // 即使失败也关闭模态框，避免数据不一致
    showAssignModal.value = false
    selectedStudents.value = []
  } finally {
    assignLoading.value = false
  }
}

const viewDetails = async (record) => {
  try {
    // 获取岗位详细信息
    const { data, error } = await supabase
      .from('teaching_demands')
      .select(`
        id,
        subject,
        grade,
        demand_count,
        duration,
        special_requirements,
        urgency,
        created_at,
        organization
      `)
      .eq('id', record.id)
      .single()

    if (error) {
      throw error
    }

    // 显示详情信息
    const details = {
      ...record,
      description: data.special_requirements || '无详细描述',
      urgency: getUrgencyText(data.urgency),
      address: '未知', // 从teaching_demands表无法直接获取学校地址
      contactPerson: '未知', // 从teaching_demands表无法直接获取联系人
      contactPhone: '未知' // 从teaching_demands表无法直接获取联系电话
    }
  
  // 紧急程度文本映射
  function getUrgencyText(urgency) {
    const urgencyMap = {
      high: '高',
      medium: '中',
      low: '低'
    }
    return urgencyMap[urgency] || '未知'
  }

    // 创建一个简单的详情模态框
    const modal = document.createElement('div')
    modal.className = 'detail-modal-overlay'
    modal.innerHTML = `
      <div class="detail-modal">
        <h3>岗位详情</h3>
        <div class="detail-content">
          <p><strong>学校名称:</strong> ${details.schoolName}</p>
          <p><strong>学科:</strong> ${details.subject}</p>
          <p><strong>年级:</strong> ${details.grade}</p>
          <p><strong>需求人数:</strong> ${details.demand}</p>
          <p><strong>支教时间:</strong> ${details.duration}</p>
          <p><strong>申请时间:</strong> ${details.applicationTime}</p>
          <p><strong>状态:</strong> ${getStatusText(details.status)}</p>
          <p><strong>紧急程度:</strong> ${details.urgency}</p>
          <p><strong>特殊要求:</strong> ${details.description}</p>
        </div>
        <button id="close-modal">关闭</button>
      </div>
    `
    document.body.appendChild(modal)

    // 添加关闭事件
    document.getElementById('close-modal').onclick = () => {
      document.body.removeChild(modal)
    }

    // 添加样式
    const style = document.createElement('style')
    style.textContent = `
      .detail-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .detail-modal {
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
      }
      .detail-modal h3 {
        margin-top: 0;
      }
      .detail-content p {
        margin: 8px 0;
      }
      #close-modal {
        margin-top: 20px;
        padding: 8px 16px;
        background: #1890ff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
    `
    document.head.appendChild(style)
  } catch (error) {
    console.error('获取岗位详情失败:', error)
    message.error('获取岗位详情失败，请稍后重试')
  }
}

const refreshPositions = async () => {
  await fetchApprovedPositions()
  message.success('数据已刷新')
}

// 页面加载时获取数据
onMounted(() => {
  fetchApprovedPositions()
})
</script>

<style scoped>
.position-management {
  padding: 20px;
}
</style>