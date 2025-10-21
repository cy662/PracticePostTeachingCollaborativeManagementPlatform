<template>
  <div class="login-container">
    <div class="login-form">
      <div class="login-header">
        <h1>顶岗支教UGE协同管理平台</h1>
        <p>大学-政府-中小学三方协同管理</p>
      </div>
      
      <a-form
        :model="formState"
        name="login"
        @finish="onFinish"
        class="form"
      >
        <a-form-item
          name="username"
          :rules="[{ required: true, message: '请输入用户名' }]"
        >
          <a-input v-model:value="formState.username" placeholder="用户名" size="large">
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item
          name="password"
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <a-input-password v-model:value="formState.password" placeholder="密码" size="large">
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item
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
            登录
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const router = useRouter()
const loading = ref(false)

const formState = reactive({
  username: '',
  password: '',
  role: ''
})

const onFinish = async (values) => {
  loading.value = true
  try {
    // 模拟登录逻辑
    localStorage.setItem('token', 'demo-token')
    localStorage.setItem('userRole', values.role)
    localStorage.setItem('username', values.username)
    
    message.success('登录成功')
    
    // 根据角色跳转到对应页面
    setTimeout(() => {
      router.push(`/${values.role}`)
    }, 1000)
  } catch (error) {
    message.error('登录失败，请检查用户名和密码')
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