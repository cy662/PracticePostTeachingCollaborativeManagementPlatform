import { createClient } from '@supabase/supabase-js';

// 使用与前端相同的Supabase配置
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseAccess() {
  try {
    console.log('开始测试数据库连接...');
    
    // 测试查询
    console.log('测试查询teaching_demands表...');
    const { data: demands, error: demandsError } = await supabase
      .from('teaching_demands')
      .select('*')
      .limit(5);
    
    if (demandsError) {
      console.error('查询teaching_demands表失败:', demandsError.message);
      console.log('错误代码:', demandsError.code);
    } else {
      console.log(`成功获取${demands.length}条教学需求记录`);
    }
    
    console.log('\n测试查询position_student_assignments表...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('position_student_assignments')
      .select('*')
      .limit(5);
    
    if (assignmentsError) {
      console.error('查询position_student_assignments表失败:', assignmentsError.message);
      console.log('错误代码:', assignmentsError.code);
    } else {
      console.log(`成功获取${assignments.length}条学生分配记录`);
    }
    
    console.log('\n===== 手动禁用RLS步骤 =====');
    console.log('1. 确保Supabase本地开发服务器正在运行');
    console.log('2. 打开浏览器访问 http://127.0.0.1:54323 (Supabase Studio)');
    console.log('3. 登录（默认不需要密码）');
    console.log('4. 点击左侧菜单中的"Table Editor"');
    console.log('5. 选择需要禁用RLS的表（teaching_demands, position_student_assignments等）');
    console.log('6. 点击右上角的"RLS"按钮');
    console.log('7. 关闭"Enable Row Level Security"开关');
    console.log('8. 对所有相关表重复上述操作');
    console.log('===========================');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }
}

// 执行测试
testDatabaseAccess();