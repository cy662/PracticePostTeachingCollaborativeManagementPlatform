import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
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
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router