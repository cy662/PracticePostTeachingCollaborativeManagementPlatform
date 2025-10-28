// 测试组件导入是否正确
import { supabase } from './src/lib/supabaseClient.js';

async function testImport() {
  try {
    console.log('测试Supabase导入...');
    
    if (!supabase) {
      console.error('Supabase客户端未正确导入');
      return;
    }
    
    console.log('Supabase客户端导入成功');
    
    // 测试查询
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('查询测试失败:', error);
    } else {
      console.log('查询测试成功:', data);
    }
    
  } catch (error) {
    console.error('导入测试失败:', error);
  }
}

testImport();