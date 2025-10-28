const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54322';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
    try {
        console.log('=== 检查数据库约束和表结构 ===');
        
        // 1. 检查表结构
        console.log('\n1. 检查表结构:');
        
        // 检查 admin_management 表结构
        const { data: adminStructure, error: adminStructError } = await supabase
            .from('admin_management')
            .select('*')
            .limit(1);
            
        if (adminStructError) {
            console.log('检查 admin_management 表结构错误:', adminStructError);
        } else {
            console.log('admin_management 表字段:', Object.keys(adminStructure[0]));
        }
        
        // 检查 user_profiles 表结构
        const { data: userStructure, error: userStructError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1);
            
        if (userStructError) {
            console.log('检查 user_profiles 表结构错误:', userStructError);
        } else {
            console.log('user_profiles 表字段:', Object.keys(userStructure[0]));
        }
        
        // 2. 检查外键约束
        console.log('\n2. 检查外键约束关系:');
        
        // 测试删除操作，查看具体错误信息
        console.log('\n3. 详细测试删除操作:');
        
        // 获取一个测试管理员
        const { data: testAdmin } = await supabase
            .from('admin_management')
            .select('admin_id')
            .limit(1);
            
        if (testAdmin && testAdmin.length > 0) {
            const testAdminId = testAdmin[0].admin_id;
            console.log('测试删除的用户ID:', testAdminId);
            
            // 先检查用户是否存在
            const { data: userExists } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', testAdminId);
                
            console.log('用户是否存在:', userExists && userExists.length > 0 ? '是' : '否');
            
            // 尝试删除用户档案
            console.log('\n尝试删除 user_profiles 记录:');
            const { error: deleteUserError } = await supabase
                .from('user_profiles')
                .delete()
                .eq('id', testAdminId);
                
            if (deleteUserError) {
                console.log('删除 user_profiles 错误详情:');
                console.log('错误代码:', deleteUserError.code);
                console.log('错误消息:', deleteUserError.message);
                console.log('错误详情:', deleteUserError.details);
                console.log('错误提示:', deleteUserError.hint);
            } else {
                console.log('✓ user_profiles 删除成功');
            }
            
            // 尝试删除管理员记录
            console.log('\n尝试删除 admin_management 记录:');
            const { error: deleteAdminError } = await supabase
                .from('admin_management')
                .delete()
                .eq('admin_id', testAdminId);
                
            if (deleteAdminError) {
                console.log('删除 admin_management 错误详情:');
                console.log('错误代码:', deleteAdminError.code);
                console.log('错误消息:', deleteAdminError.message);
                console.log('错误详情:', deleteAdminError.details);
                console.log('错误提示:', deleteAdminError.hint);
            } else {
                console.log('✓ admin_management 删除成功');
            }
            
            // 检查删除结果
            console.log('\n检查删除结果:');
            const { data: userAfterDelete } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', testAdminId);
                
            console.log('删除后用户是否存在:', userAfterDelete && userAfterDelete.length > 0 ? '是' : '否');
            
            const { data: adminAfterDelete } = await supabase
                .from('admin_management')
                .select('admin_id')
                .eq('admin_id', testAdminId);
                
            console.log('删除后管理员记录是否存在:', adminAfterDelete && adminAfterDelete.length > 0 ? '是' : '否');
        }
        
        // 4. 检查是否有其他相关表
        console.log('\n4. 检查是否有其他相关表:');
        
        // 检查是否有 auth.users 表关联
        try {
            const { data: authUsers, error: authError } = await supabase
                .from('auth.users')
                .select('id')
                .limit(1);
                
            if (authError) {
                console.log('auth.users 表不存在或无法访问:', authError.message);
            } else {
                console.log('✓ auth.users 表存在，可能有认证用户关联');
            }
        } catch (e) {
            console.log('auth.users 表检查异常:', e.message);
        }
        
    } catch (err) {
        console.log('检查约束失败:', err.message);
    }
}

checkConstraints();