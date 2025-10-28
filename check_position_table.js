import { createClient } from '@supabase/supabase-js';

// 配置Supabase客户端
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPositionTable() {
  console.log('=== 检查position_student_assignments表 ===');
  
  // 直接查询表数据
  console.log('\n查询表数据:');
  try {
    const { data, error, status } = await supabase
      .from('position_student_assignments')
      .select('*')
      .limit(10);
    
    console.log('查询状态:', status);
    if (error) {
      console.log('查询错误:', error);
    } else {
      console.log('查询结果:', data);
      console.log('记录数量:', data ? data.length : 0);
    }
  } catch (err) {
    console.log('捕获到错误:', err);
  }
  
  // 检查是否可以访问表
  console.log('\n检查表是否存在:');
  try {
    // 尝试获取表的一行数据，不关心实际内容
    const { error } = await supabase
      .from('position_student_assignments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('表访问错误:', error);
    } else {
      console.log('表可以正常访问');
    }
  } catch (err) {
    console.log('表访问异常:', err);
  }
  
  // 检查teaching_demands表和position_student_assignments表的连接
  console.log('\n检查教学需求与学生分配的关联:');
  try {
    const { data, error } = await supabase
      .from('teaching_demands')
      .select('id, subject');
    
    if (error) {
      console.log('教学需求查询错误:', error);
    } else {
      console.log('教学需求记录:', data);
      console.log('\n尝试为每个教学需求查找对应的学生分配:');
      
      for (const demand of data) {
        const { data: assignments, error: assignError } = await supabase
          .from('position_student_assignments')
          .select('*')
          .eq('position_id', demand.id);
        
        console.log(`\n需求ID ${demand.id} (${demand.subject}) 的分配情况:`);
        if (assignError) {
          console.log('分配查询错误:', assignError);
        } else {
          console.log('分配记录:', assignments);
          console.log('分配数量:', assignments ? assignments.length : 0);
        }
      }
    }
  } catch (err) {
    console.log('关联查询异常:', err);
  }
}

checkPositionTable();