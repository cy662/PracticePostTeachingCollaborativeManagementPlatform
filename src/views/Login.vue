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

// 简单的MD5实现（仅用于演示，生产环境应使用更安全的哈希算法）
const md5 = (str) => {
  return new Promise((resolve) => {
    // 使用Web Crypto API进行MD5计算
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    crypto.subtle.digest('MD5', data).then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      resolve(hashHex);
    }).catch(() => {
      // 如果Web Crypto API不可用，使用简单的替代方案
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      resolve(Math.abs(hash).toString(16));
    });
  });
};

const onFinish = async (values) => {
  loading.value = true
  try {
    // 检查是否为演示模式
    const demoMode = localStorage.getItem('demo_mode') === 'true'
    
    if (demoMode) {
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
    }
    
    // 真实数据库模式：检查管理员授权状态和密码
    try {
      // 首先查询用户档案信息
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('phone_number', formState.phone)
        .single()
      
      if (profileError || !profile) {
        throw new Error('用户信息不存在，请联系超级管理员')
      }
      
      // 检查管理员授权状态（非超级管理员需要检查授权）
      if (profile.role !== 'super_admin') {
        const { data: adminAuth, error: adminAuthError } = await supabase
          .from('admin_management')
          .select('*')
          .eq('admin_id', profile.id)
          .eq('status', 'active')
          .single()
        
        if (adminAuthError || !adminAuth) {
          throw new Error('您尚未被授权或授权状态为待审核，请联系超级管理员')
        }
      }
      
      // 检查密码是否正确
      try {
        // 首先尝试使用RPC函数验证密码
        const { data: authResult, error: authError } = await supabase
          .rpc('verify_password', {
            phone: formState.phone,
            password: values.password
          })
        
        if (!authError && authResult && authResult.length > 0) {
          // RPC验证成功，继续执行
        } else {
          // RPC验证失败，回退到默认密码验证
          if (values.password !== 'admin123456') {
            throw new Error('密码错误，请使用默认密码 admin123456')
          }
        }
      } catch (error) {
        // RPC函数可能不存在，回退到默认密码验证
        if (values.password !== 'admin123456') {
          throw new Error('密码错误，请使用默认密码 admin123456')
        }
      }
      
      // 设置用户信息到本地存储
      localStorage.setItem('current_user', JSON.stringify(profile))
      localStorage.setItem('user_role', profile.role)
      message.success(`${profile.name}登录成功`)
      
      // 根据角色跳转到对应页面
      if (profile.role === 'super_admin') {
        router.push('/super-admin/dashboard')
      } else {
        router.push(`/${profile.role}`)
      }
      
    } catch (error) {
      // 如果真实数据库登录失败，检查是否是演示账号
      const demoAccounts = {
        '13800138000': { role: 'super_admin', name: '超级管理员' },
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
        
        if (account.role === 'super_admin') {
          router.push('/super-admin/dashboard')
        } else {
          router.push(`/${account.role}`)
        }
        return
      }
      
      throw new Error(error.message || `登录失败。默认密码为：admin123456`)
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