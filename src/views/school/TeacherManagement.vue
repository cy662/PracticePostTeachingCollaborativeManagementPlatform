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
          <a-table
            :columns="columns"
            :data-source="currentTeachers"
            :pagination="pagination"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" @click="viewDetails(record)">
                    详情
                  </a-button>
                  <a-button type="link" @click="startEvaluation(record)">
                    开始评价
                  </a-button>
                  <a-button type="link" @click="contactTeacher(record)">
                    联系
                  </a-button>
                </a-space>
              </template>
              <template v-else-if="column.key === 'performance'">
                <a-rate :value="record.performance" disabled />
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
      
      <a-tab-pane key="history" tab="历史教师">
        <a-card>
          <a-table
            :columns="columns"
            :data-source="historyTeachers"
            :pagination="pagination"
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
      width="600px"
      :footer="null"
    >
      <a-descriptions :column="2" bordered v-if="currentTeacher">
        <a-descriptions-item label="姓名">{{ currentTeacher.name }}</a-descriptions-item>
        <a-descriptions-item label="学科">{{ currentTeacher.subject }}</a-descriptions-item>
        <a-descriptions-item label="年级">{{ currentTeacher.grade }}</a-descriptions-item>
        <a-descriptions-item label="到岗时间">{{ currentTeacher.startDate }}</a-descriptions-item>
        <a-descriptions-item label="预计结束">{{ currentTeacher.endDate }}</a-descriptions-item>
        <a-descriptions-item label="教学表现">
          <a-rate :value="currentTeacher.performance" disabled />
        </a-descriptions-item>
        <a-descriptions-item label="联系方式" :span="2">
          {{ currentTeacher.contact }}
        </a-descriptions-item>
        <a-descriptions-item label="备注" :span="2">
          {{ currentTeacher.remarks || '无' }}
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

const currentTeachers = ref([
  {
    id: 1,
    name: '张三',
    subject: '数学',
    grade: '高一',
    university: '北京师范大学',
    startDate: '2023-09-01',
    endDate: '2024-01-31',
    performance: 4,
    contact: '138****1234'
  },
  {
    id: 2,
    name: '李四',
    subject: '语文',
    grade: '初二',
    university: '华东师范大学',
    startDate: '2023-09-01',
    endDate: '2024-01-31',
    performance: 5,
    contact: '139****5678'
  }
])

const historyTeachers = ref([
  {
    id: 3,
    name: '王五',
    subject: '英语',
    grade: '初三',
    university: '华南师范大学',
    period: '2022-2023学年',
    performance: 4
  }
])

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '学科', dataIndex: 'subject', key: 'subject' },
  { title: '年级', dataIndex: 'grade', key: 'grade' },
  { title: '毕业院校', dataIndex: 'university', key: 'university' },
  { title: '教学表现', key: 'performance' },
  { title: '操作', key: 'action' }
]

const pagination = {
  current: 1,
  pageSize: 10,
  total: 2
}

const viewDetails = (record) => {
  currentTeacher.value = record
  showDetailModal.value = true
}

const startEvaluation = (record) => {
  message.info(`开始评价教师: ${record.name}`)
}

const contactTeacher = (record) => {
  message.info(`联系教师: ${record.name} - ${record.contact}`)
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
    
    // 获取分配到当前学校的学生
    try {
      const { data, error } = await supabase
        .from('student_assignments')
        .select(`
          *,
          students(name, major, grade, contact)
        `)
        .eq('school_name', organization)
        .eq('status', 'active')

      if (error) {
        console.error('获取分配数据失败:', error)
        // 显示模拟数据作为后备
        message.warning('获取最新数据失败，显示演示数据')
        return
      }

      // 更新教师列表数据
      if (data && data.length > 0) {
        currentTeachers.value = data.map(assignment => ({
          id: assignment.student_id,
          name: assignment.students.name,
          subject: assignment.teaching_subject,
          grade: assignment.teaching_grade,
          university: assignment.students?.university || '合作大学',
          startDate: assignment.start_date ? assignment.start_date.split('T')[0] : '待定',
          endDate: assignment.end_date ? assignment.end_date.split('T')[0] : '待定',
          performance: assignment.performance || 0,
          contact: assignment.students.contact || '暂无联系方式',
          remarks: assignment.remarks || '新分配'
        }))
      } else {
        console.log('没有找到活跃的教师分配记录')
      }
    } catch (dbError) {
      console.error('数据库查询失败:', dbError)
      message.warning('获取数据失败，显示演示数据')
    }
    
    message.success('数据已刷新')
  } catch (error) {
    console.error('刷新教师数据失败:', error)
    message.error('刷新数据失败：' + error.message)
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