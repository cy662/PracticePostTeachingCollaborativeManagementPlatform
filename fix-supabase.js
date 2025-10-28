import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSupabase() {
  console.log('开始修复Supabase数据库...');
  
  try {
    // 1. 检查数据库连接
    console.log('检查数据库连接...');
    const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
    
    if (error) {
      console.log('数据库连接错误:', error.message);
      console.log('需要重新启动Supabase服务...');
      return;
    }
    
    console.log('数据库连接正常');
    
    // 2. 检查现有用户
    console.log('检查现有用户...');
    const { data: users } = await supabase.from('user_profiles').select('*');
    console.log('现有用户数量:', users?.length || 0);
    
    // 3. 创建超级管理员账号
    console.log('创建超级管理员账号...');
    
    // 首先创建auth用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: '13800138000@example.com',
      password: 'admin123456'
    });
    
    if (authError) {
      console.log('创建auth用户错误:', authError.message);
      
      // 如果用户已存在，尝试直接登录
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: '13800138000@example.com',
        password: 'admin123456'
      });
      
      if (signInError) {
        console.log('登录错误:', signInError.message);
        return;
      }
      
      console.log('登录成功，用户ID:', signInData.user.id);
      
      // 检查是否已有profile
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('phone_number', '13800138000')
        .single();
      
      if (!existingProfile) {
        // 创建profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            id: signInData.user.id,
            phone_number: '13800138000',
            name: '超级管理员',
            organization: '系统管理',
            role: 'super_admin'
          }]);
        
        if (profileError) {
          console.log('创建profile错误:', profileError.message);
          return;
        }
        
        console.log('超级管理员profile创建成功');
      } else {
        console.log('超级管理员profile已存在');
      }
      
    } else {
      console.log('创建auth用户成功，用户ID:', authData.user.id);
      
      // 创建profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          phone_number: '13800138000',
          name: '超级管理员',
          organization: '系统管理',
          role: 'super_admin'
        }]);
      
      if (profileError) {
        console.log('创建profile错误:', profileError.message);
        return;
      }
      
      console.log('超级管理员账号创建成功');
    }
    
    console.log('修复完成！');
    console.log('超级管理员登录信息：');
    console.log('手机号: 13800138000');
    console.log('密码: admin123456');
    
  } catch (error) {
    console.log('修复过程中出现错误:', error.message);
  }
}

fixSupabase();