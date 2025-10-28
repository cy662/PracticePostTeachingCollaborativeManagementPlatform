import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendQuery() {
  try {
    console.log('模拟前端数据获取...');
    
    // 模拟前端查询（使用修复后的查询逻辑）
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
      console.error('查询错误:', error);
      return;
    }
    
    console.log('查询成功!');
    console.log('原始数据条数:', data.length);
    console.log('Count:', count);
    
    // 模拟前端数据处理
    if (data && data.length > 0) {
      const processedData = data.map(item => ({
        ...item.user_profiles,
        status: item.status,
        id: item.admin_id
      }));
      
      console.log('处理后的数据条数:', processedData.length);
      console.log('处理后的数据:', JSON.stringify(processedData, null, 2));
      
      // 检查每个字段是否正确
      processedData.forEach((item, index) => {
        console.log(`\n第${index + 1}条数据检查:`);
        console.log('ID:', item.id);
        console.log('姓名:', item.name);
        console.log('手机号:', item.phone_number);
        console.log('机构:', item.organization);
        console.log('角色:', item.role);
        console.log('状态:', item.status);
        console.log('创建时间:', item.created_at);
      });
    } else {
      console.log('没有查询到数据');
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testFrontendQuery();