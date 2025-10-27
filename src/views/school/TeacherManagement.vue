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

const activeTab = ref('current')
const showDetailModal = ref(false)
const currentTeacher = ref(null)

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
    // 从数据库获取最新的教师（已分配学生）数据
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (!profile) {
      message.error('未找到用户组织信息')
      return
    }

    // 获取分配到当前学校的学生
    const { data, error } = await supabase
      .from('student_assignments')
      .select(`
        *, 
        students(name, major, grade, contact)
      `)
      .eq('school_name', profile.organization)
      .eq('status', 'active')

    if (error) {
      throw error
    }

    // 更新教师列表数据
    if (data && data.length > 0) {
      currentTeachers.value = data.map(assignment => ({
        id: assignment.student_id,
        name: assignment.students.name,
        subject: assignment.teaching_subject,
        grade: assignment.teaching_grade,
        university: '合作大学', // 可从students表获取详细信息
        startDate: assignment.start_date.split('T')[0],
        endDate: '待定', // 可从assignment_period计算
        performance: 0, // 初始表现分数
        contact: assignment.students.contact || '暂无联系方式',
        remarks: '新分配' // 初始备注
      }))
    }
    
    message.success('数据已刷新')
  } catch (error) {
    console.error('刷新教师数据失败:', error)
    message.error('刷新数据失败，请稍后重试')
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