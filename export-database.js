import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportDatabase() {
  console.log('开始导出数据库表和数据...');
  
  // 数据库连接配置（从run-migration.js复制）
  const config = {
    host: 'localhost',
    port: 54322, // Supabase默认数据库端口
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  };

  // 备用配置
  const backupConfig = {
    host: 'localhost',
    port: 54333,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  };

  let client;
  let connectedConfig;
  
  // 尝试连接数据库
  try {
    client = new Client(config);
    await client.connect();
    console.log('使用端口54322连接数据库成功');
    connectedConfig = config;
  } catch (error) {
    console.log('端口54322连接失败，尝试备用端口54333...');
    
    try {
      if (client) await client.end();
      client = new Client(backupConfig);
      await client.connect();
      console.log('使用端口54333连接数据库成功');
      connectedConfig = backupConfig;
    } catch (error2) {
      console.error('数据库连接失败:', error2.message);
      console.log('请确保Supabase已正确启动，并且数据库服务正在运行');
      return;
    }
  }

  try {
    // 获取所有public模式下的表
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`找到 ${tables.length} 个表：`, tables.join(', '));
    
    // 创建导出文件路径
    const exportDir = path.join(__dirname, 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const exportFile = path.join(exportDir, `database_export_${new Date().toISOString().slice(0, 10)}.sql`);
    
    // 开始写入SQL文件
    let sqlContent = `-- 数据库导出 - ${new Date().toISOString()}\n\n`;
    sqlContent += `-- 导出的数据库: ${connectedConfig.database}\n\n`;
    
    // 添加必要的扩展
    sqlContent += `-- 创建必要的扩展\n`;
    sqlContent += `CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";\n`;
    sqlContent += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";\n\n`;
    
    // 为每个表导出结构和数据
    for (const table of tables) {
      console.log(`导出表: ${table}`);
      
      // 导出表结构
      console.log(`  - 导出表结构...`);
      const structureResult = await client.query(`
        SELECT column_name, data_type, character_maximum_length, 
               is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      // 构建CREATE TABLE语句
      sqlContent += `-- 表: ${table}\n`;
      sqlContent += `CREATE TABLE IF NOT EXISTS public."${table}" (\n`;
      
      const columns = structureResult.rows.map(row => {
        let columnDef = `  "${row.column_name}" ${row.data_type}`;
        
        if (row.character_maximum_length) {
          columnDef += `(${row.character_maximum_length})`;
        }
        
        if (row.is_nullable === 'NO') {
          columnDef += ` NOT NULL`;
        }
        
        if (row.column_default) {
          columnDef += ` DEFAULT ${row.column_default}`;
        }
        
        return columnDef;
      });
      
      sqlContent += columns.join(',\n');
      sqlContent += `\n);\n\n`;
      
      // 导出表数据
      console.log(`  - 导出表数据...`);
      const dataResult = await client.query(`SELECT * FROM "${table}"`);
      
      if (dataResult.rows.length > 0) {
        sqlContent += `-- 插入数据到 ${table}\n`;
        
        const columnsList = Object.keys(dataResult.rows[0]).map(col => `"${col}"`).join(', ');
        
        sqlContent += `INSERT INTO public."${table}" (${columnsList}) VALUES\n`;
        
        const values = dataResult.rows.map((row, index) => {
          const rowValues = Object.values(row).map(value => {
            if (value === null) return 'NULL';
            if (typeof value === 'string') {
              // 转义字符串中的特殊字符
              return `'${value.replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
            }
            if (value instanceof Date) {
              return `'${value.toISOString()}'`;
            }
            return value;
          }).join(', ');
          
          return `  (${rowValues})${index < dataResult.rows.length - 1 ? ',' : ''}`;
        });
        
        sqlContent += values.join('\n');
        sqlContent += ';\n\n';
      } else {
        sqlContent += `-- 表 ${table} 中没有数据\n\n`;
      }
      
      // 导出索引和约束
      console.log(`  - 导出索引和约束...`);
      
      // 导出索引
      const indexesResult = await client.query(`
        SELECT 
          indexname, 
          indexdef 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = $1
      `, [table]);
      
      indexesResult.rows.forEach(row => {
        sqlContent += `-- 索引: ${row.indexname}\n`;
        sqlContent += `${row.indexdef};\n\n`;
      });
      
      // 导出外键约束
      const fkeysResult = await client.query(`
        SELECT 
          tc.constraint_name, 
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
        WHERE constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
          AND tc.table_name = $1
      `, [table]);
      
      fkeysResult.rows.forEach(row => {
        sqlContent += `-- 外键约束: ${row.constraint_name}\n`;
        sqlContent += `ALTER TABLE public."${row.table_name}"\n`;
        sqlContent += `  ADD CONSTRAINT "${row.constraint_name}" FOREIGN KEY ("${row.column_name}")\n`;
        sqlContent += `  REFERENCES public."${row.foreign_table_name}" ("${row.foreign_column_name}");\n\n`;
      });
    }
    
    // 导出函数和存储过程
    console.log('导出函数和存储过程...');
    const functionsResult = await client.query(`
      SELECT 
        n.nspname as schema,
        p.proname as function_name,
        pg_get_functiondef(p.oid) as function_definition
      FROM 
        pg_proc p
      JOIN 
        pg_namespace n ON p.pronamespace = n.oid
      WHERE 
        n.nspname = 'public'
    `);
    
    functionsResult.rows.forEach(row => {
      sqlContent += `-- 函数: ${row.function_name}\n`;
      sqlContent += row.function_definition + '\n\n';
    });
    
    // 写入到文件
    fs.writeFileSync(exportFile, sqlContent, 'utf8');
    console.log(`\n数据库导出完成！`);
    console.log(`导出文件路径: ${exportFile}`);
    console.log(`导出的表数量: ${tables.length}`);
    
  } catch (error) {
    console.error('导出过程中发生错误:', error.message);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// 运行导出函数
exportDatabase().catch(err => {
  console.error('程序执行失败:', err);
});