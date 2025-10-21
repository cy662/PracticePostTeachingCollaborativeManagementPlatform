# 顶岗支教UGE协同管理平台

基于Vue 3 + TypeScript + Ant Design Vue构建的顶岗支教协同管理平台前端项目。

## 项目概述

本项目旨在构建一个数字化的"大学-政府-中小学"(UGE)协同平台，对顶岗支教全过程进行系统化、精细化管理。

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI组件库**: Ant Design Vue
- **路由管理**: Vue Router 4
- **状态管理**: Pinia
- **构建工具**: Vite
- **开发语言**: JavaScript/TypeScript

## 功能模块

### 1. 大学管理员功能
- 学生信息管理
- 岗位分配管理
- 支教过程监控
- 考核成绩审核

### 2. 政府管理员功能
- 需求审核发布
- 项目总览监控
- 数据分析报告
- 区域资源统筹

### 3. 中小学校管理员功能
- 师资需求申报
- 支教教师管理
- 教学评价反馈
- 校内管理协调

## 项目结构

```
src/
├── layouts/          # 布局组件
├── views/           # 页面组件
│   ├── university/  # 大学管理员页面
│   ├── government/  # 政府管理员页面
│   └── school/      # 中小学校页面
├── router/          # 路由配置
└── main.js          # 应用入口
```

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 开发说明

1. 项目采用响应式设计，支持多种屏幕尺寸
2. 组件化开发，便于维护和扩展
3. 遵循Ant Design设计规范
4. 支持TypeScript类型检查

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 许可证

MIT License