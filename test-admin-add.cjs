const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'http://127.0.0.1:54322';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAddAdmin() {
  try {
    console.log('测试添加管理员功能...');
    
    // 1. 检查手机号是否已存在
    const testPhone = '13800138099';
    const { data: existingUsers } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone_number', testPhone);
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('手机号已存在，跳过测试');
      return;
    }
    
    console.log('手机号可用，继续测试');
    
    // 2. 创建用户档案
    const userData = {
      phone_number: testPhone,
      name: '测试管理员',
      organization: '测试机构',
      role: 'school',
      require_password_change: true
    };
    
    // 使用简单的MD5哈希
    const crypto = require('crypto');
    userData.password_hash = crypto.createHash('md5').update('admin123456').digest('hex');
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert(userData)
      .select()
      .single();
    
    if (profileError) {
      console.log('创建用户档案失败:', profileError);
      return;
    }
    
    console.log('用户档案创建成功:', profileData.id);
    
    // 3. 获取超级管理员ID
    const { data: superAdmin } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone_number', '13800138000')
      .single();
    
    if (!superAdmin) {
      console.log('找不到超级管理员信息');
      return;
    }
    
    // 4. 添加到管理员管理表
    const { error: managementError } = await supabase
      .from('admin_management')
      .insert({
        admin_id: profileData.id,
        managed_by: superAdmin.id,
        role: 'school',
        status: 'active',
        created_by: superAdmin.id
      });
    
    if (managementError) {
      console.log('添加到管理员管理表失败:', managementError);
      
      // 删除已创建的用户档案
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', profileData.id);
      
      return;
    }
    
    console.log('管理员添加成功！');
    
    // 5. 验证添加结果
    const { data: verifyData } = await supabase
      .from('admin_management')
      .select('*')
      .eq('admin_id', profileData.id);
    
    console.log('验证结果:', verifyData);
    
  } catch (err) {
    console.log('测试过程中出错:', err);
  }
}

testAddAdmin();