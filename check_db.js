// 检查数据库结构和数据的脚本
import { createClient } from '@supabase/supabase-js';

// 使用项目中的实际Supabase配置
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 检查teaching_demands表的详细数据
async function checkTeachingDemands() {
  console.log('=== 检查teaching_demands表数据 ===');
  try {
    const { data, error } = await supabase.from('teaching_demands').select('*');
    if (error) throw error;
    
    console.log('教学需求总数:', data.length);
    console.log('\n数据样本（前5条）:');
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
    
    // 分析状态分布
    const statusCounts = {};
    const organizations = {};
    
    data.forEach(item => {
      // 统计状态
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      
      // 统计组织
      if (item.organization) {
        organizations[item.organization] = (organizations[item.organization] || 0) + 1;
      }
    });
    
    console.log('\n状态分布:');
    console.log(statusCounts);
    
    console.log('\n学校/组织分布:');
    console.log(organizations);
    
    return { data, statusCounts, organizations };
  } catch (error) {
    console.error('查询teaching_demands表时出错:', error.message);
    return null;
  }
}

// 检查其他可能包含教师数据的表
async function checkTeacherTables() {
  console.log('\n=== 检查可能包含教师数据的表 ===');
  
  // 检查positions表
  try {
    console.log('\n检查positions表:');
    const { data: positionsData, error: positionsError } = await supabase.from('positions').select('*');
    if (positionsError) throw positionsError;
    console.log('positions表记录数:', positionsData.length);
    if (positionsData.length > 0) {
      console.log('positions表字段:', Object.keys(positionsData[0]));
    }
  } catch (error) {
    console.error('查询positions表时出错:', error.message);
  }
  
  // 检查users表
  try {
    console.log('\n检查users表:');
    const { data: usersData, error: usersError } = await supabase.from('users').select('*');
    if (usersError) throw usersError;
    console.log('users表记录数:', usersData.length);
    if (usersData.length > 0) {
      console.log('users表字段:', Object.keys(usersData[0]));
      
      // 分析用户角色
      const roleCounts = {};
      usersData.forEach(user => {
        roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
      });
      console.log('用户角色分布:', roleCounts);
    }
  } catch (error) {
    console.error('查询users表时出错:', error.message);
  }
  
  // 检查其他可能的表
  const possibleTables = ['teacher_assignments', 'personnel', 'staff'];
  for (const table of possibleTables) {
    try {
      console.log(`\n检查${table}表:`);
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      console.log(`${table}表记录数:`, data.length);
    } catch (error) {
      console.log(`${table}表不存在或查询失败:`, error.message);
    }
  }
}

// 运行检查
async function runChecks() {
  try {
    console.log('开始检查数据库结构和数据...');
    await checkTeachingDemands();
    await checkTeacherTables();
    console.log('\n数据库检查完成！');
  } catch (error) {
    console.error('检查过程中出错:', error.message);
  }
}

runChecks();