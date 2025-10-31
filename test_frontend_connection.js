// 测试前端与Supabase的连接
const { createClient } = require('@supabase/supabase-js');

// 使用与前端相同的配置
const supabaseUrl = 'http://127.0.0.1:54322';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendConnection() {
  console.log('=== 前端连接测试 ===');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Supabase Key: ${supabaseKey.substring(0, 20)}...`);
  
  try {
    // 测试基本连接
    console.log('\n1. 测试基本连接...');
    const { data: testData, error: testError } = await supabase
      .from('admin_management')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ 连接失败:', testError.message);
      console.log('错误代码:', testError.code);
      
      if (testError.code === 'PGRST301') {
        console.log('⚠️  错误类型: 认证失败 - 检查API密钥');
      } else if (testError.code === 'PGRST204') {
        console.log('⚠️  错误类型: 表不存在');
      } else if (testError.code === '42501') {
        console.log('⚠️  错误类型: RLS权限错误');
      }
      
      return;
    }
    
    console.log('✅ 基本连接成功');
    
    // 测试管理员表
    console.log('\n2. 测试管理员表访问...');
    const { data: adminData, error: adminError } = await supabase
      .from('admin_management')
      .select('*')
      .limit(5);
    
    if (adminError) {
      console.error('❌ 管理员表访问失败:', adminError.message);
      return;
    }
    
    console.log('✅ 管理员表访问成功');
    console.log(`找到 ${adminData.length} 条管理员记录`);
    
    if (adminData.length > 0) {
      console.log('管理员列表:');
      adminData.forEach(admin => {
        console.log(`  - ${admin.name} (${admin.phone}) - ${admin.role}`);
      });
    }
    
    console.log('\n🎉 前端连接测试完成！所有配置正确。');
    
  } catch (error) {
    console.error('❌ 测试过程中出现异常:', error.message);
  }
}

testFrontendConnection();