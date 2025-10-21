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
import { ref, reactive } from 'vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

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

const pendingEvaluations = ref([
  {
    id: 1,
    teacherName: '张三',
    subject: '数学',
    grade: '高一',
    period: '2023-2024学年第一学期',
    deadline: '2024-01-31'
  },
  {
    id: 2,
    teacherName: '李四',
    subject: '语文',
    grade: '初二',
    period: '2023-2024学年第一学期',
    deadline: '2024-01-31'
  }
])

const completedEvaluations = ref([
  {
    id: 3,
    teacherName: '王五',
    subject: '英语',
    grade: '初三',
    period: '2022-2023学年第二学期',
    score: 92,
    evaluateTime: '2023-07-15'
  }
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
    // 模拟提交评价
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const score = Object.values(evaluationForm).reduce((sum, value) => {
      return typeof value === 'number' ? sum + value : sum
    }, 0) * 4
    
    completedEvaluations.value.push({
      id: Date.now(),
      teacherName: currentTeacher.value.teacherName,
      subject: currentTeacher.value.subject,
      grade: currentTeacher.value.grade,
      period: evaluationForm.period,
      score: score,
      evaluateTime: new Date().toISOString().split('T')[0]
    })
    
    pendingEvaluations.value = pendingEvaluations.value.filter(
      evaluation => evaluation.id !== currentTeacher.value.id
    )
    
    message.success('评价提交成功')
    showEvaluationModal.value = false
    resetEvaluationForm()
  } catch (error) {
    message.error('评价提交失败')
  } finally {
    evaluationLoading.value = false
  }
}

const viewEvaluation = (record) => {
  message.info(`查看评价详情: ${record.teacherName}`)
}

const refreshEvaluations = () => {
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