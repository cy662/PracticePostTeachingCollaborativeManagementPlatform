import { createClient } from '@supabase/supabase-js';

// 数据库配置，与supabaseClient.js保持一致
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

// 测试数据库连接和查询
async function testDatabaseConnection() {
  console.log('开始测试数据库连接...');
  
  try {
    // 测试连接
    const { data, error } = await supabase
      .from('teaching_demands')
      .select('*')
      .limit(5);
      
    if (error) {
      console.error('数据库查询失败:', error);
      return;
    }
    
    console.log('查询成功！获取到的数据条数:', data.length);
    
    if (data.length > 0) {
      console.log('\n数据样例（前3条）:');
      data.slice(0, 3).forEach((item, index) => {
        console.log(`\n第${index + 1}条记录:`);
        console.log(`ID: ${item.id}`);
        console.log(`科目: ${item.subject}`);
        console.log(`年级: ${item.grade}`);
        console.log(`需求人数: ${item.demand_count}`);
        console.log(`状态: ${item.status}`);
        console.log(`组织: ${item.organization}`);
        console.log(`创建时间: ${item.created_at}`);
      });
      
      // 按组织ID查询
      console.log('\n按组织ID 2 查询需求:');
      const { data: orgData, error: orgError } = await supabase
        .from('teaching_demands')
        .select('*')
        .eq('organization', '2');
        
      if (orgError) {
        console.error('按组织查询失败:', orgError);
      } else {
        console.log(`组织ID 2 的需求数量: ${orgData.length}`);
        
        // 按状态分组统计
        const statusCount = {};
        orgData.forEach(item => {
          statusCount[item.status] = (statusCount[item.status] || 0) + 1;
        });
        console.log('各状态需求数量:', statusCount);
      }
      
      // 尝试插入一条测试数据
      console.log('\n尝试插入一条测试草稿需求...');
      const { data: insertData, error: insertError } = await supabase
        .from('teaching_demands')
        .insert([{
          subject: '测试科目',
          grade: '测试年级',
          demand_count: 1,
          duration: '1',
          urgency: 'medium',
          special_requirements: '测试需求',
          contact: '测试联系人',
          status: 'draft',
          organization: '2',
          created_by: '7b6323c7-9ed9-41c7-b052-db1fbae1c72b'
        }]);
        
      if (insertError) {
        console.error('插入测试数据失败:', insertError);
      } else {
        console.log('插入测试数据成功:', insertData);
      }
    }
    
  } catch (err) {
    console.error('测试过程中发生错误:', err);
  }
}

// 运行测试
testDatabaseConnection();