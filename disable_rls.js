import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 获取Supabase连接信息
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54323';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pZ2ZoZWR0dGh6d29vbW5rZ3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDYzODI0MTIsImV4cCI6MjAyMTk1ODQxMn0.918XJQHwlQl31w8GdX2x7m2v8Uj3f0iZ4Ww7I2q3XFs'; // 默认开发密钥

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function disableRLS() {
  try {
    console.log('开始禁用RLS限制...');
    
    // 禁用各个表的RLS
    const tables = ['teaching_demands', 'position_student_assignments', 'students', 'user_profiles', 'school_demands'];
    
    for (const table of tables) {
      try {
        // 使用rpc执行自定义SQL（在Supabase中，直接执行ALTER TABLE需要PostgreSQL超级用户权限）
        // 注意：这可能需要在Supabase数据库中创建相应的存储过程
        console.log(`尝试禁用${table}表的RLS...`);
        
        // 在实际环境中，这需要在Supabase中预先创建disable_rls存储过程
        const { data, error } = await supabase.rpc('disable_rls', { table_name: table });
        
        if (error) {
          console.error(`${table}表RLS禁用失败:`, error.message);
          console.log(`请在Supabase控制台手动禁用${table}表的RLS`);
        } else {
          console.log(`${table}表RLS禁用成功`);
        }
      } catch (err) {
        console.error(`${table}表操作异常:`, err.message);
        console.log(`请在Supabase控制台手动禁用${table}表的RLS`);
      }
    }
    
    console.log('RLS禁用操作完成。如果遇到权限错误，请登录Supabase控制台手动禁用RLS。');
    console.log('Supabase控制台地址: https://app.supabase.com');
    
  } catch (error) {
    console.error('执行过程中发生错误:', error.message);
    console.log('\n请按照以下步骤手动禁用RLS:');
    console.log('1. 登录Supabase控制台');
    console.log('2. 进入数据库页面');
    console.log('3. 选择相应的表');
    console.log('4. 点击"编辑访问策略"');
    console.log('5. 禁用行级安全性');
  }
}

// 执行函数
disableRLS();