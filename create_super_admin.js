import { createClient } from '@supabase/supabase-js';

// 使用当前运行的Supabase配置
const supabaseUrl = 'http://127.0.0.1:54322';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSuperAdmin() {
  console.log('=== 创建超级管理员账号 ===');
  
  // 超级管理员信息
  const superAdminInfo = {
    phone_number: '13800138000',
    name: '超级管理员',
    organization: '系统管理',
    password: 'admin123456'
  };
  
  console.log(`\n管理员信息：`);
  console.log(`手机号: ${superAdminInfo.phone_number}`);
  console.log(`姓名: ${superAdminInfo.name}`);
  console.log(`组织: ${superAdminInfo.organization}`);
  console.log(`密码: ${superAdminInfo.password}`);
  
  try {
    // 1. 检查是否已存在超级管理员
    console.log('\n1. 检查现有超级管理员...');
    const { data: existingAdmins, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('phone_number', superAdminInfo.phone_number);
    
    if (checkError) {
      console.error('❌ 检查现有管理员失败:', checkError.message);
    } else if (existingAdmins && existingAdmins.length > 0) {
      console.log('⚠️  超级管理员已存在，跳过创建');
      console.log('现有管理员信息:', existingAdmins[0]);
      return;
    }
    
    // 2. 创建超级管理员用户档案
    console.log('\n2. 创建用户档案...');
    
    // 简单的密码哈希函数（与系统一致）
    function hashPassword(password) {
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    }
    
    const userData = {
      phone_number: superAdminInfo.phone_number,
      name: superAdminInfo.name,
      organization: superAdminInfo.organization,
      role: 'super_admin',
      password_hash: hashPassword(superAdminInfo.password),
      require_password_change: false
    };
    
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert(userData)
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ 创建用户档案失败:', profileError);
      
      // 尝试使用数据库函数创建超级管理员
      console.log('\n尝试使用数据库函数创建超级管理员...');
      const { data: functionResult, error: functionError } = await supabase
        .rpc('create_super_admin', {
          phone_number: superAdminInfo.phone_number,
          name: superAdminInfo.name,
          organization: superAdminInfo.organization,
          password: superAdminInfo.password
        });
      
      if (functionError) {
        console.error('❌ 数据库函数调用失败:', functionError);
        return;
      }
      
      console.log('✅ 通过数据库函数创建超级管理员成功');
      console.log('返回的用户ID:', functionResult);
    } else {
      console.log('✅ 用户档案创建成功');
      console.log('用户ID:', profileData.id);
      
      // 3. 添加到管理员管理表
      console.log('\n3. 添加到管理员管理表...');
      
      const managementData = {
        admin_id: profileData.id,
        managed_by: profileData.id, // 超级管理员自己管理自己
        role: 'super_admin',
        status: 'active',
        created_by: profileData.id
      };
      
      const { error: managementError } = await supabase
        .from('admin_management')
        .insert(managementData);
      
      if (managementError) {
        console.error('❌ 添加到管理员管理表失败:', managementError);
        
        // 尝试使用数据库函数
        console.log('\n尝试使用数据库函数添加管理员关系...');
        const { error: addFunctionError } = await supabase
          .rpc('add_super_admin_to_management', {
            admin_id: profileData.id
          });
        
        if (addFunctionError) {
          console.error('❌ 数据库函数调用失败:', addFunctionError);
          // 回滚：删除用户档案
          await supabase.from('user_profiles').delete().eq('id', profileData.id);
          return;
        }
        
        console.log('✅ 通过数据库函数添加管理员关系成功');
      } else {
        console.log('✅ 管理员管理表添加成功');
      }
    }
    
    // 4. 验证创建结果
    console.log('\n4. 验证创建结果...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        admin_management!admin_id (*)
      `)
      .eq('phone号', superAdminInfo.phone_number)
      .single();
    
    if (verifyError) {
      console.error('❌ 验证失败:', verifyError);
    } else {
      console.log('✅ 超级管理员创建成功！');
      console.log('\n登录信息：');
      console.log(`手机号: ${verifyData.phone_number}`);
      console.log(`密码: ${superAdminInfo.password}`);
      console.log(`角色: ${verifyData.role}`);
      console.log(`组织: ${verifyData.organization}`);
      
      if (verifyData.admin_management) {
        console.log(`管理员状态: ${verifyData.admin_management[0].status}`);
      }
    }
    
    console.log('\n=== 超级管理员创建完成 ===');
    console.log('\n重要提示：');
    console.log('1. 请使用手机号 13800138000 和密码 admin123456 登录系统');
    console.log('2. 首次登录后建议修改密码');
    console.log('3. 如需创建其他管理员，请使用此超级管理员账号登录后操作');
    
  } catch (error) {
    console.error('❌ 创建过程中发生错误:', error.message);
    console.log('错误详情:', error);
  }
}

// 执行创建
createSuperAdmin();