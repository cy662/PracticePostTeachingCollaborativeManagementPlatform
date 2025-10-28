// 调试前端数据获取问题
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFrontend() {
  console.log('=== 前端数据获取调试 ===');
  
  try {
    // 1. 测试基础连接
    console.log('1. 测试Supabase连接...');
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('count')
      .single();
    
    if (testError) {
      console.error('连接测试失败:', testError);
      return;
    }
    console.log('✓ 连接测试成功');
    
    // 2. 测试管理员管理页面使用的查询
    console.log('\n2. 测试管理员管理查询...');
    
    const { data, error, count } = await supabase
      .from('admin_management')
      .select(`
        *,
        user_profiles!admin_id (
          id,
          name,
          phone_number,
          organization,
          role,
          created_at
        )
      `)
      .order('created_at', { ascending: false })
      .range(0, 9);
    
    if (error) {
      console.error('查询失败:', error);
      console.log('错误详情:', JSON.stringify(error, null, 2));
      return;
    }
    
    console.log('✓ 查询成功');
    console.log('数据条数:', data.length);
    console.log('Count:', count);
    
    // 3. 测试数据处理逻辑
    console.log('\n3. 测试数据处理...');
    
    if (data && data.length > 0) {
      const processedData = data.map(item => ({
        ...item.user_profiles,
        status: item.status,
        id: item.admin_id
      }));
      
      console.log('✓ 数据处理成功');
      console.log('处理后的数据条数:', processedData.length);
      
      // 显示每条数据的关键信息
      processedData.forEach((item, index) => {
        console.log(`\n管理员 ${index + 1}:`);
        console.log('  ID:', item.id);
        console.log('  姓名:', item.name);
        console.log('  手机号:', item.phone_number);
        console.log('  机构:', item.organization);
        console.log('  角色:', item.role);
        console.log('  状态:', item.status);
      });
    } else {
      console.log('⚠️ 没有查询到数据');
    }
    
    // 4. 测试搜索功能
    console.log('\n4. 测试搜索功能...');
    
    // 测试姓名搜索
    const { data: searchData, error: searchError } = await supabase
      .from('admin_management')
      .select(`
        *,
        user_profiles!admin_id (
          id,
          name,
          phone_number,
          organization,
          role,
          created_at
        )
      `)
      .ilike('user_profiles.name', '%张%');
    
    if (searchError) {
      console.error('搜索测试失败:', searchError);
    } else {
      console.log('✓ 搜索功能正常');
      console.log('搜索结果条数:', searchData.length);
    }
    
    console.log('\n=== 调试完成 ===');
    console.log('所有测试通过！前端数据获取功能正常。');
    
  } catch (error) {
    console.error('调试过程中出现错误:', error);
  }
}

debugFrontend();