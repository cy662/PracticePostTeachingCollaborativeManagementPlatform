import { Client } from 'pg';

// 数据库连接配置
const client = new Client({
  host: '127.0.0.1',
  port: 54333,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});

async function checkAllTables() {
  try {
    console.log('🔍 正在检查数据库中的所有表...\n');
    await client.connect();
    
    // 1. 检查所有表
    console.log('1. 所有表列表:');
    const tablesResult = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`   共找到 ${tablesResult.rows.length} 个表:`);
    tablesResult.rows.forEach(table => {
      console.log(`   - ${table.table_name} (${table.table_type})`);
    });
    
    // 2. 检查每个表的数据量
    console.log('\n2. 各表数据量统计:');
    for (const table of tablesResult.rows) {
      const countResult = await client.query(`
        SELECT COUNT(*) as count FROM "${table.table_name}";
      `);
      console.log(`   - ${table.table_name}: ${countResult.rows[0].count} 条记录`);
    }
    
    // 3. 检查关键表的结构
    console.log('\n3. 关键表结构检查:');
    const keyTables = ['user_profiles', 'organizations', 'teaching_demands', 'positions', 'assignments'];
    
    for (const tableName of keyTables) {
      if (tablesResult.rows.some(t => t.table_name === tableName)) {
        console.log(`\n   📊 ${tableName} 表结构:`);
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position;
        `);
        
        columnsResult.rows.forEach(col => {
          console.log(`     - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
      } else {
        console.log(`\n   ⚠️ ${tableName} 表不存在`);
      }
    }
    
    // 4. 检查外键关系
    console.log('\n4. 外键关系检查:');
    const fkResult = await client.query(`
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
      WHERE tc.constraint_type = 'FOREIGN KEY';
    `);
    
    if (fkResult.rows.length > 0) {
      console.log('   外键关系:');
      fkResult.rows.forEach(fk => {
        console.log(`   - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('   未找到外键关系');
    }
    
    console.log('\n✅ 数据库检查完成！');
    
  } catch (error) {
    console.error('❌ 检查数据库时发生错误:', error.message);
  } finally {
    await client.end();
    console.log('数据库连接已关闭');
  }
}

// 执行检查
checkAllTables();