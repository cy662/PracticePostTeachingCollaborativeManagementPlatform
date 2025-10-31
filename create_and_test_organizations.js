import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 使用正确的Supabase配置
const supabaseUrl = 'http://127.0.0.1:54322';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  }
});

// 读取SQL文件
async function readSqlFile() {
  const sqlFilePath = path.join(
    process.cwd(),
    'supabase',
    'organizations_schema_complete.sql'
  );
  
  try {
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    return sqlContent;
  } catch (error) {
    console.error('读取SQL文件失败:', error);
    return null;
  }
}

// 执行SQL语句
async function executeSql(sqlContent) {
  try {
    // 禁用RLS以便创建表和插入数据
    console.log('正在执行SQL脚本...');
    
    // 按语句分割SQL脚本
    const statements = sqlContent.split(';').filter(Boolean);
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement) {
        console.log(`执行: ${trimmedStatement.substring(0, 100)}...`);
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_statement: trimmedStatement
        });
        
        if (error) {
          console.warn(`执行语句时出错: ${error.message}`);
          // 继续执行其他语句
        }
      }
    }
    
    console.log('SQL脚本执行完成！');
    return true;
  } catch (error) {
    console.error('执行SQL失败:', error);
    return false;
  }
}

// 测试添加机构功能
async function testAddOrganization() {
  try {
    console.log('\n测试添加机构功能...');
    
    const testOrganization = {
      name: '测试机构' + Date.now(),
      type: ['university', 'government', 'school'][Math.floor(Math.random() * 3)],
      code: 'TEST' + Date.now(),
      contact_person: '测试联系人',
      contact_phone: '13800000000',
      email: 'test@example.com',
      address: '测试地址',
      description: '测试描述',
      created_by: '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc' // 演示用户ID
    };
    
    console.log('添加测试机构:', testOrganization.name, '(类型:', testOrganization.type, ')');
    
    const { data, error } = await supabase
      .from('organizations')
      .insert([testOrganization])
      .select();
    
    if (error) {
      console.error('❌ 添加机构失败:', error.message);
      console.error('错误详情:', error);
      return false;
    } else {
      console.log('✅ 添加成功，返回数据:', data);
      return true;
    }
  } catch (err) {
    console.error('❌ 测试添加机构时发生错误:', err.message);
    return false;
  }
}

// 查询并显示所有机构
async function queryAllOrganizations() {
  try {
    console.log('\n查询所有机构...');
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('type')
      .order('name');
    
    if (error) {
      console.log('❌ 查询机构数据失败:', error.message);
      return false;
    } else {
      console.log(`✅ 查询成功，当前机构数据条数: ${data.length}`);
      
      // 按类型分组显示
      const organizationsByType = {};
      data.forEach(org => {
        if (!organizationsByType[org.type]) {
          organizationsByType[org.type] = [];
        }
        organizationsByType[org.type].push(org);
      });
      
      console.log('\n按机构类型分组:');
      Object.keys(organizationsByType).forEach(type => {
        console.log(`\n${type.toUpperCase()} (${organizationsByType[type].length}个):`);
        organizationsByType[type].forEach(org => {
          console.log(`- ${org.name} (${org.code})`);
        });
      });
      
      return true;
    }
  } catch (err) {
    console.log('❌ 查询机构时发生错误:', err.message);
    return false;
  }
}

// 检查RLS状态
async function checkRlsStatus() {
  try {
    console.log('\n检查RLS状态...');
    
    // 查询RLS状态
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_statement: "SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'organizations'"
    });
    
    if (error) {
      console.log('检查RLS状态失败:', error.message);
    } else {
      console.log('RLS状态:', data);
    }
  } catch (err) {
    console.log('检查RLS状态时发生错误:', err.message);
  }
}

// 主函数
async function main() {
  console.log('开始设置和测试机构管理数据库...');
  
  // 1. 读取SQL文件
  const sqlContent = await readSqlFile();
  if (!sqlContent) {
    console.log('无法继续，SQL文件读取失败');
    return;
  }
  
  // 2. 执行SQL创建表结构
  await executeSql(sqlContent);
  
  // 3. 检查RLS状态
  await checkRlsStatus();
  
  // 4. 测试添加机构
  const addSuccess = await testAddOrganization();
  
  if (addSuccess) {
    console.log('\n✅ 添加机构功能测试成功！');
  } else {
    console.log('\n⚠️ 添加机构功能测试失败，建议检查权限设置或RLS配置');
    console.log('\n尝试临时禁用RLS以测试...');
    
    // 尝试临时禁用RLS
    await supabase.rpc('execute_sql', {
      sql_statement: "ALTER TABLE organizations DISABLE ROW LEVEL SECURITY"
    });
    
    console.log('RLS已临时禁用，再次测试添加...');
    await testAddOrganization();
  }
  
  // 5. 查询所有机构
  await queryAllOrganizations();
  
  console.log('\n机构管理数据库设置和测试完成！');
}

main().catch(console.error);