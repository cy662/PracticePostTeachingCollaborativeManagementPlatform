import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54322';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDelete() {
    try {
        console.log('正在测试删除功能...');
        
        // 1. 首先查看admin_management表结构
        console.log('\n1. 查看admin_management表结构:');
        const { data: adminData, error: adminError } = await supabase
            .from('admin_management')
            .select('*')
            .limit(3);
            
        if (adminError) {
            console.log('查询admin_management表错误:', adminError);
        } else {
            console.log('admin_management表数据:', JSON.stringify(adminData, null, 2));
        }
        
        // 2. 查看user_profiles表结构
        console.log('\n2. 查看user_profiles表结构:');
        const { data: userData, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(3);
            
        if (userError) {
            console.log('查询user_profiles表错误:', userError);
        } else {
            console.log('user_profiles表数据:', JSON.stringify(userData, null, 2));
        }
        
        // 3. 测试删除操作
        console.log('\n3. 测试删除操作:');
        if (userData && userData.length > 0) {
            const testUser = userData[0];
            console.log('测试删除用户ID:', testUser.id);
            
            // 先检查是否在admin_management表中
            const { data: adminRecord, error: checkError } = await supabase
                .from('admin_management')
                .select('*')
                .eq('admin_id', testUser.id);
                
            if (checkError) {
                console.log('检查管理员记录错误:', checkError);
            } else if (adminRecord && adminRecord.length > 0) {
                console.log('找到管理员记录，准备测试删除...');
                
                // 测试删除admin_management记录
                const { error: deleteAdminError } = await supabase
                    .from('admin_management')
                    .delete()
                    .eq('admin_id', testUser.id);
                    
                if (deleteAdminError) {
                    console.log('删除admin_management记录失败:', deleteAdminError);
                } else {
                    console.log('删除admin_management记录成功');
                }
                
                // 测试删除user_profiles记录
                const { error: deleteUserError } = await supabase
                    .from('user_profiles')
                    .delete()
                    .eq('id', testUser.id);
                    
                if (deleteUserError) {
                    console.log('删除user_profiles记录失败:', deleteUserError);
                } else {
                    console.log('删除user_profiles记录成功');
                }
            } else {
                console.log('未找到对应的管理员记录');
            }
        }
        
    } catch (err) {
        console.log('测试失败:', err.message);
    }
}

testDelete();