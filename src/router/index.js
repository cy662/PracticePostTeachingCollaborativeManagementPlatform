import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabaseClient.js'

const routes = [
  {
    path: '/',
    redirect: '/login',
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  // 超级管理员路由
  {
    path: '/super-admin',
    component: () => import('../layouts/SuperAdminLayout.vue'),
    meta: { requiresAuth: true, role: 'super_admin' },
    children: [
      {
        path: 'dashboard',
        name: 'SuperAdminDashboard',
        component: () => import('../views/super-admin/Dashboard.vue')
      },
      {
        path: 'admin-management',
        name: 'AdminManagement',
        component: () => import('../views/super-admin/AdminManagement.vue')
      },
      {
        path: 'statistics',
        name: 'AdminStatistics',
        component: () => import('../views/super-admin/Statistics.vue')
      }
    ]
  },
  // 大学管理员路由
  {
    path: '/university',
    component: () => import('../layouts/UniversityLayout.vue'),
    meta: { requiresAuth: true, role: 'university' },
    children: [
      {
        path: 'students',
        name: 'UniversityStudents',
        component: () => import('../views/university/StudentManagement.vue')
      },
      {
        path: 'positions',
        name: 'UniversityPositions',
        component: () => import('../views/university/PositionManagement.vue')
      },
      {
        path: 'monitoring',
        name: 'UniversityMonitoring',
        component: () => import('../views/university/MonitoringCenter.vue')
      }
    ]
  },
  // 政府管理员路由
  {
    path: '/government',
    component: () => import('../layouts/GovernmentLayout.vue'),
    meta: { requiresAuth: true, role: 'government' },
    children: [
      {
        path: 'demands',
        name: 'GovernmentDemands',
        component: () => import('../views/government/DemandManagement.vue')
      },
      {
        path: 'overview',
        name: 'GovernmentOverview',
        component: () => import('../views/government/ProjectOverview.vue')
      },

    ]
  },
  // 中小学校管理员路由
  {
    path: '/school',
    component: () => import('../layouts/SchoolLayout.vue'),
    meta: { requiresAuth: true, role: 'school' },
    children: [
      {
        path: 'demand-application',
        name: 'SchoolDemandApplication',
        component: () => import('../views/school/DemandApplication.vue')
      },
      {
        path: 'teacher-management',
        name: 'SchoolTeacherManagement',
        component: () => import('../views/school/TeacherManagement.vue')
      },
      {
        path: 'evaluation',
        name: 'SchoolEvaluation',
        component: () => import('../views/school/EvaluationCenter.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 定义角色默认路由映射
const roleDefaultRoutes = {
  'super_admin': '/super-admin/dashboard',
  'university': '/university/students',
  'government': '/government/demands',
  'school': '/school/demand-application'
}

// 路由守卫
router.beforeEach(async (to, from, next) => {
  try {
    // 检查演示模式
    const demoMode = localStorage.getItem('demo_mode') === 'true'
    const demoRole = localStorage.getItem('demo_role')
    
    // 演示模式处理
    if (demoMode) {
      // 演示模式下访问需要认证的页面
      if (to.meta.requiresAuth) {
        // 检查角色权限
        if (to.meta.role && to.meta.role !== demoRole) {
          // 角色不匹配，跳转到对应角色的首页
          next(roleDefaultRoutes[demoRole] || `/${demoRole}`)
        } else {
          next()
        }
      }
      // 演示模式下访问登录页，跳转到对应角色首页
      else if (to.path === '/login') {
        next(roleDefaultRoutes[demoRole] || `/${demoRole}`)
      }
      else {
        next()
      }
      return
    }
    
    // 检查本地存储的用户信息（新登录方式）
    const currentUser = localStorage.getItem('current_user')
    const userRole = localStorage.getItem('user_role')
    
    // 新登录方式处理（基于本地存储）
    if (currentUser && userRole) {
      // 已登录但访问登录页
      if (to.path === '/login') {
        next(roleDefaultRoutes[userRole] || `/${userRole}`)
      }
      // 检查角色权限
      else if (to.meta.role && to.meta.role !== userRole) {
        // 角色不匹配，跳转到对应角色的首页
        next(roleDefaultRoutes[userRole] || `/${userRole}`)
      }
      // 需要认证但已登录
      else if (to.meta.requiresAuth) {
        next()
      }
      else {
        next()
      }
      return
    }
    
    // 传统 Supabase 认证模式（备用）
    const { data: { user } } = await supabase.auth.getUser()
    
    // 需要认证但未登录
    if (to.meta.requiresAuth && !user) {
      next('/login')
    } 
    // 已登录但访问登录页
    else if (to.path === '/login' && user) {
      // 获取用户角色并跳转到对应首页
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        
      if (profile) {
        next(roleDefaultRoutes[profile.role] || `/${profile.role}`)
      } else {
        next('/login')
      }
    }
    // 检查角色权限
    else if (to.meta.role && user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        
      if (profile?.role === to.meta.role) {
        next()
      } else {
        next('/login')
      }
    }
    // 访问登录页面且未登录，直接允许访问
    else if (to.path === '/login') {
      next()
    }
    else {
      next()
    }
  } catch (error) {
    console.error('路由守卫错误:', error)
    
    // 如果认证失败，检查是否为演示模式或本地存储登录
    const demoMode = localStorage.getItem('demo_mode') === 'true'
    const demoRole = localStorage.getItem('demo_role')
    const currentUser = localStorage.getItem('current_user')
    const userRole = localStorage.getItem('user_role')
    
    if (demoMode && to.path !== '/login') {
      // 演示模式下允许访问
      next()
    } else if (currentUser && userRole && to.path !== '/login') {
      // 本地存储登录模式下允许访问
      next()
    } else if (to.path !== '/login') {
      next('/login')
    } else {
      next()
    }
  }
})


export default router