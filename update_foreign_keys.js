import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateForeignKeys() {
  console.log('开始更新外键约束...');
  
  // 读取SQL文件
  const sqlFile = path.join(__dirname, 'supabase', 'update_foreign_keys.sql');
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
    console.log('外键约束更新成功！');
    
    // 验证外键约束是否更新成功
    console.log('验证外键约束...');
    
    // 检查students表的外键约束
    const studentsForeignKey = await client.query(`
      SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'students'
        AND tc.table_schema = 'public';
    `);
    console.log('students表外键约束:', studentsForeignKey.rows);
    
    // 检查student_assignments表的外键约束
    const assignmentsForeignKey = await client.query(`
      SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'student_assignments'
        AND tc.table_schema = 'public';
    `);
    console.log('student_assignments表外键约束:', assignmentsForeignKey.rows);
    
    // 检查teaching_demands表的外键约束
    const demandsForeignKey = await client.query(`
      SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'teaching_demands'
        AND tc.table_schema = 'public';
    `);
    console.log('teaching_demands表外键约束:', demandsForeignKey.rows);
    
    // 检查其他表的外键约束
    const otherForeignKeys = await client.query(`
      SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name IN ('import_batches', 'teacher_evaluations', 'position_student_assignments', 'admin_management');
    `);
    console.log('其他表外键约束:', otherForeignKeys.rows);
    
    console.log('外键约束更新和验证完成！');
    
  } catch (error) {
    console.error('外键约束更新失败:', error.message);
    
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
        console.log('外键约束更新成功！');
        
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

// 运行外键更新
updateForeignKeys();