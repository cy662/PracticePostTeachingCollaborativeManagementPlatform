// 执行安全版本的机构表SQL脚本
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 从环境变量或配置文件获取Supabase凭据
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 读取SQL文件内容
async function runSafeSqlScript() {
  try {
    console.log('开始执行安全版本的机构表SQL脚本...');
    
    // 读取SQL文件
    const sqlFilePath = path.join(process.cwd(), 'supabase', 'organizations_schema_safe.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 分割SQL语句并执行
    // 注意：在实际的Supabase环境中，可能需要使用不同的方法执行SQL
    const sqlStatements = sqlContent.split(';').filter(statement => statement.trim());
    
    console.log(`找到 ${sqlStatements.length} 个SQL语句需要执行`);
    
    // 由于直接执行多行SQL可能会有问题，这里提供执行方法的注释说明
    console.log('=== SQL脚本内容预览 ===');
    console.log(sqlContent.substring(0, 500) + '...');
    console.log('====================');
    
    console.log('SQL脚本已准备好，您可以：');
    console.log('1. 通过Supabase Dashboard的SQL编辑器直接复制执行');
    console.log('2. 使用Supabase CLI执行: supabase sql -f supabase/organizations_schema_safe.sql');
    console.log('3. 直接在PostgreSQL客户端中执行');
    
    // 禁用RLS以便测试
    try {
      console.log('尝试禁用RLS以便测试...');
      const { error: rlsError } = await supabase.rpc('disable_rls', { table_name: 'organizations' });
      if (rlsError) {
        console.log('注意：可能没有disable_rls函数，这不会影响主要功能');
        console.log('您可以手动禁用RLS: ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;');
      } else {
        console.log('RLS已成功禁用');
      }
    } catch (err) {
      console.log('RLS操作异常:', err.message);
    }
    
    console.log('执行完成。请按照上述说明手动执行SQL脚本。');
    
  } catch (error) {
    console.error('执行过程中发生错误:', error);
  }
}

// 运行脚本
runSafeSqlScript();