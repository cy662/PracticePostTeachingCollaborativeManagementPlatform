// 修复admin_management表的角色约束
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54322';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminConstraint() {
  console.log('=== 修复admin_management表角色约束 ===');
  
  try {
    // 删除现有的约束
    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE admin_management DROP CONSTRAINT IF EXISTS admin_management_role_check;'
    });
    
    if (dropError) {
      console.error('❌ 删除约束失败:', dropError.message);
      return;
    }
    
    console.log('✅ 删除旧约束成功');
    
    // 添加新的约束，允许super_admin角色
    const { error: addError } = await supabase.rpc('execute_sql', {
      sql: `ALTER TABLE admin_management 
            ADD CONSTRAINT admin_management_role_check 
            CHECK (role = ANY (ARRAY['super_admin', 'university', 'government', 'school']));`
    });
    
    if (addError) {
      console.error('❌ 添加新约束失败:', addError.message);
      return;
    }
    
    console.log('✅ 添加新约束成功');
    
    // 现在添加超级管理员记录
    console.log('\n=== 添加超级管理员记录 ===');
    
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
    
    // 添加超级管理员管理记录
    const { data: newAdmin, error: insertError } = await supabase
      .from('admin_management')
      .insert([{
        admin_id: superAdmin.id,
        managed_by: superAdmin.id,
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
    
  } catch (error) {
    console.error('❌ 修复过程中出现异常:', error.message);
  }
}

fixAdminConstraint();