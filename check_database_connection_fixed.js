import { createClient } from '@supabase/supabase-js';

// 使用当前运行的Supabase配置
const supabaseUrl = 'http://127.0.0.1:54322';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseConnection() {
  console.log('=== 数据库连接检查 ===');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Supabase Key: ${supabaseKey.substring(0, 20)}...`);
  
  try {
    // 测试基本连接 - 直接测试业务表
    console.log('\n1. 测试基本连接...');
    const { data: testData, error: testError } = await supabase
      .from('teaching_demands')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ 基本连接失败:', testError.message);
      console.log('错误代码:', testError.code);
      
      if (testError.code === 'PGRST301') {
        console.log('⚠️  错误类型: 认证失败 - 检查API密钥');
      } else if (testError.code === 'PGRST204') {
        console.log('⚠️  错误类型: 表不存在');
      } else if (testError.code === '42501') {
        console.log('⚠️  错误类型: RLS权限错误 - 需要禁用行级安全');
      }
      
      return;
    }
    
    console.log('✅ 基本连接成功');
    
    // 测试主要业务表
    console.log('\n2. 测试业务表访问...');
    
    const tablesToTest = [
      'teaching_demands',
      'position_student_assignments', 
      'user_profiles',
      'admin_management'
    ];
    
    for (const tableName of tablesToTest) {
      console.log(`\n测试表: ${tableName}`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ ${tableName} 表访问失败:`, error.message);
        if (error.code === '42501') {
          console.log('⚠️  可能需要禁用RLS (Row Level Security)');
        }
      } else {
        console.log(`✅ ${tableName} 表访问成功`);
        console.log(`   记录数量: ${data.length}`);
      }
    }
    
    // 测试数据操作
    console.log('\n3. 测试数据操作...');
    
    // 测试查询teaching_demands表
    const { data: demands, error: demandsError } = await supabase
      .from('teaching_demands')
      .select('*')
      .limit(3);
    
    if (demandsError) {
      console.error('❌ 查询teaching_demands失败:', demandsError.message);
    } else {
      console.log('✅ teaching_demands查询成功');
      if (demands.length > 0) {
        console.log('   数据样例:');
        demands.forEach((demand, index) => {
          console.log(`   ${index + 1}. ID: ${demand.id}, 科目: ${demand.subject}, 状态: ${demand.status}`);
        });
      }
    }
    
    console.log('\n=== 数据库连接检查完成 ===');
    console.log('\n建议:');
    console.log('1. 如果遇到RLS错误，请运行: node disable_rls.js');
    console.log('2. 如果需要重新初始化数据，请运行: node insert_test_data.js');
    console.log('3. 访问Supabase Studio: http://127.0.0.1:54323');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.log('错误详情:', error);
  }
}

// 执行检查
checkDatabaseConnection();