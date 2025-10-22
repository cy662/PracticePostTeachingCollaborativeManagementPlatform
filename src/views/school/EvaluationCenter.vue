<template>
  <div class="evaluation-center">
    <a-page-header
      title="评价中心"
      sub-title="对支教教师进行教学评价"
    >
      <template #extra>
        <a-button @click="refreshEvaluations">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
      </template>
    </a-page-header>

    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="pending" tab="待评价">
        <a-card>
          <a-table
            :columns="pendingColumns"
            :data-source="pendingEvaluations"
            :pagination="pagination"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-button type="primary" @click="startEvaluation(record)">
                  开始评价
                </a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
      
      <a-tab-pane key="completed" tab="已评价">
        <a-card>
          <a-table
            :columns="completedColumns"
            :data-source="completedEvaluations"
            :pagination="pagination"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <a-button type="link" @click="viewEvaluation(record)">
                  查看详情
                </a-button>
              </template>
              <template v-else-if="column.key === 'score'">
                <a-rate :value="record.score / 20" disabled />
                <span style="margin-left: 8px">{{ record.score }}分</span>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-tab-pane>
    </a-tabs>

    <!-- 评价模态框 -->
    <a-modal
      v-model:open="showEvaluationModal"
      title="教师评价"
      width="800px"
      @ok="submitEvaluation"
      :confirm-loading="evaluationLoading"
    >
      <a-form :model="evaluationForm" layout="vertical" v-if="currentTeacher">
        <a-card title="基本信息" size="small" class="evaluation-section">
          <a-descriptions :column="2">
            <a-descriptions-item label="教师姓名">{{ currentTeacher.name }}</a-descriptions-item>
            <a-descriptions-item label="任教科目">{{ currentTeacher.subject }}</a-descriptions-item>
            <a-descriptions-item label="任教年级">{{ currentTeacher.grade }}</a-descriptions-item>
            <a-descriptions-item label="评价周期">{{ evaluationForm.period }}</a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card title="教学能力评价" size="small" class="evaluation-section">
          <a-form-item label="教学内容掌握">
            <a-rate v-model:value="evaluationForm.teachingContent" />
          </a-form-item>
          <a-form-item label="教学方法运用">
            <a-rate v-model:value="evaluationForm.teachingMethod" />
          </a-form-item>
          <a-form-item label="课堂管理能力">
            <a-rate v-model:value="evaluationForm.classroomManagement" />
          </a-form-item>
        </a-card>

        <a-card title="工作态度评价" size="small" class="evaluation-section">
          <a-form-item label="工作责任心">
            <a-rate v-model:value="evaluationForm.responsibility" />
          </a-form-item>
          <a-form-item label="团队协作">
            <a-rate v-model:value="evaluationForm.teamwork" />
          </a-form-item>
          <a-form-item label="学习进步">
            <a-rate v-model:value="evaluationForm.learningProgress" />
          </a-form-item>
        </a-card>

        <a-card title="综合评价" size="small" class="evaluation-section">
          <a-form-item label="总体评分">
            <a-rate v-model:value="evaluationForm.overallScore" />
          </a-form-item>
          <a-form-item label="评语">
            <a-textarea
              v-model:value="evaluationForm.comments"
              placeholder="请输入对教师的综合评价"
              :rows="4"
            />
          </a-form-item>
          <a-form-item label="改进建议">
            <a-textarea
              v-model:value="evaluationForm.suggestions"
              placeholder="请输入改进建议"
              :rows="3"
            />
          </a-form-item>
        </a-card>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { supabase } from '../../lib/supabaseClient.js'

const activeTab = ref('pending')
const showEvaluationModal = ref(false)
const evaluationLoading = ref(false)
const currentTeacher = ref(null)

const evaluationForm = reactive({
  period: '2023-2024学年第一学期',
  teachingContent: 0,
  teachingMethod: 0,
  classroomManagement: 0,
  responsibility: 0,
  teamwork: 0,
  learningProgress: 0,
  overallScore: 0,
  comments: '',
  suggestions: ''
})

const pendingEvaluations = ref([])
const completedEvaluations = ref([])
const currentUser = ref(null)
const loading = ref(false)

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

// 加载评价数据
const loadEvaluations = async () => {
  loading.value = true
  try {
    if (!await getCurrentUser()) return

    // 查询学校信息
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization')
      .eq('id', currentUser.value.id)
      .single()

    if (!profile) {
      message.error('未找到用户组织信息')
      return
    }

    // 查询待评价数据
    const { data: pending, error: pendingError } = await supabase
      .from('teacher_evaluations')
      .select('*')
      .eq('school_name', profile.organization)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (pendingError) throw pendingError
    pendingEvaluations.value = pending

    // 查询已完成评价数据
    const { data: completed, error: completedError } = await supabase
      .from('teacher_evaluations')
      .select('*')
      .eq('school_name', profile.organization)
      .eq('status', 'completed')
      .order('evaluated_at', { ascending: false })

    if (completedError) throw completedError
    completedEvaluations.value = completed
  } catch (error) {
    console.error('加载评价数据失败:', error)
    message.error('加载数据失败，请刷新页面重试')
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadEvaluations()
})
])

const pendingColumns = [
  { title: '教师姓名', dataIndex: 'teacherName', key: 'teacherName' },
  { title: '任教科目', dataIndex: 'subject', key: 'subject' },
  { title: '任教年级', dataIndex: 'grade', key: 'grade' },
  { title: '评价周期', dataIndex: 'period', key: 'period' },
  { title: '截止时间', dataIndex: 'deadline', key: 'deadline' },
  { title: '操作', key: 'action' }
]

const completedColumns = [
  { title: '教师姓名', dataIndex: 'teacherName', key: 'teacherName' },
  { title: '任教科目', dataIndex: 'subject', key: 'subject' },
  { title: '任教年级', dataIndex: 'grade', key: 'grade' },
  { title: '评价周期', dataIndex: 'period', key: 'period' },
  { title: '评分', key: 'score' },
  { title: '评价时间', dataIndex: 'evaluateTime', key: 'evaluateTime' },
  { title: '操作', key: 'action' }
]

const pagination = {
  current: 1,
  pageSize: 10,
  total: 2
}

const startEvaluation = (record) => {
  currentTeacher.value = record
  showEvaluationModal.value = true
}

const submitEvaluation = async () => {
  evaluationLoading.value = true
  try {
    // 计算总分
    const score = Object.values(evaluationForm).reduce((sum, value) => {
      return typeof value === 'number' ? sum + value : sum
    }, 0) * 4

    // 保存评价到数据库
    const { error } = await supabase
      .from('teacher_evaluations')
      .update({
        status: 'completed',
        score: score,
        teaching_content_score: evaluationForm.teachingContent,
        teaching_method_score: evaluationForm.teachingMethod,
        classroom_management_score: evaluationForm.classroomManagement,
        responsibility_score: evaluationForm.responsibility,
        teamwork_score: evaluationForm.teamwork,
        learning_progress_score: evaluationForm.learningProgress,
        overall_score: evaluationForm.overallScore,
        comments: evaluationForm.comments,
        suggestions: evaluationForm.suggestions,
        evaluated_at: new Date().toISOString(),
        evaluated_by: currentUser.value.id
      })
      .eq('id', currentTeacher.value.id)

    if (error) throw error
    
    // 刷新数据
    await loadEvaluations()
    
    message.success('评价提交成功')
    showEvaluationModal.value = false
    resetEvaluationForm()
  } catch (error) {
    console.error('提交评价失败:', error)
    message.error('评价提交失败，请重试')
  } finally {
    evaluationLoading.value = false
  }
}

const viewEvaluation = (record) => {
  message.info(`查看评价详情: ${record.teacherName}`)
}

const refreshEvaluations = async () => {
  await loadEvaluations()
  message.success('数据已刷新')
}

const resetEvaluationForm = () => {
  Object.keys(evaluationForm).forEach(key => {
    if (typeof evaluationForm[key] === 'number') {
      evaluationForm[key] = 0
    } else if (key !== 'period') {
      evaluationForm[key] = ''
    }
  })
}
</script>

<style scoped>
.evaluation-center {
  padding: 20px;
}

.evaluation-section {
  margin-bottom: 16px;
}
</style>