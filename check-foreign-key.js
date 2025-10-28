import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 54322,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
});

async function checkForeignKey() {
  try {
    await client.connect();
    console.log('数据库连接成功');
    
    // 检查外键关系
    const foreignKeyResult = await client.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE 
        tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('admin_management', 'user_profiles')
    `);
    
    console.log('外键关系:', foreignKeyResult.rows);
    
    // 检查表结构
    const tableStructure = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('admin_management', 'user_profiles')
      ORDER BY table_name, ordinal_position
    `);
    
    console.log('表结构:', tableStructure.rows);
    
  } catch (error) {
    console.error('检查失败:', error.message);
  } finally {
    await client.end();
  }
}

checkForeignKey();