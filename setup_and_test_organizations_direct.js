// 直接设置organizations表并测试添加机构功能
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 使用正确的Supabase配置
const SUPABASE_URL = 'http://127.0.0.1:54322';
const SUPABASE_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  }
});

// 生成测试机构数据
function generateOrganizationData(type, index) {
  const typeNames = {
    university: '大学',
    government: '政府',
    school: '学校'
  };
  
  return {
    name: `测试${typeNames[type]}_${index}_${Date.now()}`,
    type: type,
    code: `${type.toUpperCase()}${index}${Math.floor(Math.random() * 1000)}`,
    contact_person: `${typeNames[type]}联系人${index}`,
    contact_phone: `13800138${Math.floor(Math.random() * 1000)}`,
    email: `${type}_test${index}@example.com`,
    address: `${typeNames[type]}测试地址${index}`,
    description: `这是一个测试${typeNames[type]}类型的机构描述`,
    created_by: '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc' // 固定的创建者ID
  };
}

// 检查表是否存在
async function checkTableExists() {
  try {
    console.log('检查organizations表是否存在...');
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'organizations');
    
    if (error) {
      console.error('检查表存在性失败:', error.message);
      return false;
    }
    
    const exists = data && data.length > 0;
    console.log(`organizations表 ${exists ? '已存在' : '不存在'}`);
    return exists;
  } catch (err) {
    console.error('检查表时发生错误:', err);
    return false;
  }
}

// 创建表（如果不存在）
async function createOrganizationsTable() {
  try {
    console.log('正在创建organizations表...');
    
    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, 'supabase', 'organizations_schema_safe.sql');
    console.log(`使用SQL文件: ${sqlFilePath}`);
    
    console.log('\n⚠️  请按照以下步骤操作:');
    console.log('1. 打开Supabase Dashboard (http://127.0.0.1:54323)');
    console.log('2. 进入SQL编辑器');
    console.log('3. 复制organizations_schema_safe.sql文件中的内容并执行');
    console.log('4. 确保在执行前修改SQL，添加以下语句来禁用RLS:');
    console.log('   ALTER TABLE IF EXISTS public.organizations DISABLE ROW LEVEL SECURITY;');
    console.log('5. 执行后检查organizations表是否创建成功\n');
    
    // 提供手动执行说明
    console.log('请手动执行上述操作后，按回车键继续...');
    
    // 由于我们不能直接执行阻塞等待，这里给用户足够时间来手动操作
    setTimeout(async () => {
      console.log('继续测试...');
      await testAddingOrganizations();
    }, 5000); // 5秒后继续
    
  } catch (err) {
    console.error('创建表时发生错误:', err);
  }
}

// 测试添加机构
async function testAddingOrganizations() {
  console.log('=== 开始测试添加机构功能 ===');
  
  // 测试三种类型的机构
  const organizationTypes = ['university', 'government', 'school'];
  let successCount = 0;
  
  for (const type of organizationTypes) {
    for (let i = 1; i <= 2; i++) { // 每种类型添加2个测试数据
      try {
        const orgData = generateOrganizationData(type, i);
        console.log(`\n尝试添加${type}类型机构 #${i}: ${orgData.name}`);
        
        const { data, error } = await supabase
          .from('organizations')
          .insert([orgData])
          .select();
        
        if (error) {
          console.error(`❌ 添加失败:`, error.message);
          if (error.code === '42501') {
            console.error('   错误原因: RLS策略限制，请确保已禁用RLS');
            console.error('   解决方法: 在Supabase Dashboard中执行:');
            console.error('   ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;');
          }
        } else {
          console.log(`✅ 添加成功! 机构ID: ${data[0].id}`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ 操作异常:`, err.message);
      }
    }
  }
  
  // 查询所有机构
  await queryAllOrganizations();
  
  console.log(`\n=== 测试完成 ===`);
  console.log(`成功添加: ${successCount} 个机构`);
}

// 查询所有机构
async function queryAllOrganizations() {
  try {
    console.log('\n查询所有机构...');
    const { data, error, count } = await supabase
      .from('organizations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ 查询失败:', error.message);
    } else {
      console.log(`✅ 查询成功，共 ${count || data.length} 个机构`);
      
      // 按类型统计
      const typeStats = data.reduce((acc, org) => {
        acc[org.type] = (acc[org.type] || 0) + 1;
        return acc;
      }, {});
      console.log('按类型统计:', typeStats);
      
      // 显示前5个机构
      if (data.length > 0) {
        console.log('\n最近添加的5个机构:');
        data.slice(0, 5).forEach((org, index) => {
          console.log(`${index + 1}. ${org.name} (${org.type}) - ${org.code}`);
        });
      }
    }
  } catch (err) {
    console.error('查询时发生错误:', err);
  }
}

// 主函数
async function main() {
  console.log('=== 开始设置organizations表和测试添加机构功能 ===');
  
  // 检查Supabase连接
  try {
    console.log(`连接到Supabase: ${SUPABASE_URL}`);
    
    // 测试基本连接
    const { data, error } = await supabase.from('information_schema.tables').select('table_name').limit(1);
    if (error) {
      console.error('❌ 连接失败:', error.message);
      console.log('请确保Supabase服务正在运行');
      return;
    }
    console.log('✅ 连接成功');
    
    // 检查表是否存在
    const tableExists = await checkTableExists();
    
    if (!tableExists) {
      await createOrganizationsTable();
    } else {
      // 表已存在，直接测试添加
      console.log('\norganizations表已存在，直接测试添加功能');
      await testAddingOrganizations();
    }
  } catch (err) {
    console.error('❌ 运行时错误:', err);
  }
}

// 运行主函数
main();