import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('测试Supabase连接...');
    
    // 测试查询user_profiles表
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (userError) {
      console.error('查询user_profiles失败:', userError);
    } else {
      console.log('user_profiles表数据:', users);
    }
    
    // 测试查询admin_management表
    const { data: admins, error: adminError } = await supabase
      .from('admin_management')
      .select('*');
    
    if (adminError) {
      console.error('查询admin_management失败:', adminError);
    } else {
      console.log('admin_management表数据:', admins);
    }
    
  } catch (error) {
    console.error('测试连接失败:', error);
  }
}

testConnection();