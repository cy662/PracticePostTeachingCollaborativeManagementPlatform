<template>
  <div class="login-container">
    <div class="login-form">
      <div class="login-header">
        <h1>顶岗支教UGE协同管理平台</h1>
        <p>大学-政府-中小学三方协同管理</p>
      </div>
      
      <a-tabs v-model:activeKey="activeTab" centered>
        <a-tab-pane key="login" tab="登录"></a-tab-pane>
        <a-tab-pane key="register" tab="注册"></a-tab-pane>
      </a-tabs>
      
      <a-form
        :model="formState"
        :name="activeTab"
        @finish="onFinish"
        class="form"
      >
        <a-form-item
          name="phone"
          :rules="[{ required: true, message: '请输入手机号' }]"
        >
          <a-input v-model:value="formState.phone" placeholder="手机号" size="large">
            <template #prefix>
              <MobileOutlined />
            </template>
          </a-input>
        </a-form-item>

        <!-- 密码输入框 -->
        <a-form-item
          name="password"
          :rules="[{ required: true, message: '请输入密码' }, { min: 6, message: '密码长度不能少于6位' }]"
        >
          <a-input-password v-model:value="formState.password" placeholder="密码" size="large" />
        </a-form-item>

        <a-form-item
          v-if="activeTab === 'register'"
          name="name"
          :rules="[{ required: true, message: '请输入姓名' }]"
        >
          <a-input v-model:value="formState.name" placeholder="姓名" size="large" />
        </a-form-item>

        <a-form-item
          v-if="activeTab === 'register'"
          name="organization"
          :rules="[{ required: true, message: '请输入单位名称' }]"
        >
          <a-input v-model:value="formState.organization" placeholder="单位/学校名称" size="large" />
        </a-form-item>

        <!-- 只在注册时显示角色选择 -->
        <a-form-item
          v-if="activeTab === 'register'"
          name="role"
          :rules="[{ required: true, message: '请选择角色' }]"
        >
          <a-select v-model:value="formState.role" placeholder="选择角色" size="large">
            <a-select-option value="university">大学管理员</a-select-option>
            <a-select-option value="government">政府管理员</a-select-option>
            <a-select-option value="school">中小学校管理员</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" size="large" :loading="loading" block>
            {{ activeTab === 'login' ? '登录' : '注册' }}
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { MobileOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { supabase } from '../lib/supabaseClient.js'

const router = useRouter()
const loading = ref(false)
const activeTab = ref('login')

const formState = reactive({
    phone: '',
    password: '',
    role: '',
    name: '',
    organization: ''
  })

const onFinish = async (values) => {
  loading.value = true
  try {
    if (activeTab.value === 'login') {
      // 登录逻辑改为使用密码验证，无需用户选择角色
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${formState.phone}@example.com`,
        password: values.password
      })

      if (error) throw error
      
      // 查询用户角色信息
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('phone_number', formState.phone)
        .single()
      
      message.success('登录成功')
      router.push(`/${profile.role}`)
    } else if (activeTab.value === 'register') {
      // 注册逻辑改为使用密码验证，角色仍由用户选择
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: `${formState.phone}@example.com`,
        password: values.password,
        options: {
          data: {
            phone_number: formState.phone,
          }
        }
      })

      if (authError) throw authError

      // 保存用户信息到user_profiles表
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          phone_number: formState.phone,
          name: formState.name,
          organization: formState.organization,
          role: values.role
        })

      if (profileError) throw profileError

      message.success('注册成功')
      formState.password = '' // 清空密码
      activeTab.value = 'login' // 切换到登录标签页
    }
  } catch (error) {
    message.error(error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  color: #1890ff;
  margin-bottom: 8px;
  font-size: 24px;
}

.login-header p {
  color: #666;
  font-size: 14px;
}

.form {
  width: 100%;
}
</style>