// 修复超级管理员记录
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54322';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSuperAdmin() {
  console.log('=== 修复超级管理员记录 ===');
  
  // 获取超级管理员用户ID
  const { data: superAdmin, error: adminError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('role', 'super_admin')
    .single();
  
  if (adminError) {
    console.error('❌ 查询超级管理员失败:', adminError.message);
    return;
  }
  
  console.log('✅ 找到超级管理员 ID:', superAdmin.id);
  
  // 检查是否已存在管理记录
  const { data: existingAdmin, error: checkError } = await supabase
    .from('admin_management')
    .select('*')
    .eq('admin_id', superAdmin.id);
  
  if (checkError) {
    console.error('❌ 检查管理记录失败:', checkError.message);
    return;
  }
  
  if (existingAdmin.length > 0) {
    console.log('✅ 超级管理员管理记录已存在');
    return;
  }
  
  // 添加超级管理员管理记录
  const { data: newAdmin, error: insertError } = await supabase
    .from('admin_management')
    .insert([{
      admin_id: superAdmin.id,
      managed_by: superAdmin.id, // 超级管理员自己管理自己
      role: 'super_admin',
      status: 'active',
      created_by: superAdmin.id
    }])
    .select();
  
  if (insertError) {
    console.error('❌ 添加超级管理员记录失败:', insertError.message);
    return;
  }
  
  console.log('✅ 超级管理员管理记录添加成功');
  console.log('新记录 ID:', newAdmin[0].id);
  
  // 验证修复结果
  console.log('\n=== 验证修复结果 ===');
  const { data: admins, error: verifyError } = await supabase
    .from('admin_management')
    .select('*')
    .eq('role', 'super_admin');
  
  if (verifyError) {
    console.error('❌ 验证失败:', verifyError.message);
    return;
  }
  
  console.log('✅ 超级管理员管理记录验证成功');
  console.log('找到 ' + admins.length + ' 条超级管理员记录');
}

fixSuperAdmin();