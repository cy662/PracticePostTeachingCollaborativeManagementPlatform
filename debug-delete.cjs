const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54322';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDelete() {
    try {
        console.log('=== 调试删除功能 ===');
        
        // 1. 查看当前所有管理员数据
        console.log('\n1. 查看当前管理员列表:');
        const { data: adminList, error: listError } = await supabase
            .from('admin_management')
            .select(`
                *,
                user_profiles!admin_id (
                    id,
                    name,
                    phone_number,
                    organization,
                    role
                )
            `);
            
        if (listError) {
            console.log('查询管理员列表错误:', listError);
        } else {
            console.log('管理员总数:', adminList.length);
            adminList.forEach((admin, index) => {
                console.log(`管理员 ${index + 1}:`);
                console.log('  - admin_management ID:', admin.id);
                console.log('  - admin_id (用户ID):', admin.admin_id);
                console.log('  - 用户姓名:', admin.user_profiles?.name);
                console.log('  - 手机号:', admin.user_profiles?.phone_number);
                console.log('  - 状态:', admin.status);
                console.log('');
            });
        }
        
        // 2. 查看用户档案表
        console.log('\n2. 查看用户档案表:');
        const { data: userProfiles, error: userError } = await supabase
            .from('user_profiles')
            .select('*');
            
        if (userError) {
            console.log('查询用户档案错误:', userError);
        } else {
            console.log('用户档案总数:', userProfiles.length);
            userProfiles.forEach((user, index) => {
                console.log(`用户 ${index + 1}:`);
                console.log('  - ID:', user.id);
                console.log('  - 姓名:', user.name);
                console.log('  - 手机号:', user.phone_number);
                console.log('  - 角色:', user.role);
                console.log('');
            });
        }
        
        // 3. 检查数据关联关系
        console.log('\n3. 检查数据关联关系:');
        if (adminList && userProfiles) {
            const adminUserIds = adminList.map(admin => admin.admin_id);
            const userProfileIds = userProfiles.map(user => user.id);
            
            console.log('管理员表中的用户ID:', adminUserIds);
            console.log('用户档案表中的用户ID:', userProfileIds);
            
            // 检查是否有不匹配的ID
            const orphanedAdminIds = adminUserIds.filter(id => !userProfileIds.includes(id));
            const orphanedUserIds = userProfileIds.filter(id => !adminUserIds.includes(id));
            
            if (orphanedAdminIds.length > 0) {
                console.log('警告: 发现孤立的管理员记录 (用户档案不存在):', orphanedAdminIds);
            }
            if (orphanedUserIds.length > 0) {
                console.log('警告: 发现孤立的用户档案 (不在管理员表中):', orphanedUserIds);
            }
        }
        
        // 4. 测试删除一个管理员
        console.log('\n4. 测试删除操作:');
        if (adminList && adminList.length > 0) {
            const testAdmin = adminList[0];
            console.log('测试删除的管理员:');
            console.log('  - admin_management ID:', testAdmin.id);
            console.log('  - 用户ID:', testAdmin.admin_id);
            console.log('  - 姓名:', testAdmin.user_profiles?.name);
            
            // 先备份数据
            console.log('\n开始删除测试...');
            
            // 删除 admin_management 记录
            const { error: deleteAdminError } = await supabase
                .from('admin_management')
                .delete()
                .eq('admin_id', testAdmin.admin_id);
                
            if (deleteAdminError) {
                console.log('删除 admin_management 记录失败:', deleteAdminError);
            } else {
                console.log('✓ admin_management 记录删除成功');
            }
            
            // 删除 user_profiles 记录
            const { error: deleteUserError } = await supabase
                .from('user_profiles')
                .delete()
                .eq('id', testAdmin.admin_id);
                
            if (deleteUserError) {
                console.log('删除 user_profiles 记录失败:', deleteUserError);
            } else {
                console.log('✓ user_profiles 记录删除成功');
            }
            
            // 验证删除结果
            console.log('\n验证删除结果:');
            
            const { data: checkAdmin } = await supabase
                .from('admin_management')
                .select('*')
                .eq('admin_id', testAdmin.admin_id);
                
            console.log('admin_management 记录是否还存在:', checkAdmin && checkAdmin.length > 0 ? '是' : '否');
            
            const { data: checkUser } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', testAdmin.admin_id);
                
            console.log('user_profiles 记录是否还存在:', checkUser && checkUser.length > 0 ? '是' : '否');
        }
        
    } catch (err) {
        console.log('调试失败:', err.message);
    }
}

debugDelete();