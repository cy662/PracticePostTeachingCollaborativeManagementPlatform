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
      <a-col :span="4">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.total }}</div>
          <div class="label">总需求数</div>
        </div>
      </a-col>
      <a-col :span="4">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.pending }}</div>
          <div class="label">待审核</div>
        </div>
      </a-col>
      <a-col :span="4">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.approved }}</div>
          <div class="label">已通过</div>
        </div>
      </a-col>

      <a-col :span="4">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.approvalRate }}%</div>
          <div class="label">审核通过率</div>
        </div>
      </a-col>
      <a-col :span="4">
        <div class="data-card">
          <div class="value highlight-text">{{ stats.rejected }}</div>
          <div class="label">已驳回</div>
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
      <a-tabs v-model:activeKey="activeTab" type="card" @change="handleTabChange">
        <a-tab-pane key="pending">
          <template #tab>
            待审核 <span class="tab-count">({{ stats.pending }})</span>
          </template>
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
        
        <a-tab-pane key="approved">
          <template #tab>
            已通过 <span class="tab-count">({{ stats.approved }})</span>
          </template>
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
                    <a-button type="link" size="small" @click="showPositionInfo(record)">
                      岗位信息
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
        
        <a-tab-pane key="rejected">
          <template #tab>
            已驳回 <span class="tab-count">({{ stats.rejected }})</span>
          </template>
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
                <template v-else-if="column.key === 'urgency'">
                  <span :class="['status-tag', `status-${record.urgency}`]">
                    {{ getUrgencyText(record.urgency) }}
                  </span>
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
import { ref, reactive, computed, onMounted, onUnmounted, h } from 'vue'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { supabase } from '../../lib/supabaseClient.js'
import * as XLSX from 'xlsx'

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
  const rejected = rejectedDemands.value.length
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0
  
  return { total, pending, approved, rejected, approvalRate }
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
          schoolName: demand.organization || demand.school_name || '未知学校',
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
    
    // 更新分页总数
    updatePaginationTotal()
    
  } catch (err) {
    console.error('异常:', err);
    message.error('获取数据时发生系统错误: ' + err.message);
  } finally {
    loading.value = false;
  }
}



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



// 响应式分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
})

// 更新分页总数
const updatePaginationTotal = () => {
  switch (activeTab.value) {
    case 'pending':
      pagination.total = pendingDemands.value.length
      break
    case 'approved':
      pagination.total = approvedDemands.value.length
      break
    case 'rejected':
      pagination.total = rejectedDemands.value.length
      break
    default:
      pagination.total = 0
  }
  // 切换标签时重置到第一页
  pagination.current = 1
}

const getUrgencyText = (urgency) => {
  const texts = {
    high: '紧急',
    medium: '一般',
    low: '不紧急'
  }
  return texts[urgency] || '未知'
}



// 监听标签页切换
const handleTabChange = (key) => {
  activeTab.value = key
  updatePaginationTotal()
}

const approveDemand = async (demand) => {
  // 显示确认框
  Modal.confirm({
    title: '确认审核通过',
    content: `确定要通过「${demand.schoolName}」的「${demand.subject}」需求申请吗？`,
    onOk: async () => {
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
        // 更新分页总数
        updatePaginationTotal()
        message.success({
          content: '需求审核通过',
          className: 'success-message'
        })
      } catch (error) {
        console.error('审核通过时发生错误:', error)
        message.error('系统错误，请稍后重试')
      }
    }
  })
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
    // 更新分页总数
    updatePaginationTotal()
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
  try {
    // 总是导出所有状态的数据（未审批、审批通过和驳回的）
    let dataToExport = [...pendingDemands.value, ...approvedDemands.value, ...rejectedDemands.value]
    let fileNamePrefix = '全部'
    
    if (dataToExport.length === 0) {
      message.warning('当前没有可导出的数据')
      return
    }
    
    // 准备Excel数据格式
    const excelData = dataToExport.map(demand => {
      // 根据需求的实际状态获取状态文本
      let statusText = '未知'
      if (pendingDemands.value.some(item => item.id === demand.id)) {
        statusText = '待审核'
      } else if (approvedDemands.value.some(item => item.id === demand.id)) {
        statusText = '已通过'
      } else if (rejectedDemands.value.some(item => item.id === demand.id)) {
        statusText = '已驳回'
      }
      
      return {
        '学校名称': demand.schoolName || '',
        '学科': demand.subject || '',
        '年级': demand.grade || '',
        '需求人数': demand.demand || 0,
        '支教时间': demand.duration || '',
        '紧急程度': getUrgencyText(demand.urgency) || '',
        '提交时间': demand.submitTime || '',
        '联系方式': demand.contact || '',
        '特殊要求': demand.specialRequirements || '',
        '审批状态': statusText
      }
    })
    
    // 创建工作簿和工作表
    const ws = XLSX.utils.json_to_sheet(excelData)
    
    // 设置列宽
    const colWidths = [
      { wch: 20 }, // 学校名称
      { wch: 10 }, // 学科
      { wch: 10 }, // 年级
      { wch: 10 }, // 需求人数
      { wch: 15 }, // 支教时间
      { wch: 10 }, // 紧急程度
      { wch: 15 }, // 提交时间
      { wch: 20 }, // 联系方式
      { wch: 30 }, // 特殊要求
      { wch: 10 }  // 审批状态
    ]
    ws['!cols'] = colWidths
    
    // 创建工作簿并添加工作表
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '需求数据')
    
    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const fileName = `${fileNamePrefix}需求报表_${timestamp}.xlsx`
    
    // 导出Excel文件
    XLSX.writeFile(wb, fileName)
    
    message.success(`成功导出${dataToExport.length}条数据为Excel格式`)  
  } catch (error) {
    console.error('导出Excel时发生错误:', error)
    message.error('Excel导出失败，请稍后重试')
  }
}  

// 显示岗位信息弹窗（原publishPosition函数重构）
const showPositionInfo = async (demand) => {
  try {
    console.log('查询需求的学生分配信息:', demand.id)
    
    // 获取当前用户信息
    const { data: userData } = await supabase.auth.getUser()
    const currentUserId = userData.user?.id
    console.log('当前用户ID:', currentUserId)
    
    // 获取用户角色信息
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', currentUserId)
      .single()
    
    console.log('用户角色信息:', profileData)
    console.log('获取角色错误:', profileError)
    
    // 查询需求详情
    const { data: demandData, error: demandError } = await supabase
      .from('teaching_demands')
      .select('id, subject')
      .eq('id', demand.id)
      .single()
    
    console.log('需求查询结果:', demandData)
    console.log('需求查询错误:', demandError)
    
    // 查询分配信息
    console.log('=== 开始查询分配信息 ===')
    const { data: assignments, error } = await supabase
      .from('position_student_assignments')
      .select('*, students(*)')
      .eq('position_id', demand.id)
      
    console.log('分配查询结果:', assignments, error)
    
    // 获取所有分配记录用于诊断
    const { data: allAssignments, error: allError } = await supabase
      .from('position_student_assignments')
      .select('*')
      .limit(10)
    
    console.log('所有分配记录数量:', allAssignments ? allAssignments.length : 0)
    
    if (error) {
      console.error('获取学生分配信息失败:', error)
      message.error(`获取信息失败: ${error.message || '未知错误'}`)
      return
    }
    
    // 生成弹窗内容
    const generatePopupContent = (hasData) => {
      let content = '<div class="popup-container">'
      
      // 岗位基础信息区
      content += '<div class="position-base-info">'
      content += '<div class="grid-layout">'
      content += `<div class="info-label">岗位 ID：</div>`
      content += `<div class="info-divider">|</div>`
      content += `<div class="info-value">${demand.id || '-'}</div>`
      content += `<div class="info-label">学校：</div>`
      content += `<div class="info-divider">|</div>`
      content += `<div class="info-value">${demand.schoolName || demand.school_name || '-'}</div>`
      content += `<div class="info-label">学科：</div>`
      content += `<div class="info-divider">|</div>`
      content += `<div class="info-value">${demand.subject || '-'}</div>`
      content += `<div class="info-label">年级：</div>`
      content += `<div class="info-divider">|</div>`
      content += `<div class="info-value">${demand.grade || '-'}</div>`
      content += `<div class="info-label">需求人数：</div>`
      content += `<div class="info-divider">|</div>`
      content += `<div class="info-value">${demand.demand || '-'}</div>`
      content += `<div class="info-label">支教时间：</div>`
      content += `<div class="info-divider">|</div>`
      content += `<div class="info-value">${demand.duration || '-'}</div>`
      content += '</div></div>'
      
      // 分隔线
      content += '<div class="divider"></div>'
      
      // 学生分配信息区
      if (hasData) {
        content += '<div class="student-list">'
        content += `<div class="section-title">已分配学生（共${assignments.length}人）</div>`
        
        assignments.forEach((assignment, index) => {
          const student = assignment.students
          if (!student) return
          
          content += '<div class="student-card">'
          content += `<div class="student-index">【第${index + 1}位学生】</div>`
          content += '<div class="student-details">'
          content += `<div><span class="detail-label">姓名：</span>${student.name || '-'}</div>`
          content += `<div><span class="detail-label">学号：</span>${student.student_id || '-'}</div>`
          content += `<div><span class="detail-label">专业：</span>${student.major || '-'}</div>`
          content += `<div><span class="detail-label">年级：</span>${student.grade || '-'}</div>`
          content += `<div><span class="detail-label">班级：</span>${student.class_name || '-'}</div>`
          content += `<div><span class="detail-label">邮箱：</span>${student.email || '-'}</div>`
          content += `<div><span class="detail-label">电话：</span>${student.phone || '-'}</div>`
          content += '</div></div>'
        })
        
        content += '</div>'
      } else {
        // 无数据状态
        content += '<div class="empty-state">'
        content += '<div class="empty-icon">📁</div>'
        content += '<div class="empty-text">暂无岗位分配信息</div>'
        content += '</div>'
      }
      
      content += '</div>'
      return content
    }

    // 显示弹窗 - 使用Modal.info代替Modal.confirm以确保HTML内容正确渲染
    Modal.info({
      title: '岗位信息与学生分配情况',
      content: h('div', { innerHTML: generatePopupContent(assignments && assignments.length > 0) }),
      centered: true,
      okText: '确定',
      okButtonProps: { class: 'custom-ok-btn' },
      onOk() { console.log('确认查看岗位信息') }
    })

  } catch (error) {
    console.error('查询岗位信息失败:', error)
    message.error(`查询失败: ${error.message || '未知错误'}`)
  }
}

const viewDetails = (record) => {
  console.log('查看需求详情:', record)
  message.info(`查看需求详情: ${record.schoolName}\n学科: ${record.subject}\n年级: ${record.grade}\n需求人数: ${record.demand}\n${record.specialRequirements ? '特殊要求: ' + record.specialRequirements : ''}`)
}

const refreshDemands = () => {
  fetchDemands()
  message.success('数据已刷新')
}

// 页面加载时获取数据
onMounted(() => {
  console.log('组件已挂载，开始获取需求数据');
  fetchDemands()
})


</script>

<style>
/* 全局样式 - 用于弹窗渲染 */
.popup-container {
  padding: 14px;
  min-width: 300px;
  max-width: 380px;
  min-height: 300px;
  max-height: 600px;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
}

.position-base-info {
  margin-bottom: 20px;
}

.grid-layout {
  display: grid;
  grid-template-columns: 80px 15px 1fr;
  gap: 2px;
  margin-bottom: 16px;
}

.info-label {
  text-align: right;
  color: #666;
  padding: 2px 0;
  font-size: 14px;
  font-weight: 500;
  min-width: 80px;
}

.info-value {
  color: #333;
  padding: 2px 0;
  font-weight: 500;
  font-size: 14px;
}

.info-divider {
  color: #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  padding: 2px 0;
}

.divider {
  height: 1px;
  width: 100%;
  background-color: #f0f0f0;
  margin: 18px 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 3px solid #1890ff;
}

.student-list {
  margin-top: 15px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  padding-left: 5px;
}

.student-card {
  background: #ffffff;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;
}

.student-card:hover {
  border-color: #1890ff;
  background-color: #fafafa;
}

.student-index {
  font-size: 13px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 8px;
}

.student-details {
  font-size: 12px;
  line-height: 1.8;
}

.detail-label {
  color: #666;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.custom-ok-btn {
  width: 80px !important;
  height: 32px !important;
  background-color: #1890ff !important;
  border-color: #1890ff !important;
}

.custom-cancel-btn {
  width: 80px !important;
  height: 32px !important;
  background-color: white !important;
  border-color: #d9d9d9 !important;
  color: #333 !important;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .popup-container {
    min-width: 300px;
    padding: 15px;
  }
  .grid-layout {
    grid-template-columns: 100px 1fr;
  }
}
</style>

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

.tab-count {
  display: inline-block;
  background-color: #f0f0f0;
  color: #666;
  font-size: 12px;
  padding: 0 8px;
  border-radius: 10px;
  font-weight: 500;
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

/* 学生信息样式 */
.student-info {
  padding: 8px;
  margin: 4px 0;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #1890ff;
}

.student-info div {
  margin: 2px 0;
  font-size: 12px;
  line-height: 1.4;
}

.student-info strong {
  color: #666;
  margin-right: 4px;
}

.no-student {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 8px;
}

/* 分配状态标签样式 */
.status-pending {
  background: #FFF7E6;
  color: #FA8C16;
  border: 1px solid #FFD591;
}

.status-approved {
  background: #F6FFED;
  color: #52C41A;
  border: 1px solid #B7EB8F;
}

.status-rejected {
  background: #FFF2F0;
  color: #FF4D4F;
  border: 1px solid #FFCCC7;
}

/* 筛选区域样式 */
.filter-section {
  margin-bottom: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-section .ant-form-item {
  margin-bottom: 8px;
}

/* 学生信息样式增强 */
.student-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.student-name {
  font-weight: 600;
  font-size: 14px;
  color: #1890ff;
}

.student-details {
  font-size: 12px;
  line-height: 1.6;
}

.student-details div {
  margin: 2px 0;
}

.rejection-reason {
  background: #fff2f0;
  padding: 4px 8px;
  border-radius: 4px;
  border-left: 3px solid #ff4d4f;
  margin-top: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .demand-management {
    padding: 16px;
  }
  
  .stats-cards .ant-col {
    margin-bottom: 16px;
  }
  
  .student-info {
    padding: 6px;
    font-size: 11px;
  }
  
  .filter-section {
    padding: 12px;
  }
  
  .filter-section .ant-form-item {
    margin-bottom: 12px;
  }
  
  .student-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .student-name {
    margin-bottom: 4px;
  }
}
</style>