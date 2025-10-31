import { createClient } from '@supabase/supabase-js';

const supabase = createClient('http://127.0.0.1:54322', 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH');

async function createOrganizationsTable() {
  try {
    console.log('正在创建organizations表...');
    
    // 直接尝试插入数据来创建表
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
    
    const { error } = await supabase.from('organizations').insert([testData]);
    
    if (error) {
      console.log('❌ 创建表失败:', error.message);
      
      // 如果插入失败，说明表不存在，需要手动创建
      console.log('尝试使用SQL命令创建表...');
      
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
      
      // 尝试使用SQL执行
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createSQL });
      
      if (sqlError) {
        console.log('❌ SQL命令失败:', sqlError.message);
        
        // 如果SQL命令也失败，尝试使用更简单的方法
        console.log('尝试使用数据库连接工具...');
        
        // 使用pg连接直接创建表
        const { Client } = await import('pg');
        const client = new Client({
          host: '127.0.0.1',
          port: 54322,
          database: 'postgres',
          user: 'postgres',
          password: 'password'
        });
        
        await client.connect();
        await client.query(createSQL);
        await client.end();
        
        console.log('✅ 表创建成功（通过pg连接）');
        return true;
      } else {
        console.log('✅ 表创建成功');
        return true;
      }
    } else {
      console.log('✅ 表已存在，数据插入成功');
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