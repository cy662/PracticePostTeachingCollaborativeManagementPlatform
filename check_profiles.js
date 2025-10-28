// 检查user_profiles表数据
import { createClient } from '@supabase/supabase-js';

// 使用项目中的实际Supabase配置
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkUserProfiles() {
  console.log('=== 检查user_profiles表数据 ===');
  try {
    const { data, error } = await supabase.from('user_profiles').select('*');
    if (error) throw error;
    
    console.log('用户档案总数:', data.length);
    console.log('\n数据样本（前5条）:');
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
    
    // 分析角色分布
    const roleCounts = {};
    data.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });
    
    console.log('\n角色分布:');
    console.log(roleCounts);
    
    // 查找教师和大学用户
    const teachers = data.filter(user => 
      user.role === 'teacher' || user.role === 'university'
    );
    
    console.log('\n教师和大学用户数量:', teachers.length);
    if (teachers.length > 0) {
      console.log('教师/大学用户样本:');
      console.log(JSON.stringify(teachers.slice(0, 3), null, 2));
    }
    
  } catch (error) {
    console.error('查询user_profiles表时出错:', error.message);
  }
}

checkUserProfiles();