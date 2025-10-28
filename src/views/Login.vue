<template>
  <div class="login-container">
    <div class="login-form">
      <div class="login-header">
        <h1>顶岗支教UGE协同管理平台</h1>
        <p>大学-政府-中小学三方协同管理</p>
        <p class="login-tip">演示账号：超级管理员 13800138000/admin123456</p>
        <p class="login-tip" style="color: #1890ff; font-weight: 500;">
          当前模式：演示模式（数据不保存）
          <a-button type="link" @click="switchToRealMode" style="padding: 0; height: auto;">
            切换到真实数据库模式
          </a-button>
        </p>
      </div>
      
      <a-form
        :model="formState"
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
import { MobileOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { supabase } from '../lib/supabaseClient.js'

const router = useRouter()
const loading = ref(false)

const formState = reactive({
    phone: '',
    password: ''
  })

// 切换到真实数据库模式
const switchToRealMode = () => {
  localStorage.removeItem('demo_mode')
  localStorage.removeItem('demo_role')
  localStorage.removeItem('demo_user')
  message.info('已切换到真实数据库模式，请重新登录')
  // 刷新页面
  window.location.reload()
}

const onFinish = async (values) => {
  loading.value = true
  try {
    // 演示模式：直接模拟登录
    // 检查是否为超级管理员演示账号
    if (formState.phone === '13800138000' && values.password === 'admin123456') {
      // 超级管理员演示 - 设置演示模式标识
      localStorage.setItem('demo_mode', 'true')
      localStorage.setItem('demo_role', 'super_admin')
      localStorage.setItem('demo_user', JSON.stringify({
        phone: '13800138000',
        name: '超级管理员',
        role: 'super_admin'
      }))
      message.success('超级管理员登录成功（演示模式）')
      router.push('/super-admin/dashboard')
      return
    }
    
    // 其他角色演示
    const demoAccounts = {
      '13800138001': { role: 'university', name: '大学管理员' },
      '13800138002': { role: 'government', name: '政府管理员' },
      '13800138003': { role: 'school', name: '学校管理员' }
    }
    
    if (demoAccounts[formState.phone] && values.password === 'admin123456') {
      const account = demoAccounts[formState.phone]
      // 设置演示模式标识
      localStorage.setItem('demo_mode', 'true')
      localStorage.setItem('demo_role', account.role)
      localStorage.setItem('demo_user', JSON.stringify({
        phone: formState.phone,
        name: account.name,
        role: account.role
      }))
      message.success(`${account.name}登录成功（演示模式）`)
      router.push(`/${account.role}`)
      return
    }
    
    // 真实Supabase认证（备用）
    try {
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
      
      if (!profile) {
        throw new Error('用户信息不存在，请联系超级管理员')
      }
      
      message.success('登录成功')
      
      // 根据角色跳转到对应页面
      if (profile.role === 'super_admin') {
        router.push('/super-admin/dashboard')
      } else {
        router.push(`/${profile.role}`)
      }
      
    } catch (supabaseError) {
      // Supabase认证失败，提示演示账号信息
      throw new Error(`认证失败。演示账号：
超级管理员：13800138000/123456
大学管理员：13800138001/123456
政府管理员：13800138002/123456
学校管理员：13800138003/123456`)
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
  margin-bottom: 4px;
}

.login-header .login-tip {
  color: #ff4d4f;
  font-size: 12px;
  font-weight: 500;
  margin-top: 8px;
}

.form {
  width: 100%;
}
</style>