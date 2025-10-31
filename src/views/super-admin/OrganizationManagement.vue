<template>
  <div class="organization-management">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <h1 class="page-title">机构管理</h1>
      <p class="page-subtitle">管理大学、政府、学校等机构信息</p>
    </div>

    <!-- 搜索区域 -->
    <a-card class="search-card">
      <a-form layout="inline" :model="searchForm">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="机构名称">
              <a-input
                v-model:value="searchForm.name"
                placeholder="请输入机构名称"
                allow-clear
              />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="机构类型">
              <a-select
                v-model:value="searchForm.type"
                placeholder="请选择机构类型"
                allow-clear
              >
                <a-select-option value="university">大学</a-select-option>
                <a-select-option value="government">政府</a-select-option>
                <a-select-option value="school">学校</a-select-option>
                <a-select-option value="other">其他</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-space>
              <a-button type="primary" @click="handleSearch">
                <template #icon>
                  <SearchOutlined />
                </template>
                搜索
              </a-button>
              <a-button @click="handleReset">
                <template #icon>
                  <ReloadOutlined />
                </template>
                重置
              </a-button>
            </a-space>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 功能按钮区域 -->
    <div class="action-bar">
      <a-button type="primary" @click="handleAdd">
        <template #icon>
          <PlusOutlined />
        </template>
        添加机构
      </a-button>
    </div>

    <!-- 数据表格 -->
    <a-card class="table-card">
      <a-table
        :columns="columns"
        :data-source="tableData"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="getTypeColor(record.type)">
              {{ getTypeText(record.type) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'created_at'">
            {{ formatDate(record.created_at) }}
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">
                <EditOutlined />
                编辑
              </a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record)">
                <DeleteOutlined />
                删除
              </a-button>
            </a-space>
          </template>
        </template>
        
        <template #emptyText>
          <a-empty description="暂无数据" />
        </template>
      </a-table>
    </a-card>

    <!-- 添加/编辑机构弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      width="600px"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="机构名称" name="name">
          <a-input v-model:value="formData.name" placeholder="请输入机构名称" />
        </a-form-item>
        
        <a-form-item label="机构类型" name="type">
          <a-select v-model:value="formData.type" placeholder="请选择机构类型">
            <a-select-option value="university">大学</a-select-option>
            <a-select-option value="government">政府</a-select-option>
            <a-select-option value="school">学校</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="机构代码" name="code">
          <a-input v-model:value="formData.code" placeholder="请输入机构代码" />
        </a-form-item>
        
        <a-form-item label="联系人" name="contact_person">
          <a-input v-model:value="formData.contact_person" placeholder="请输入联系人姓名" />
        </a-form-item>
        
        <a-form-item label="联系电话" name="contact_phone">
          <a-input v-model:value="formData.contact_phone" placeholder="请输入联系电话" />
        </a-form-item>
        
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="formData.email" placeholder="请输入邮箱地址" />
        </a-form-item>
        
        <a-form-item label="地址" name="address">
          <a-textarea v-model:value="formData.address" placeholder="请输入机构地址" :rows="3" />
        </a-form-item>
        
        <a-form-item label="机构描述" name="description">
          <a-textarea v-model:value="formData.description" placeholder="请输入机构描述" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { 
  SearchOutlined, 
  ReloadOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons-vue'
import { organizationService } from '@/api/organizationService'

export default {
  name: 'OrganizationManagement',
  components: {
    SearchOutlined,
    ReloadOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined
  },
  setup() {
    // 表格列配置
    const columns = [
      {
        title: '机构名称',
        dataIndex: 'name',
        key: 'name',
        width: 200
      },
      {
        title: '机构类型',
        dataIndex: 'type',
        key: 'type',
        width: 100
      },
      {
        title: '机构代码',
        dataIndex: 'code',
        key: 'code',
        width: 120
      },
      {
        title: '联系人',
        dataIndex: 'contact_person',
        key: 'contact_person',
        width: 100
      },
      {
        title: '联系电话',
        dataIndex: 'contact_phone',
        key: 'contact_phone',
        width: 120
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 150
      },
      {
        title: '操作',
        key: 'action',
        width: 150,
        fixed: 'right'
      }
    ]

    // 响应式数据
    const tableData = ref([])
    const loading = ref(false)
    const modalVisible = ref(false)
    const modalLoading = ref(false)
    const isEditMode = ref(false)
    const currentRecord = ref(null)
    const formRef = ref()

    // 搜索表单
    const searchForm = reactive({
      name: '',
      type: ''
    })

    // 表单数据
    const formData = reactive({
      name: '',
      type: '',
      code: '',
      contact_person: '',
      contact_phone: '',
      email: '',
      address: '',
      description: ''
    })

    // 表单验证规则
    const formRules = {
      name: [
        { required: true, message: '请输入机构名称', trigger: 'blur' }
      ],
      type: [
        { required: true, message: '请选择机构类型', trigger: 'change' }
      ],
      code: [
        { required: true, message: '请输入机构代码', trigger: 'blur' }
      ]
    }

    // 分页配置
    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total) => `共 ${total} 条记录`
    })

    // 计算属性
    const modalTitle = computed(() => {
      return isEditMode.value ? '编辑机构' : '添加机构'
    })

    // 方法
    const getTypeText = (type) => {
      const typeMap = {
        university: '大学',
        government: '政府',
        school: '学校',
        other: '其他'
      }
      return typeMap[type] || '未知'
    }

    const getTypeColor = (type) => {
      const colorMap = {
        university: 'blue',
        government: 'green',
        school: 'orange',
        other: 'gray'
      }
      return colorMap[type] || 'default'
    }

    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleString('zh-CN')
    }

    // 加载机构数据
    const loadOrganizations = async () => {
      loading.value = true
      try {
        // 使用服务层获取数据
        const params = {
          name: searchForm.name,
          type: searchForm.type,
          page: pagination.current,
          pageSize: pagination.pageSize
        }

        const result = await organizationService.getOrganizations(params)

        tableData.value = result.data || []
        pagination.total = result.totalCount
      } catch (error) {
        console.error('加载机构数据失败:', error)
        message.error(`加载机构数据失败: ${error.message}`)
      } finally {
        loading.value = false
      }
    }

    // 搜索
    const handleSearch = () => {
      pagination.current = 1
      loadOrganizations()
    }

    // 重置
    const handleReset = () => {
      Object.keys(searchForm).forEach(key => {
        searchForm[key] = ''
      })
      pagination.current = 1
      loadOrganizations()
    }

    // 添加机构
    const handleAdd = () => {
      isEditMode.value = false
      currentRecord.value = null
      Object.keys(formData).forEach(key => {
        formData[key] = ''
      })
      modalVisible.value = true
    }

    // 编辑机构
    const handleEdit = (record) => {
      isEditMode.value = true
      currentRecord.value = record
      Object.keys(formData).forEach(key => {
        formData[key] = record[key] || ''
      })
      modalVisible.value = true
    }

    // 删除机构
    const handleDelete = (record) => {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除机构"${record.name}"吗？此操作不可恢复。`,
        okText: '确认',
        cancelText: '取消',
        onOk: async () => {
          try {
            await organizationService.deleteOrganization(record.id)
            message.success('删除成功')
            loadOrganizations()
          } catch (error) {
            console.error('删除机构失败:', error)
            message.error(`删除机构失败: ${error.message}`)
          }
        }
      })
    }

    // 弹窗确认
    const handleModalOk = async () => {
      try {
        await formRef.value.validate()
        modalLoading.value = true

        const organizationData = { ...formData }

        if (isEditMode.value) {
          // 编辑模式
          await organizationService.updateOrganization(currentRecord.value.id, organizationData)
          message.success('编辑成功')
        } else {
          // 添加模式
          // 使用演示用户ID作为创建者
          const createdBy = '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'
          await organizationService.addOrganization(organizationData, createdBy)
          message.success('添加成功')
        }

        modalVisible.value = false
        loadOrganizations()
      } catch (error) {
        console.error('保存机构失败:', error)
        message.error(`保存机构失败: ${error.message}`)
      } finally {
        modalLoading.value = false
      }
    }

    // 弹窗取消
    const handleModalCancel = () => {
      modalVisible.value = false
      formRef.value.resetFields()
    }

    // 分页变化
    const handlePaginationChange = (page, pageSize) => {
      pagination.current = page
      pagination.pageSize = pageSize
      loadOrganizations()
    }

    // 生命周期
    onMounted(() => {
      loadOrganizations()
    })

    return {
      columns,
      tableData,
      loading,
      modalVisible,
      modalLoading,
      searchForm,
      formData,
      formRules,
      formRef,
      pagination,
      modalTitle,
      
      // 方法
      getTypeText,
      getTypeColor,
      formatDate,
      handleSearch,
      handleReset,
      handleAdd,
      handleEdit,
      handleDelete,
      handleModalOk,
      handleModalCancel,
      handlePaginationChange
    }
  }
}
</script>

<style scoped>
.organization-management {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.page-subtitle {
  color: #8c8c8c;
  margin: 8px 0 0 0;
}

.search-card {
  margin-bottom: 16px;
}

.action-bar {
  margin-bottom: 16px;
}

.table-card {
  border-radius: 8px;
}

:deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  font-weight: 600;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f5f5f5;
}
</style>