// 检查用户档案数据
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54322';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('=== 检查用户档案数据 ===');
  
  // 检查user_profiles表数据
  const { data: users, error: userError } = await supabase
    .from('user_profiles')
    .select('*');
  
  if (userError) {
    console.error('❌ 查询用户档案失败:', userError.message);
    return;
  }
  
  console.log('✅ 用户档案数据:');
  console.log('找到 ' + users.length + ' 条记录');
  users.forEach(user => {
    console.log('  - ID: ' + user.id + ', 手机号: ' + user.phone_number + ', 姓名: ' + user.name + ', 角色: ' + user.role);
  });
  
  // 检查admin_management表数据
  console.log('\n=== 检查管理员数据 ===');
  const { data: admins, error: adminError } = await supabase
    .from('admin_management')
    .select('*');
  
  if (adminError) {
    console.error('❌ 查询管理员失败:', adminError.message);
    return;
  }
  
  console.log('✅ 管理员数据:');
  console.log('找到 ' + admins.length + ' 条记录');
  admins.forEach(admin => {
    console.log('  - ID: ' + admin.id + ', 管理员ID: ' + admin.admin_id + ', 角色: ' + admin.role);
  });
}

checkData();