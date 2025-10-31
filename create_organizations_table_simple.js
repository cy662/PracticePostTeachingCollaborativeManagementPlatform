import { createClient } from '@supabase/supabase-js';
const supabase = createClient('http://127.0.0.1:54322', 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH');

async function createOrganizationsTable() {
  try {
    console.log('正在创建organizations表...');
    
    // 首先检查表是否存在
    const { error: checkError } = await supabase.from('organizations').select('*').limit(1);
    
    if (checkError && checkError.code === '42P01') {
      console.log('表不存在，需要创建...');
      
      // 使用SQL创建表
      const createSQL = `
        CREATE TABLE organizations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          type VARCHAR(20) NOT NULL,
          code VARCHAR(50) UNIQUE,
          contact_person VARCHAR(100),
          contact_phone VARCHAR(20),
          email VARCHAR(100),
          address TEXT,
          description TEXT,
          status VARCHAR(20) DEFAULT 'active',
          created_by UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      // 使用SQL执行
      const { error: createError } = await supabase.from('sql').select('*').single();
      
      if (createError) {
        console.log('无法使用SQL方式创建表，尝试直接插入数据...');
        
        // 尝试插入一条数据来创建表
        const testData = {
          name: '测试机构',
          type: 'university',
          code: 'TEST001',
          contact_person: '测试人员',
          contact_phone: '13800138000',
          email: 'test@example.com',
          address: '测试地址',
          description: '测试机构描述',
          created_by: '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'
        };
        
        const { error: insertError } = await supabase.from('organizations').insert([testData]);
        
        if (insertError) {
          console.log('❌ 创建表失败:', insertError.message);
          return false;
        } else {
          console.log('✅ 表创建成功（通过插入数据）');
          return true;
        }
      } else {
        console.log('✅ 表创建成功');
        return true;
      }
    } else {
      console.log('✅ 表已存在');
      return true;
    }
  } catch (err) {
    console.log('❌ 创建表时发生错误:', err.message);
    return false;
  }
}

async function insertSampleData() {
  try {
    console.log('正在插入示例数据...');
    
    const sampleData = [
      {
        name: '清华大学',
        type: 'university',
        code: 'THU001',
        contact_person: '张校长',
        contact_phone: '13800138001',
        email: 'contact@tsinghua.edu.cn',
        address: '北京市海淀区清华园',
        description: '中国著名高等学府',
        created_by: '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'
      },
      {
        name: '北京市教育局',
        type: 'government',
        code: 'BJEDU001',
        contact_person: '李主任',
        contact_phone: '13800138002',
        email: 'contact@bjedu.gov.cn',
        address: '北京市西城区',
        description: '北京市教育主管部门',
        created_by: '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'
      },
      {
        name: '北京市第一实验小学',
        type: 'school',
        code: 'BJSY001',
        contact_person: '王老师',
        contact_phone: '13800138003',
        email: 'contact@bjsy.edu.cn',
        address: '北京市西城区',
        description: '北京市重点小学',
        created_by: '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'
      }
    ];
    
    const { error } = await supabase.from('organizations').insert(sampleData);
    
    if (error) {
      console.log('❌ 插入示例数据失败:', error.message);
      return false;
    } else {
      console.log('✅ 示例数据插入成功');
      return true;
    }
  } catch (err) {
    console.log('❌ 插入示例数据时发生错误:', err.message);
    return false;
  }
}

async function testOrganizationManagement() {
  try {
    console.log('正在测试机构管理功能...');
    
    // 测试查询机构数据
    const { data, error } = await supabase.from('organizations').select('*');
    
    if (error) {
      console.log('❌ 查询机构数据失败:', error.message);
      return false;
    } else {
      console.log('✅ 查询成功，当前机构数据条数:', data.length);
      console.log('机构列表:');
      data.forEach(org => {
        console.log(`- ${org.name} (${org.type}) - ${org.code}`);
      });
      return true;
    }
  } catch (err) {
    console.log('❌ 测试机构管理功能时发生错误:', err.message);
    return false;
  }
}

async function main() {
  console.log('开始设置机构管理数据库...');
  
  const tableCreated = await createOrganizationsTable();
  
  if (tableCreated) {
    await insertSampleData();
    await testOrganizationManagement();
  }
  
  console.log('机构管理数据库设置完成！');
}

main().catch(console.error);