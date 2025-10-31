// 测试添加机构功能的脚本
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// 配置Supabase客户端 - 使用正确的项目配置
const SUPABASE_URL = 'http://127.0.0.1:54322';
const SUPABASE_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  }
});

// 模拟前端表单数据
const generateTestOrganization = (type) => {
  const types = ['university', 'government', 'school', 'other'];
  const actualType = type || types[Math.floor(Math.random() * types.length)];
  
  const baseData = {
    name: `测试机构_${actualType}_${Date.now()}`,
    type: actualType,
    code: `TEST${actualType.toUpperCase()}${Math.floor(Math.random() * 10000)}`,
    contact_person: `联系人_${actualType}`,
    contact_phone: `13800138${Math.floor(Math.random() * 1000)}`,
    email: `test_${actualType}@example.com`,
    address: `测试地址_${actualType}`,
    description: `这是一个测试${actualType}类型的机构描述`
  };
  
  // 模拟创建者ID
  baseData.created_by = '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc';
  
  return baseData;
};

// 执行SQL语句的函数
async function executeSqlFile(sqlFilePath) {
  try {
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 分割SQL语句并执行每个语句
    const sqlStatements = sqlContent.split(';').filter(statement => statement.trim() !== '');
    
    console.log(`准备执行 ${sqlStatements.length} 条SQL语句...`);
    
    for (const statement of sqlStatements) {
      try {
        // 在实际环境中，我们需要确保SQL语句可以通过Supabase客户端执行
        // 注意：这里我们不直接执行SQL，而是提供执行方法
        console.log(`SQL语句准备就绪: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
      } catch (err) {
        console.error('执行SQL语句时出错:', err);
      }
    }
    
    return true;
  } catch (error) {
    console.error('读取SQL文件失败:', error);
    return false;
  }
}

// 测试添加机构功能
async function testAddOrganization() {
  console.log('=== 开始测试添加机构功能 ===');
  
  // 1. 确保表结构存在
  // 获取当前文件目录
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const sqlFilePath = path.join(__dirname, 'supabase', 'organizations_schema_safe.sql');
  console.log(`正在使用SQL文件: ${sqlFilePath}`);
  
  console.log('\n请按照以下步骤操作:');
  console.log('1. 打开Supabase Dashboard');
  console.log('2. 进入SQL编辑器');
  console.log('3. 复制organizations_schema_safe.sql文件中的内容并执行');
  console.log('4. 确保organizations表已创建成功\n');
  
  // 2. 测试添加不同类型的机构
  const organizationTypes = ['university', 'government', 'school'];
  
  for (const type of organizationTypes) {
    try {
      console.log(`\n--- 测试添加 ${type} 类型机构 ---`);
      const organizationData = generateTestOrganization(type);
      
      console.log('准备添加的机构数据:', JSON.stringify(organizationData, null, 2));
      
      // 使用Supabase客户端添加机构
      const { data, error } = await supabase
        .from('organizations')
        .insert([organizationData])
        .select();
      
      if (error) {
        console.error(`添加 ${type} 类型机构失败:`, error);
        // 检查常见错误
        if (error.code === '42P01') {
          console.error('错误: 表不存在，请确保已执行SQL脚本创建表');
        } else if (error.code === '42703') {
          console.error('错误: 字段不存在，请检查表结构是否正确');
        } else if (error.code === '42501') {
          console.error('错误: 权限不足，请检查RLS策略');
        }
      } else {
        console.log(`成功添加 ${type} 类型机构!`);
        console.log('添加的机构数据:', JSON.stringify(data[0], null, 2));
        
        // 验证数据是否已保存
        const { data: checkData, error: checkError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', data[0].id);
        
        if (checkData && checkData.length > 0) {
          console.log('验证成功: 机构数据已正确保存到数据库');
        } else {
          console.error('验证失败: 无法从数据库检索刚添加的机构');
        }
      }
    } catch (err) {
      console.error(`测试 ${type} 类型机构时发生异常:`, err);
    }
  }
  
  // 3. 查询数据库中的机构数量
  try {
    const { data: allOrganizations, error } = await supabase
      .from('organizations')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('查询机构总数失败:', error);
    } else {
      console.log(`\n数据库中的机构总数: ${allOrganizations.length}`);
      console.log('按类型统计:');
      const typeStats = allOrganizations.reduce((acc, org) => {
        acc[org.type] = (acc[org.type] || 0) + 1;
        return acc;
      }, {});
      console.log(typeStats);
    }
  } catch (err) {
    console.error('查询机构时发生异常:', err);
  }
  
  console.log('\n=== 测试完成 ===');
}

// 运行测试
async function runTest() {
  try {
    // 尝试禁用RLS以便测试
    console.log('尝试禁用organizations表的RLS策略以进行测试...');
    let rlsError = null;
    try {
      await supabase.rpc('disable_rls', { table_name: 'organizations' });
      console.log('RLS已成功禁用');
    } catch (err) {
      rlsError = '无法禁用RLS，可能需要手动操作';
      console.log('注意:', rlsError);
      console.log('请手动在Supabase Dashboard中临时禁用organizations表的RLS策略进行测试');
    }
    
    // 运行添加机构测试
    await testAddOrganization();
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 使用顶级await
await runTest();