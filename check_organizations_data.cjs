const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 尝试从项目中读取supabaseClient.js以获取连接信息
let supabaseUrl = 'http://127.0.0.1:54322'; // 直接设置为文件中的值
let supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'; // 直接设置为文件中的值

// 确保URL格式正确，如果缺少尾部斜杠则添加
if (supabaseUrl && !supabaseUrl.endsWith('/')) {
  supabaseUrl += '/';
}

console.log('使用的Supabase URL:', supabaseUrl);
console.log('使用的Supabase Key:', supabaseKey.substring(0, 10) + '...');

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 检查organizations表
async function checkOrganizationsTable() {
  console.log('开始检查organizations表...');
  console.log('使用的Supabase URL:', supabaseUrl);
  
  try {
    // 直接查询organizations表数据
    console.log('\n1. 查询organizations表中的数据...');
    const { data: organizations, error: dataError } = await supabase
      .from('organizations')
      .select('*')
      .limit(20);
    
    if (dataError) {
      console.error('查询数据失败:', dataError.message);
    } else {
      console.log(`找到 ${organizations.length} 条机构数据:`);
      
      if (organizations.length > 0) {
        console.log('详细数据:');
        organizations.forEach((org, index) => {
          console.log(`\n机构 ${index + 1}:`);
          Object.entries(org).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
        });
        
        // 检查是否有名为name和code的字段
        const firstOrg = organizations[0];
        const hasNameField = 'name' in firstOrg;
        const hasCodeField = 'code' in firstOrg;
        
        console.log('\n4. 字段检查:');
        console.log(`  - 包含name字段: ${hasNameField ? '✓ 是' : '✗ 否'}`);
        console.log(`  - 包含code字段: ${hasCodeField ? '✓ 是' : '✗ 否'}`);
        
        if (!hasNameField || !hasCodeField) {
          console.log('\n警告: organizations表缺少必要的字段(name或code)');
          console.log('请确保表中包含name和code字段，这是前端显示机构名称必需的');
        }
      } else {
        console.log('警告: organizations表中没有数据');
        console.log('建议: 请向organizations表中插入一些机构数据');
      }
    }
    
    // 如果表中没有数据，提供插入示例
    if (organizations.length === 0) {
      console.log('\n5. 数据插入示例:');
      console.log(`
可以使用以下SQL插入示例数据:
INSERT INTO organizations (name, code, type) VALUES 
('清华大学', 'THU001', 'university'),
('北京大学', 'PKU001', 'university'),
('北京市教育局', 'BJEDU001', 'government'),
('北京市第一中学', 'BJSY001', 'school');`);
    }
    
  } catch (error) {
    console.error('检查过程中发生错误:', error.message);
    console.log('\n可能的原因:');
    console.log('1. Supabase连接信息不正确');
    console.log('2. 数据库权限问题');
    console.log('3. 网络连接问题');
  }
}

// 执行检查
checkOrganizationsTable();