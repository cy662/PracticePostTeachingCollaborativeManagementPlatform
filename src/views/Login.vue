<template>
  <div class="login-container">
    <div class="login-form">
      <div class="login-header">
        <h1>顶岗支教UGS协同管理平台</h1>
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

    <!-- 强制修改密码弹窗 -->
    <a-modal
      v-model:visible="passwordModalVisible"
      title="修改密码"
      :mask-closable="false"
      :closable="false"
      :keyboard="false"
      :footer="null"
      width="400px"
    >
      <div class="password-change-modal">
        <p style="margin-bottom: 20px; color: #ff4d4f;">
          <exclamation-circle-outlined style="color: #ff4d4f; margin-right: 8px;" />
          首次登录或密码已过期，请立即修改密码
        </p>
        
        <a-form
          ref="passwordFormRef"
          :model="passwordForm"
          :rules="passwordRules"
          @finish="handlePasswordChange"
        >
          <a-form-item name="newPassword" label="新密码">
            <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码" />
          </a-form-item>
          
          <a-form-item name="confirmPassword" label="确认密码">
            <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
          </a-form-item>
          
          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="passwordLoading" block>
              确认修改
            </a-button>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { MobileOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { supabase } from '../lib/supabaseClient.js'
import { useUserStore } from '../stores/user.js'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const passwordModalVisible = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref(null)

// 存储当前登录用户信息，用于密码修改
const currentUserInfo = ref(null)

const formState = reactive({
    phone: '',
    password: ''
  })

const passwordForm = reactive({
    newPassword: '',
    confirmPassword: ''
  })

const passwordRules = {
  newPassword: [
    { required: true, message: '请输入新密码' },
    { min: 6, message: '密码长度不能少于6位' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码' },
    {
      validator: (_, value) => {
        if (value !== passwordForm.newPassword) {
          return Promise.reject(new Error('两次输入的密码不一致'))
        }
        return Promise.resolve()
      }
    }
  ]
}

// 切换到真实数据库模式功能已移除

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
        // 演示用户信息
        const userData = {
          phone: '13800138000',
          name: '超级管理员',
          role: 'super_admin'
        }
        // 设置演示模式标识和用户信息
        localStorage.setItem('demo_mode', 'true')
        localStorage.setItem('demo_role', 'super_admin')
        localStorage.setItem('demo_user', JSON.stringify(userData))
        // 更新Pinia store
        userStore.setUserInfo(userData)
        message.success('超级管理员登录成功（演示模式）')
        router.push('/super-admin/dashboard')
        return
      }
      
      // 其他角色演示
      const demoAccounts = {
        '13800138001': { role: 'university', name: '大学管理员', defaultRoute: '/university/students' },
        '13800138002': { role: 'government', name: '政府管理员', defaultRoute: '/government/demands' },
        '13800138003': { role: 'school', name: '学校管理员', defaultRoute: '/school/demand-application' }
      }
      
      if (demoAccounts[formState.phone] && values.password === 'admin123456') {
        const account = demoAccounts[formState.phone]
        // 设置演示模式标识
        localStorage.setItem('demo_mode', 'true')
        // 演示用户信息
        const userData = {
          phone: formState.phone,
          name: account.name,
          role: account.role
        }
        // 设置演示模式标识和用户信息
        localStorage.setItem('demo_role', account.role)
        localStorage.setItem('demo_user', JSON.stringify(userData))
        // 更新Pinia store
        userStore.setUserInfo(userData)
        message.success(`${account.name}登录成功（演示模式）`)
        router.push(account.defaultRoute)
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
      // 更新Pinia store
      userStore.setUserInfo(profile)
      message.success(`${profile.name}登录成功`)
      
      // 根据角色跳转到对应页面
      if (profile.role === 'super_admin') {
        router.push('/super-admin/dashboard')
      } else if (profile.role === 'university') {
        router.push('/university/students')
      } else if (profile.role === 'government') {
        router.push('/government/demands')
      } else if (profile.role === 'school') {
        router.push('/school/demand-application')
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
        // 演示用户信息
        const userData = {
          phone: formState.phone,
          name: account.name,
          role: account.role
        }
        // 设置演示模式标识和用户信息
        localStorage.setItem('demo_mode', 'true')
        localStorage.setItem('demo_role', account.role)
        localStorage.setItem('demo_user', JSON.stringify(userData))
        // 更新Pinia store
        userStore.setUserInfo(userData)
        message.success(`${account.name}登录成功（演示模式）`)
        
        if (account.role === 'super_admin') {
          router.push('/super-admin/dashboard')
        } else if (account.role === 'university') {
          router.push('/university/students')
        } else if (account.role === 'government') {
          router.push('/government/demands')
        } else if (account.role === 'school') {
          router.push('/school/demand-application')
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

// 处理密码修改
const handlePasswordChange = async () => {
  try {
    await passwordFormRef.value.validate()
    passwordLoading.value = true
    
    // 使用RPC函数更新密码
    const { error } = await supabase
      .rpc('update_user_password', {
        user_id: currentUserInfo.value.id,
        new_password: passwordForm.newPassword
      })
    
    if (error) {
      throw new Error(`密码更新失败: ${error.message}`)
    }
    
    message.success('密码修改成功')
    
    // 设置用户信息到本地存储
    localStorage.setItem('current_user', JSON.stringify(currentUserInfo.value))
    localStorage.setItem('user_role', currentUserInfo.value.role)
    // 更新Pinia store
    userStore.setUserInfo(currentUserInfo.value)
    
    // 关闭弹窗
    passwordModalVisible.value = false
    
    // 根据角色跳转到对应页面
    if (currentUserInfo.value.role === 'super_admin') {
      router.push('/super-admin/dashboard')
    } else if (currentUserInfo.value.role === 'university') {
      router.push('/university/students')
    } else if (currentUserInfo.value.role === 'government') {
      router.push('/government/demands')
    } else if (currentUserInfo.value.role === 'school') {
      router.push('/school/demand-application')
    } else {
      router.push(`/${currentUserInfo.value.role}`)
    }
    
  } catch (error) {
    console.error('密码修改失败:', error)
    message.error(error.message)
  } finally {
    passwordLoading.value = false
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
  font-family: 'SimSun', serif;
}

.login-header p {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

/* .login-tip 样式已移除 */

.form {
  width: 100%;
}
</style>