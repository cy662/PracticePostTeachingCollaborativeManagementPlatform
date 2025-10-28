const { supabase } = require('./src/lib/supabaseClient.js');

async function testAdminAdd() {
  console.log('=== 测试管理员添加功能 ===');
  
  // 1. 检查表结构
  console.log('\n1. 检查表结构...');
  
  // 检查 user_profiles 表
  const { data: userProfiles, error: userError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(3);
  
  if (userError) {
    console.error('user_profiles 表查询错误:', userError);
  } else {
    console.log('user_profiles 表结构:', Object.keys(userProfiles[0] || {}));
    console.log('现有用户数量:', userProfiles.length);
  }
  
  // 检查 admin_management 表
  const { data: adminManagement, error: adminError } = await supabase
    .from('admin_management')
    .select('*')
    .limit(3);
  
  if (adminError) {
    console.error('admin_management 表查询错误:', adminError);
  } else {
    console.log('admin_management 表结构:', Object.keys(adminManagement[0] || {}));
    console.log('现有管理员数量:', adminManagement.length);
  }
  
  // 2. 测试添加管理员
  console.log('\n2. 测试添加管理员...');
  
  const testPhone = '13800138001';
  
  // 检查手机号是否已存在
  const { data: existingUsers } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('phone_number', testPhone);
  
  if (existingUsers && existingUsers.length > 0) {
    console.log('手机号已存在，删除现有记录...');
    // 删除现有记录
    await supabase.from('admin_management').delete().eq('admin_id', existingUsers[0].id);
    await supabase.from('user_profiles').delete().eq('id', existingUsers[0].id);
  }
  
  // 获取超级管理员ID
  const { data: superAdmin } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('phone_number', '13800138000')
    .single();
  
  if (!superAdmin) {
    console.error('找不到超级管理员');
    return;
  }
  
  console.log('超级管理员ID:', superAdmin.id);
  
  // 创建用户档案
  const userData = {
    phone_number: testPhone,
    name: '测试管理员',
    organization: '测试机构',
    role: 'university',
    require_password_change: true
  };
  
  // 简单的密码哈希函数
  function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  userData.password_hash = hashPassword('123456');
  
  console.log('创建用户档案...');
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .insert(userData)
    .select()
    .single();
  
  if (profileError) {
    console.error('创建用户档案失败:', profileError);
    return;
  }
  
  console.log('用户档案创建成功，ID:', profileData.id);
  
  // 添加到管理员管理表
  const managementData = {
    admin_id: profileData.id,
    managed_by: superAdmin.id,
    role: 'university',
    status: 'active',
    created_by: superAdmin.id
  };
  
  console.log('添加到管理员管理表...');
  const { error: managementError } = await supabase
    .from('admin_management')
    .insert(managementData);
  
  if (managementError) {
    console.error('添加到管理员管理表失败:', managementError);
    // 回滚：删除用户档案
    await supabase.from('user_profiles').delete().eq('id', profileData.id);
    return;
  }
  
  console.log('管理员添加成功!');
  
  // 验证添加结果
  console.log('\n3. 验证添加结果...');
  const { data: verifyData } = await supabase
    .from('admin_management')
    .select(`
      *,
      user_profiles!admin_id (
        name,
        phone_number,
        organization,
        role
      )
    `)
    .eq('admin_id', profileData.id)
    .single();
  
  if (verifyData) {
    console.log('验证成功:', verifyData.user_profiles);
  } else {
    console.log('验证失败: 未找到添加的管理员');
  }
}

testAdminAdd().catch(console.error);