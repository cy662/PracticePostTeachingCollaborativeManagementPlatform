import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('开始运行数据库迁移...');
  
  // 读取SQL文件
  const sqlFile = path.join(__dirname, 'setup-database.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');
  
  // 数据库连接配置
  const client = new Client({
    host: 'localhost',
    port: 54322, // Supabase默认数据库端口
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('数据库连接成功');
    
    // 执行SQL文件
    const result = await client.query(sqlContent);
    console.log('数据库迁移执行成功！');
    
    // 验证表是否创建成功
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_profiles', 'admin_management');
    `);
    
    console.log('已创建的表:', tablesResult.rows.map(row => row.table_name));
    
    // 检查数据是否插入成功
    const userCount = await client.query('SELECT COUNT(*) as count FROM user_profiles');
    const adminCount = await client.query('SELECT COUNT(*) as count FROM admin_management');
    
    console.log(`用户档案数量: ${userCount.rows[0].count}`);
    console.log(`管理员数量: ${adminCount.rows[0].count}`);
    
    console.log('数据库设置完成！');
    
  } catch (error) {
    console.error('数据库迁移失败:', error.message);
    
    // 如果连接失败，可能是端口不对，尝试其他端口
    if (error.message.includes('connect')) {
      console.log('尝试使用端口54333连接...');
      
      const client2 = new Client({
        host: 'localhost',
        port: 54333, // 备用端口
        user: 'postgres',
        password: 'postgres',
        database: 'postgres'
      });
      
      try {
        await client2.connect();
        console.log('使用端口54333连接成功');
        
        const result = await client2.query(sqlContent);
        console.log('数据库迁移执行成功！');
        
      } catch (error2) {
        console.error('备用端口连接也失败:', error2.message);
        console.log('请确保Supabase已正确启动，并且数据库服务正在运行');
      } finally {
        await client2.end();
      }
    }
    
  } finally {
    await client.end();
  }
}

// 运行迁移
runMigration();