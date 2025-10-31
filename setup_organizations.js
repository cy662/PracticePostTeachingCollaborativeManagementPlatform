import { Client } from 'pg';

// 数据库连接配置
const client = new Client({
  host: '127.0.0.1',
  port: 54333,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});

async function setupOrganizations() {
  try {
    console.log('正在连接到数据库...');
    await client.connect();
    
    console.log('✅ 数据库连接成功');
    
    // 创建机构类型枚举
    console.log('正在创建机构类型枚举...');
    await client.query(`
      DO $$ BEGIN
          CREATE TYPE organization_type AS ENUM ('university', 'government', 'school', 'other');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ 机构类型枚举创建成功');
    
    // 创建机构表
    console.log('正在创建机构表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          type organization_type NOT NULL,
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
    `);
    console.log('✅ 机构表创建成功');
    
    // 创建索引
    console.log('正在创建索引...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
      CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
      CREATE INDEX IF NOT EXISTS idx_organizations_code ON organizations(code);
      CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
      CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);
    `);
    console.log('✅ 索引创建成功');
    
    // 创建更新时间触发器
    console.log('正在创建更新时间触发器...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_organizations_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_update_organizations_updated_at ON organizations;
      CREATE TRIGGER trigger_update_organizations_updated_at
          BEFORE UPDATE ON organizations
          FOR EACH ROW
          EXECUTE FUNCTION update_organizations_updated_at();
    `);
    console.log('✅ 触发器创建成功');
    
    // 插入示例数据
    console.log('正在插入示例数据...');
    const result = await client.query(`
      INSERT INTO organizations (name, type, code, contact_person, contact_phone, email, address, description, created_by) VALUES
          ('清华大学', 'university', 'THU001', '张校长', '13800138001', 'contact@tsinghua.edu.cn', '北京市海淀区清华园', '中国著名高等学府', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'),
          ('北京市教育局', 'government', 'BJEDU001', '李主任', '13800138002', 'contact@bjedu.gov.cn', '北京市西城区', '北京市教育主管部门', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'),
          ('北京市第一实验小学', 'school', 'BJSY001', '王老师', '13800138003', 'contact@bjsy.edu.cn', '北京市西城区', '北京市重点小学', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'),
          ('北京大学', 'university', 'PKU001', '刘主任', '13800138004', 'contact@pku.edu.cn', '北京市海淀区', '中国顶尖综合性大学', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'),
          ('上海市教育局', 'government', 'SHEDU001', '陈处长', '13800138005', 'contact@shed.gov.cn', '上海市黄浦区', '上海市教育主管部门', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc')
      ON CONFLICT (code) DO NOTHING;
    `);
    console.log('✅ 示例数据插入成功');
    
    // 验证数据
    console.log('正在验证数据...');
    const countResult = await client.query('SELECT COUNT(*) as total_organizations FROM organizations');
    console.log(`✅ 验证成功，当前机构数据条数: ${countResult.rows[0].total_organizations}`);
    
    // 显示机构列表
    const orgResult = await client.query('SELECT name, type, code FROM organizations ORDER BY created_at');
    console.log('机构列表:');
    orgResult.rows.forEach(org => {
      console.log(`- ${org.name} (${org.type}) - ${org.code}`);
    });
    
    console.log('\n🎉 机构管理数据库设置完成！');
    
  } catch (error) {
    console.error('❌ 设置过程中发生错误:', error.message);
  } finally {
    await client.end();
    console.log('数据库连接已关闭');
  }
}

// 执行设置
setupOrganizations().catch(console.error);