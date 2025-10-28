import { Client } from 'pg';

async function checkData() {
  console.log('开始检查数据库数据...');
  
  const client = new Client({
    host: 'localhost',
    port: 54333, // 数据库端口
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('数据库连接成功');
    
    // 检查user_profiles表数据
    const userResult = await client.query('SELECT * FROM user_profiles');
    console.log('user_profiles表数据:');
    console.log(userResult.rows);
    
    // 检查admin_management表数据
    const adminResult = await client.query('SELECT * FROM admin_management');
    console.log('admin_management表数据:');
    console.log(adminResult.rows);
    
    // 检查表结构
    const tableInfo = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_profiles', 'admin_management')
      ORDER BY table_name, ordinal_position
    `);
    console.log('表结构:');
    console.log(tableInfo.rows);
    
  } catch (error) {
    console.error('检查数据失败:', error.message);
    
    // 尝试其他端口
    console.log('尝试端口54322...');
    const client2 = new Client({
      host: 'localhost',
      port: 54322,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres'
    });
    
    try {
      await client2.connect();
      console.log('端口54322连接成功');
      
      const userResult = await client2.query('SELECT * FROM user_profiles');
      console.log('user_profiles表数据:', userResult.rows);
      
    } catch (error2) {
      console.error('端口54322连接失败:', error2.message);
    } finally {
      await client2.end();
    }
  } finally {
    await client.end();
  }
}

checkData();