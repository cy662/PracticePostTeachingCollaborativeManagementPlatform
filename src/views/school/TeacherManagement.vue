<template>
  <div class="teacher-management">
    <a-page-header
      title="教师管理"
      sub-title="管理本校的支教教师"
    >
      <template #extra>
        <a-button @click="refreshTeachers">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </template>
    </a-page-header>

    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="current" tab="当前教师">
        <a-card>
          <a-empty 
            v-if="currentTeachers.length === 0" 
            description="暂无分配到本校的教师，请等待大学分配或政府审核"
          />
          <a-table
            v-else
            :columns="columns"
            :data-source="currentTeachers"
            :pagination="pagination"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-button type="link" @click="viewDetails(record)">
                  详情
                </a-button>
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag 
                  :color="record.assignmentStatus === 'approved' ? 'green' : 
                          record.assignmentStatus === 'rejected' ? 'red' : 
                          record.assignmentStatus === 'active' ? 'blue' : 'orange'"
                >
                  {{ record.assignmentStatus === 'approved' ? '已通过' : 
                     record.assignmentStatus === 'rejected' ? '已驳回' : 
                     record.assignmentStatus === 'active' ? '已分配' : 
                     record.assignmentStatus === 'completed' ? '已完成' : '待审核' }}
                </a-tag>
              </template>

            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
      
      <a-tab-pane key="history" tab="历史教师">
        <a-card>
          <a-empty v-if="historyTeachers.length === 0" description="暂无历史教师记录" />
          <a-table
            v-else
            :columns="columns"
            :data-source="historyTeachers"
            :pagination="{ current: 1, pageSize: 10, total: historyTeachers.length }"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-button type="link" @click="viewHistory(record)">
                  查看记录
                </a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <!-- 教师详情模态框 -->
    <a-modal
      v-model:open="showDetailModal"
      title="教师详情"
      width="700px"
      :footer="null"
    >
      <a-descriptions :column="2" bordered v-if="currentTeacher">
        <a-descriptions-item label="姓名">{{ currentTeacher.name }}</a-descriptions-item>
        <a-descriptions-item label="学科">{{ currentTeacher.subject }}</a-descriptions-item>
        <a-descriptions-item label="年级">{{ currentTeacher.grade }}</a-descriptions-item>
        <a-descriptions-item label="任教时间">{{ currentTeacher.teachingTime }}</a-descriptions-item>
        <a-descriptions-item label="所在大学">{{ currentTeacher.university }}</a-descriptions-item>
        <a-descriptions-item label="所学专业">{{ currentTeacher.major }}</a-descriptions-item>
        <a-descriptions-item label="班级">{{ currentTeacher.className }}</a-descriptions-item>
        <a-descriptions-item label="入学年份">{{ currentTeacher.admissionYear }}</a-descriptions-item>
        <a-descriptions-item label="联系电话">{{ currentTeacher.contact }}</a-descriptions-item>
        <a-descriptions-item label="邮箱">{{ currentTeacher.email }}</a-descriptions-item>
        <a-descriptions-item label="分配状态" :span="2">
          <a-tag 
            :color="currentTeacher.assignmentStatus === 'approved' ? 'green' : 
                    currentTeacher.assignmentStatus === 'rejected' ? 'red' : 
                    currentTeacher.assignmentStatus === 'active' ? 'blue' : 'orange'"
          >
            {{ currentTeacher.remarks }}
          </a-tag>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { supabase } from '../../lib/supabaseClient.js'
import { useUserStore } from '../../stores/user.js'

const activeTab = ref('current')
const showDetailModal = ref(false)
const currentTeacher = ref(null)
const userStore = useUserStore()

const currentTeachers = ref([])

const historyTeachers = ref([])

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '学科', dataIndex: 'subject', key: 'subject' },
  { title: '年级', dataIndex: 'grade', key: 'grade' },
  { title: '任教时间', dataIndex: 'teachingTime', key: 'teachingTime' },
  { title: '所在大学', dataIndex: 'university', key: 'university' },
  { title: '联系方式', dataIndex: 'contact', key: 'contact' },
  { title: '所学专业', dataIndex: 'major', key: 'major' },
  { 
    title: '状态', 
    key: 'status',
    dataIndex: 'assignmentStatus',
  },
  { title: '操作', key: 'action' }
]

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

const viewDetails = (record) => {
  currentTeacher.value = record
  showDetailModal.value = true
}



const viewHistory = (record) => {
  message.info(`查看历史记录: ${record.name}`)
}

const refreshTeachers = async () => {
  try {
    // 优先从Pinia store获取用户信息
    if (userStore.isAuthenticated) {
      console.log('使用Pinia store用户信息')
    } else {
      // 如果store中没有用户信息，尝试从localStorage获取（兼容旧模式）
      const currentUserStr = localStorage.getItem('current_user') || localStorage.getItem('demo_user')
      
      if (!currentUserStr) {
        message.error('未找到用户信息，请重新登录')
        // 清除可能存在的过时用户数据
        localStorage.clear()
        // 跳转到登录页
        window.location.href = '/login'
        return
      }
      
      let currentUser
      try {
        currentUser = JSON.parse(currentUserStr)
        // 更新到Pinia store
        userStore.setUserInfo(currentUser)
      } catch (e) {
        message.error('用户信息解析失败')
        localStorage.clear()
        window.location.href = '/login'
        return
      }
    }
    
    // 检查是否为演示模式
    const demoMode = localStorage.getItem('demo_mode') === 'true'
    
    if (demoMode) {
      // 演示模式：使用模拟数据
      console.log('演示模式：使用预设数据')
      // 这里可以保留原有的模拟数据
      message.success('数据已刷新（演示模式）')
      return
    }
    
    // 真实模式：尝试获取用户组织信息
    let organization
    
    // 从store获取用户信息
    const currentUser = userStore.userInfo
    
    // 方法1：尝试直接从当前用户信息获取
    if (currentUser?.organization) {
      organization = currentUser.organization
    } 
    // 方法2：如果用户信息中没有组织信息，尝试从Supabase获取
    else {
      try {
        // 首先尝试使用Supabase认证获取用户ID
        let userId
        try {
          const { data: authData } = await supabase.auth.getUser()
          if (authData.user) {
            userId = authData.user.id
          }
        } catch (authError) {
          console.warn('Supabase认证失败，尝试其他方式获取用户信息')
        }
        
        // 如果无法通过认证获取用户ID，尝试从当前用户数据中获取
        if (!userId && currentUser?.id) {
          userId = currentUser.id
        }
        
        if (!userId) {
          throw new Error('无法获取用户ID')
        }
        
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('organization')
          .eq('id', userId)
          .single()
        
        if (!profile || !profile.organization) {
          throw new Error('未找到用户组织信息')
        }
        
        organization = profile.organization
      } catch (profileError) {
        console.error('获取用户组织信息失败:', profileError)
        // 如果获取失败，使用一个默认组织名或提示用户
        organization = currentUser?.name || '未知学校'
      }
    }
    
    console.log('当前组织:', organization)
    
    // 获取当前用户的组织ID
    let organizationId = null
    try {
      // 从store获取用户信息
      const currentUser = userStore.userInfo
      
      // 尝试从用户信息中获取组织ID
      if (currentUser?.organization_id) {
        organizationId = currentUser.organization_id
      } else if (currentUser?.id) {
        // 如果用户信息中没有组织ID，尝试从user_profiles表查询
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('organization_id')
          .eq('id', currentUser.id)
          .single()
        
        if (profile?.organization_id) {
          organizationId = profile.organization_id
        }
      }
    } catch (error) {
      console.warn('获取组织ID失败:', error)
    }
    
    console.log('当前组织ID:', organizationId)
    
    // 获取分配到当前学校的所有学生教师
    await getAssignedTeachers(organization, organizationId)
    
    message.success('数据已刷新')
  } catch (error) {
    console.error('刷新教师数据失败:', error)
    message.error('刷新数据失败：' + error.message)
  }
}

// 主要查询方法 - 获取大学分配给中小学的教师信息
const getAssignedTeachers = async (schoolName, organizationId = null) => {
  try {
    console.log('=== 开始查询大学分配给中小学的教师信息 ===')
    console.log('当前用户学校:', schoolName)
    console.log('当前用户组织ID:', organizationId)
    
    // 首先查询所有student_assignments记录，看看数据库里有什么
    const { data: allAssignments, error: allError } = await supabase
      .from('student_assignments')
      .select('id, school_name, status, student_id')
      .limit(10)
    
    console.log('数据库中所有分配记录（前10条）:', allAssignments)
    console.log('所有分配记录中的学校名称:', allAssignments?.map(a => a.school_name))
    
    // 查询所有该学校的记录（不限制status）
    const { data: allSchoolData } = await supabase
      .from('student_assignments')
      .select('school_name, status, student_id')
      .eq('school_name', schoolName)
    
    console.log('完全匹配学校名称的记录:', allSchoolData)
    
    // 如果完全匹配没有结果，尝试模糊匹配
    if (!allSchoolData || allSchoolData.length === 0) {
      console.log('完全匹配无结果，尝试查询所有记录进行模糊匹配...')
      const allNames = allAssignments?.map(a => a.school_name).filter(Boolean) || []
      const uniqueNames = [...new Set(allNames)]
      console.log('数据库中所有唯一的学校名称:', uniqueNames)
      
      // 检查是否有包含当前学校名称的记录
      const { data: fuzzyData } = await supabase
        .from('student_assignments')
        .select('school_name, status')
        .ilike('school_name', `%${schoolName}%`)
        .limit(5)
      
      console.log('模糊匹配结果:', fuzzyData)
      
      if (fuzzyData && fuzzyData.length > 0) {
        message.warning(`未找到完全匹配的记录，但找到类似名称: ${fuzzyData.map(d => d.school_name).join(', ')}`)
      }
    }
    
    // 改进查询逻辑：中小学管理员可以看到所有分配给中小学的教师信息
    let { data, error } = await supabase
      .from('student_assignments')
      .select(`
        *,
        students!inner(
          id,
          name,
          major,
          phone,
          email,
          grade,
          class_name,
          admission_year,
          graduation_year,
          teaching_subject,
          teaching_grade,
          created_by
        )
      `)
      .eq('status', 'active')

    console.log('所有active状态的分配记录:', data, '错误:', error)
    
    if (error) {
      console.error('查询student_assignments失败:', error)
      currentTeachers.value = []
      pagination.total = 0
      message.warning('查询数据失败，请检查数据库连接')
      return
    }
    
    // 如果当前用户是政府管理员，显示所有分配记录
    if (data && data.length > 0) {
      console.log('当前用户是政府管理员，显示所有分配记录')
      // 不需要过滤，直接显示所有记录
      console.log('显示所有分配记录:', data)
    } else {
      console.log('active状态没有数据，尝试查询所有状态的记录...')
      const { data: anyStatusData, error: anyStatusError } = await supabase
        .from('student_assignments')
        .select(`
          *,
          students!inner(
            id,
            name,
            major,
            phone,
            email,
            grade,
            class_name,
            admission_year,
            graduation_year,
            teaching_subject,
            teaching_grade,
            created_by
          )
        `)
      
      console.log('所有状态的查询结果:', anyStatusData, '错误:', anyStatusError)
      
      if (anyStatusData && anyStatusData.length > 0) {
        console.log('找到数据但状态不是active，使用这些数据')
        data = anyStatusData
      } else {
        console.log('未找到任何分配记录，可能的原因：')
        console.log('1. 大学还没有分配学生到中小学')
        console.log('2. 分配记录状态不是active')
        
        currentTeachers.value = []
        pagination.total = 0
        message.info('暂无大学分配的教师信息')
        return
      }
    }

    // 获取所有学生的created_by ID，用于查询大学信息
    const studentCreatorIds = [...new Set(data.map(a => a.students?.created_by).filter(Boolean))]
    
    // 批量查询大学信息
    const { data: universityProfiles } = await supabase
      .from('user_profiles')
      .select('id, organization')
      .in('id', studentCreatorIds)
    
    // 创建大学信息映射
    const universityMap = new Map()
    if (universityProfiles) {
      universityProfiles.forEach(profile => {
        universityMap.set(profile.id, profile.organization)
      })
    }

    // 更新教师列表数据
    currentTeachers.value = data.map(assignment => {
      const teachingTime = assignment.start_date ? 
        assignment.start_date.split('T')[0] : 
        '待定'
      
      // 获取大学名称（从user_profiles.organization获取）
      const university = assignment.students?.created_by 
        ? (universityMap.get(assignment.students.created_by) || '合作大学')
        : '合作大学'
      
      // 根据assignment.status确定状态
      const assignmentStatus = assignment.status || 'active'
      const remarksMap = {
        'pending': '待政府审核',
        'approved': '已通过政府审核',
        'rejected': '已驳回',
        'active': '已分配',
        'completed': '已完成'
      }
      
      return {
        id: assignment.student_id,
        name: assignment.students?.name || '未知',
        subject: assignment.teaching_subject,
        grade: assignment.teaching_grade,
        teachingTime: teachingTime,
        university: university,
        contact: assignment.students?.phone || '暂无联系方式',
        email: assignment.students?.email || '暂无邮箱',
        major: assignment.students?.major || '未知',
        className: assignment.students?.class_name || '未知班级',
        admissionYear: assignment.students?.admission_year || '未知',
        // 保留原有字段以兼容详情查看
        startDate: teachingTime,
        endDate: assignment.end_date ? assignment.end_date.split('T')[0] : '待定',
        performance: assignment.school_evaluation_score || 0,
        remarks: remarksMap[assignmentStatus] || '已分配',
        assignmentStatus: assignmentStatus // 保存状态用于显示
      }
    })
    
    // 更新分页总数
    pagination.total = currentTeachers.value.length
    
    console.log('成功获取教师信息:', currentTeachers.value)
  } catch (err) {
    console.error('查询教师信息失败:', err)
    currentTeachers.value = []
    pagination.total = 0
    message.error('获取教师信息失败，请稍后重试')
  }
}

// 监听教学分配更新事件
const handleTeachingAssignmentUpdated = (event) => {
  console.log('接收到教学分配更新:', event.detail)
  refreshTeachers()
}

// 组件挂载时添加事件监听器
onMounted(() => {
  window.addEventListener('teachingAssignmentUpdated', handleTeachingAssignmentUpdated)
  // 页面加载时获取最新数据
  refreshTeachers()
})

// 组件卸载时移除事件监听器
onUnmounted(() => {
  window.removeEventListener('teachingAssignmentUpdated', handleTeachingAssignmentUpdated)
})
</script>

<style scoped>
.teacher-management {
  padding: 20px;
}
</style>