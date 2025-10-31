// 测试机构数据库操作脚本
// 用于验证RLS关闭后是否能正常访问和操作organizations表

import { supabase } from './src/lib/supabaseClient.js';
import { organizationService } from './src/api/organizationService.js';

async function testOrganizationDatabase() {
  console.log('=== 开始测试机构数据库操作 ===');
  
  try {
    // 1. 检查表是否存在
    console.log('\n1. 检查表是否存在...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('警告: 无法直接查询information_schema，尝试直接操作organizations表');
    } else {
      console.log('发现的表:', tables.map(t => t.table_name));
    }
    
    // 2. 检查organizations表是否存在并可访问
    console.log('\n2. 测试organizations表访问...');
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(5);
    
    if (orgError) {
      console.error('❌ 访问organizations表失败:', orgError.message);
      console.log('尝试创建organizations表...');
      await createOrganizationsTable();
    } else {
      console.log(`✅ 成功访问organizations表，当前有${organizations.length}条记录`);
    }
    
    // 3. 测试使用organizationService添加机构
    console.log('\n3. 测试使用服务添加机构...');
    const testOrg = {
      name: '测试机构-' + Date.now(),
      code: 'TEST' + Math.floor(Math.random() * 10000),
      type: 'school',
      contact_person: '测试联系人',
      contact_phone: '13800138000',
      description: '这是一个测试机构',
      created_by: 'system' // 临时创建者ID
    };
    
    try {
      const result = await organizationService.addOrganization(testOrg);
      console.log('✅ 成功添加测试机构:', result.name, 'ID:', result.id);
      
      // 4. 测试查询机构列表
      console.log('\n4. 测试查询机构列表...');
      const { data, totalCount } = await organizationService.getOrganizations();
      console.log(`✅ 成功获取机构列表，共${totalCount}条记录`);
      console.log('前5条记录:', data.slice(0, 5));
      
    } catch (serviceError) {
      console.error('❌ 使用服务添加机构失败:', serviceError.message);
      console.log('尝试直接使用Supabase客户端添加...');
      await directInsertTest();
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
  
  console.log('\n=== 测试结束 ===');
}

async function createOrganizationsTable() {
  try {
    // 创建简化版的organizations表（不使用枚举类型以避免权限问题）
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS organizations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          type VARCHAR(50) NOT NULL,
          code VARCHAR(50) UNIQUE,
          contact_person VARCHAR(100),
          contact_phone VARCHAR(20),
          email VARCHAR(100),
          address TEXT,
          description TEXT,
          status VARCHAR(20) DEFAULT 'active',
          created_by VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- 确保RLS关闭
        ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
      `
    });
    
    if (error) {
      console.error('❌ 创建表失败:', error.message);
    } else {
      console.log('✅ 成功创建organizations表并禁用RLS');
    }
  } catch (err) {
    console.error('❌ RPC执行失败:', err.message);
    // 尝试使用另一种方式
    try {
      const { error } = await supabase
        .from('organizations')
        .insert([{
          name: '初始化机构',
          type: 'school',
          code: 'INIT',
          created_by: 'system'
        }]);
      if (!error) {
        console.log('✅ organizations表已存在且可写');
      }
    } catch (innerErr) {
      console.error('❌ 无法创建或访问表:', innerErr.message);
    }
  }
}

async function directInsertTest() {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert([{
        name: '直接插入测试机构',
        type: 'school',
        code: 'DIRECT' + Math.floor(Math.random() * 10000),
        created_by: 'system'
      }])
      .select();
    
    if (error) {
      console.error('❌ 直接插入失败:', error.message);
    } else {
      console.log('✅ 直接插入成功:', data[0].name);
    }
  } catch (err) {
    console.error('❌ 直接操作失败:', err.message);
  }
}

// 运行测试
testOrganizationDatabase();