import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJoinQuery() {
  try {
    console.log('测试联合查询...');
    
    // 测试管理员管理页面使用的联合查询
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
      console.error('联合查询失败:', error);
    } else {
      console.log('联合查询成功!');
      console.log('数据条数:', data.length);
      console.log('查询结果:', JSON.stringify(data, null, 2));
      
      // 模拟前端数据处理
      const processedData = data.map(item => ({
        ...item.user_profiles,
        status: item.status,
        id: item.admin_id
      }));
      
      console.log('处理后的数据:', JSON.stringify(processedData, null, 2));
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testJoinQuery();