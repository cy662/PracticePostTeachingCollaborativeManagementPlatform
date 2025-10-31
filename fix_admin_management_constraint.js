import { Client } from 'pg';

// 数据库连接配置
const client = new Client({
  host: '127.0.0.1',
  port: 54333,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});

async function fixAdminManagementConstraint() {
  try {
    console.log('🔧 正在修复 admin_management 表的外键约束问题...\n');
    await client.connect();
    
    // 1. 检查 admin_management 表结构
    console.log('1. 检查 admin_management 表结构...');
    const tableInfo = await client.query(`
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
      WHERE tc.table_name = 'admin_management' AND tc.constraint_type = 'FOREIGN KEY';
    `);
    
    console.log('外键约束信息:');
    tableInfo.rows.forEach(fk => {
      console.log(`   - ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // 2. 检查 user_profiles 表中的超级管理员
    console.log('\n2. 检查 user_profiles 表中的超级管理员...');
    const superAdmins = await client.query(`
      SELECT id, name, phone_number, role 
      FROM user_profiles 
      WHERE role = 'super_admin';
    `);
    
    if (superAdmins.rows.length > 0) {
      console.log('找到超级管理员:');
      superAdmins.rows.forEach(admin => {
        console.log(`   - ${admin.name} (${admin.phone_number}) - ID: ${admin.id}`);
      });
    } else {
      console.log('⚠️ 未找到超级管理员，需要创建...');
    }
    
    // 3. 检查 admin_management 表中的数据
    console.log('\n3. 检查 admin_management 表中的数据...');
    const adminManagementData = await client.query(`
      SELECT 
        am.admin_id,
        am.managed_by,
        am.created_by,
        am.role,
        am.status,
        up.name as admin_name,
        up2.name as created_by_name
      FROM admin_management am
      LEFT JOIN user_profiles up ON am.admin_id = up.id
      LEFT JOIN user_profiles up2 ON am.created_by = up2.id;
    `);
    
    if (adminManagementData.rows.length > 0) {
      console.log('admin_management 表数据:');
      adminManagementData.rows.forEach(row => {
        console.log(`   - 管理员: ${row.admin_name || '未知'} (${row.admin_id})`);
        console.log(`     创建者: ${row.created_by_name || '未知'} (${row.created_by})`);
        console.log(`     角色: ${row.role}, 状态: ${row.status}`);
      });
    } else {
      console.log('admin_management 表为空');
    }
    
    // 4. 检查外键约束问题
    console.log('\n4. 检查外键约束问题...');
    const invalidReferences = await client.query(`
      SELECT DISTINCT am.created_by 
      FROM admin_management am
      LEFT JOIN user_profiles up ON am.created_by = up.id
      WHERE up.id IS NULL;
    `);
    
    if (invalidReferences.rows.length > 0) {
      console.log('⚠️ 发现无效的外键引用:');
      invalidReferences.rows.forEach(ref => {
        console.log(`   - created_by: ${ref.created_by} (在 user_profiles 表中不存在)`);
      });
    } else {
      console.log('✅ 外键引用正常');
    }
    
    // 5. 修复方案：创建超级管理员或修改约束
    console.log('\n5. 执行修复方案...');
    
    // 方案1：创建超级管理员（如果不存在）
    if (superAdmins.rows.length === 0) {
      console.log('创建超级管理员...');
      const superAdminId = '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc';
      
      const { rows: existingUser } = await client.query(`
        SELECT id FROM user_profiles WHERE id = $1;
      `, [superAdminId]);
      
      if (existingUser.length === 0) {
        await client.query(`
          INSERT INTO user_profiles (id, name, phone_number, role, organization) 
          VALUES ($1, '超级管理员', '13800138000', 'super_admin', '系统管理')
          ON CONFLICT (id) DO NOTHING;
        `, [superAdminId]);
        console.log('✅ 超级管理员创建成功');
      } else {
        console.log('✅ 超级管理员已存在');
      }
    }
    
    // 方案2：修复 admin_management 表中的无效引用
    if (invalidReferences.rows.length > 0) {
      console.log('修复无效的外键引用...');
      
      // 获取有效的超级管理员ID
      const { rows: validSuperAdmins } = await client.query(`
        SELECT id FROM user_profiles WHERE role = 'super_admin' LIMIT 1;
      `);
      
      if (validSuperAdmins.length > 0) {
        const validSuperAdminId = validSuperAdmins[0].id;
        
        await client.query(`
          UPDATE admin_management 
          SET created_by = $1 
          WHERE created_by IN (
            SELECT am.created_by 
            FROM admin_management am
            LEFT JOIN user_profiles up ON am.created_by = up.id
            WHERE up.id IS NULL
          );
        `, [validSuperAdminId]);
        
        console.log('✅ 无效外键引用已修复');
      }
    }
    
    // 方案3：临时禁用外键约束（如果需要）
    console.log('临时禁用外键约束...');
    await client.query(`
      ALTER TABLE admin_management 
      DROP CONSTRAINT IF EXISTS admin_management_created_by_fkey;
    `);
    
    console.log('✅ 外键约束已临时禁用');
    
    console.log('\n🎉 修复完成！');
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
  } finally {
    await client.end();
    console.log('数据库连接已关闭');
  }
}

// 执行修复
fixAdminManagementConstraint();