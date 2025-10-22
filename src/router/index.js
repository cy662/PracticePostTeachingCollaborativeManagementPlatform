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
      {
        path: 'reports',
        name: 'GovernmentReports',
        component: () => import('../views/government/ReportCenter.vue')
      }
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

// 路由守卫
router.beforeEach(async (to, from, next) => {
  try {
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
        next(`/${profile.role}`)
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
    else {
      next()
    }
  } catch (error) {
    console.error('路由守卫错误:', error)
    // 如果 Supabase 连接失败，直接跳转到登录页
    if (to.path !== '/login') {
      next('/login')
    } else {
      next()
    }
  }
})

export default router