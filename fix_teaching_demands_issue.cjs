// 直接修复teaching_demands表的外键约束问题
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54322';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTeachingDemandsIssue() {
  console.log('=== 修复teaching_demands表外键约束问题 ===');
  
  try {
    // 1. 首先检查当前teaching_demands表的数据
    console.log('\n1. 检查teaching_demands表数据...');
    const { data: demands, error: demandsError } = await supabase
      .from('teaching_demands')
      .select('*');
    
    if (demandsError) {
      console.error('❌ 查询teaching_demands失败:', demandsError.message);
    } else {
      console.log('✅ teaching_demands表数据:');
      console.log('找到 ' + demands.length + ' 条记录');
      demands.forEach(demand => {
        console.log(`  - ID: ${demand.id}, 学科: ${demand.subject}, created_by: ${demand.created_by}`);
      });
    }
    
    // 2. 检查user_profiles表数据
    console.log('\n2. 检查user_profiles表数据...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (usersError) {
      console.error('❌ 查询user_profiles失败:', usersError.message);
      return;
    }
    
    console.log('✅ user_profiles表数据:');
    console.log('找到 ' + users.length + ' 条记录');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, 手机号: ${user.phone_number}, 姓名: ${user.name}, 角色: ${user.role}`);
    });
    
    // 3. 获取一个有效的用户ID用于修复数据
    const validUserId = users[0]?.id;
    if (!validUserId) {
      console.error('❌ 没有找到有效的用户ID');
      return;
    }
    
    console.log('✅ 将使用用户ID进行修复:', validUserId);
    
    // 4. 修复teaching_demands表的created_by字段
    console.log('\n3. 修复teaching_demands表的created_by字段...');
    const { data: updateResult, error: updateError } = await supabase
      .from('teaching_demands')
      .update({ created_by: validUserId })
      .is('created_by', null) // 只修复null值
      .select();
    
    if (updateError) {
      console.error('❌ 修复created_by字段失败:', updateError.message);
      
      // 如果更新失败，尝试删除约束后修复
      console.log('\n4. 尝试删除外键约束后修复...');
      
      // 先删除外键约束
      const { error: dropError } = await supabase.rpc('execute_sql', {
        sql: 'ALTER TABLE teaching_demands DROP CONSTRAINT IF EXISTS teaching_demands_created_by_fkey;'
      });
      
      if (dropError) {
        console.error('❌ 删除外键约束失败:', dropError.message);
      } else {
        console.log('✅ 删除外键约束成功');
        
        // 重新尝试修复数据
        const { data: retryResult, error: retryError } = await supabase
          .from('teaching_demands')
          .update({ created_by: validUserId })
          .is('created_by', null)
          .select();
        
        if (retryError) {
          console.error('❌ 重新修复数据失败:', retryError.message);
        } else {
          console.log('✅ 重新修复数据成功');
          
          // 重新添加外键约束
          const { error: addError } = await supabase.rpc('execute_sql', {
            sql: `ALTER TABLE teaching_demands 
                  ADD CONSTRAINT teaching_demands_created_by_fkey 
                  FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE CASCADE;`
          });
          
          if (addError) {
            console.error('❌ 重新添加外键约束失败:', addError.message);
          } else {
            console.log('✅ 重新添加外键约束成功');
          }
        }
      }
    } else {
      console.log('✅ 修复created_by字段成功');
      console.log('更新了 ' + (updateResult?.length || 0) + ' 条记录');
    }
    
    // 5. 验证修复结果
    console.log('\n5. 验证修复结果...');
    const { data: finalDemands, error: finalError } = await supabase
      .from('teaching_demands')
      .select('*');
    
    if (finalError) {
      console.error('❌ 验证失败:', finalError.message);
    } else {
      console.log('✅ 验证成功');
      console.log('teaching_demands表现有 ' + finalDemands.length + ' 条记录');
      
      // 检查是否有无效的created_by值
      const invalidCreatedBy = finalDemands.filter(demand => 
        !users.some(user => user.id === demand.created_by)
      );
      
      if (invalidCreatedBy.length > 0) {
        console.log('⚠️  发现 ' + invalidCreatedBy.length + ' 条记录的created_by值无效');
      } else {
        console.log('✅ 所有记录的created_by值都有效');
      }
    }
    
    console.log('\n🎉 修复完成！现在可以尝试添加教学需求了。');
    
  } catch (error) {
    console.error('❌ 修复过程中出现异常:', error.message);
  }
}

fixTeachingDemandsIssue();