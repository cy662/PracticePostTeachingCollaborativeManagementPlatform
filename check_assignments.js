// 检查学生分配表数据
import { createClient } from '@supabase/supabase-js';

// 使用项目中的实际Supabase配置
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAssignments() {
  console.log('=== 检查position_student_assignments表数据 ===');
  try {
    const { data, error } = await supabase.from('position_student_assignments').select('*');
    if (error) throw error;
    
    console.log('学生分配记录总数:', data.length);
    console.log('\n数据样本（前5条）:');
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
    
    // 分析数据结构
    if (data.length > 0) {
      console.log('\n表字段:', Object.keys(data[0]));
      
      // 统计唯一学生数量
      const studentIds = new Set();
      const positionIds = new Set();
      
      data.forEach(assignment => {
        if (assignment.student_id) {
          studentIds.add(assignment.student_id);
        }
        if (assignment.position_id) {
          positionIds.add(assignment.position_id);
        }
      });
      
      console.log('\n唯一学生数量:', studentIds.size);
      console.log('唯一岗位数量:', positionIds.size);
      console.log('\n学生ID列表:', Array.from(studentIds));
    }
    
  } catch (error) {
    console.error('查询position_student_assignments表时出错:', error.message);
    
    // 尝试检查是否有其他可能的分配表
    console.log('\n=== 检查其他可能的学生分配表 ===');
    const possibleTables = ['student_assignments', 'position_assignments'];
    
    for (const table of possibleTables) {
      try {
        console.log(`\n检查${table}表:`);
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw error;
        console.log(`${table}表记录数:`, data.length);
        if (data.length > 0) {
          console.log(`${table}表字段:`, Object.keys(data[0]));
          console.log(`${table}表数据样本:`, JSON.stringify(data[0], null, 2));
        }
      } catch (err) {
        console.log(`${table}表不存在或查询失败:`, err.message);
      }
    }
  }
}

checkAssignments();