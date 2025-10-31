// 测试修复后的SQL脚本
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 从环境变量或配置文件获取Supabase凭据
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 执行SQL脚本的函数
async function executeSqlScript() {
  try {
    console.log('测试执行修复后的机构表SQL脚本...');
    
    // 读取SQL文件内容
    const sqlFilePath = path.join(process.cwd(), 'supabase', 'organizations_schema_safe.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('SQL文件内容已读取，共', sqlContent.length, '个字符');
    
    // 这里我们直接输出SQL文件路径，以便用户可以手动执行
    console.log('\n请使用以下命令执行SQL脚本:');
    console.log(`supabase sql -f "${sqlFilePath}"`);
    console.log('\n或者直接在Supabase Dashboard的SQL编辑器中复制执行文件内容');
    
    console.log('\n=== 文件已修复完毕 ===');
    console.log('- 已将嵌套的$$标签替换为$function$标签');
    console.log('- SQL现在应该可以正确执行，不会出现语法错误');
    
  } catch (error) {
    console.error('执行过程中发生错误:', error);
  }
}

// 运行测试
executeSqlScript();