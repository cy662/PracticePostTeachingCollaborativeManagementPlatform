const { Client } = require('pg');

async function fixDatabase() {
  console.log('开始修复数据库...');
  
  const client = new Client({
    host: 'localhost',
    port: 54322, // 使用默认的PostgreSQL端口
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('数据库连接成功');

    // 检查表是否存在
    const checkTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_profiles', 'admin_management');
    `;
    
    const result = await client.query(checkTablesQuery);
    const existingTables = result.rows.map(row => row.table_name);
    
    console.log('现有表:', existingTables);

    // 如果表不存在，创建它们
    if (!existingTables.includes('user_profiles')) {
      console.log('创建 user_profiles 表...');
      await client.query(`
        CREATE TABLE user_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          phone_number TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          organization TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('super_admin', 'university', 'government', 'school')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
      `);
    }

    if (!existingTables.includes('admin_management')) {
      console.log('创建 admin_management 表...');
      await client.query(`
        CREATE TABLE admin_management (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          admin_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
          managed_by UUID NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('university', 'government', 'school')),
          status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          created_by UUID NOT NULL
        );
      `);
    }

    // 插入演示数据
    console.log('插入演示数据...');
    await client.query(`
      INSERT INTO user_profiles (id, phone_number, name, organization, role) VALUES
      ('demo-super-admin-1', '13800138000', '超级管理员', '平台管理部', 'super_admin'),
      ('demo-university-1', '13800138001', '张老师', '清华大学', 'university'),
      ('demo-government-1', '13800138002', '李主任', '教育部', 'government'),
      ('demo-school-1', '13800138003', '王校长', '北京市第一中学', 'school')
      ON CONFLICT (phone_number) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO admin_management (admin_id, managed_by, role, status, created_by) VALUES
      ('demo-university-1', 'demo-super-admin-1', 'university', 'active', 'demo-super-admin-1'),
      ('demo-government-1', 'demo-super-admin-1', 'government', 'active', 'demo-super-admin-1'),
      ('demo-school-1', 'demo-super-admin-1', 'school', 'active', 'demo-super-admin-1')
      ON CONFLICT (admin_id) DO NOTHING;
    `);

    console.log('数据库修复完成！');

  } catch (error) {
    console.error('数据库修复失败:', error.message);
    console.log('尝试使用SQL文件直接执行...');
    
    // 如果直接连接失败，尝试使用supabase CLI
    const { execSync } = require('child_process');
    try {
      execSync('cd "d:\\lyc123\\poject\\PracticePostTeachingCollaborativeManagementPlatform" && supabase db push', { stdio: 'inherit' });
      console.log('数据库推送成功！');
    } catch (pushError) {
      console.error('数据库推送失败:', pushError.message);
    }
  } finally {
    await client.end();
  }
}

// 运行修复
fixDatabase();