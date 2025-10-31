// 初始化机构管理系统
import { organizationService } from './src/api/organizationService.js';

/**
 * 初始化机构管理系统
 * 1. 创建数据库表结构（如果不存在）
 * 2. 添加测试数据
 * 3. 验证系统功能
 */
async function initializeOrganizationSystem() {
  try {
    console.log('=== 开始初始化机构管理系统 ===\n');

    // 1. 初始化数据库表结构
    console.log('1. 初始化数据库表结构...');
    await organizationService.initializeDatabase();
    console.log('✅ 数据库初始化说明已生成');
    
    console.log('\n请按照上述说明在Supabase Dashboard中执行SQL语句创建表结构。');
    console.log('执行完成后，按任意键继续...');
    
    // 由于我们不能直接执行阻塞等待，这里给用户足够时间来手动操作
    setTimeout(async () => {
      console.log('\n继续测试...');
      
      // 2. 批量添加测试数据
      await testAddingOrganizations();
      
      // 3. 验证功能
      await verifyOrganizationSystem();
      
      console.log('\n=== 初始化完成 ===');
      console.log('机构管理系统已经准备就绪！');
      console.log('现在您可以通过前端界面添加、编辑和管理机构数据。');
    }, 5000); // 5秒后继续
    
  } catch (error) {
    console.error('❌ 初始化过程中发生错误:', error);
  }
}

/**
 * 测试添加机构功能
 */
async function testAddingOrganizations() {
  try {
    console.log('\n2. 测试添加机构功能...');
    console.log('尝试添加测试数据（每种类型1个）...');
    
    const result = await organizationService.batchAddTestOrganizations(1);
    
    console.log(`✅ 批量添加完成`);
    console.log(`成功添加: ${result.successCount}/${result.totalCount} 个机构`);
    
    if (result.successCount > 0) {
      console.log('添加的机构详情:');
      Object.keys(result.results).forEach(type => {
        if (result.results[type].length > 0) {
          console.log(`  ${type}类型:`);
          result.results[type].forEach(org => {
            console.log(`    - ${org.name} (${org.code})`);
          });
        }
      });
    } else {
      console.log('⚠️  未成功添加任何机构，请检查以下可能的原因:');
      console.log('  - 数据库表是否已创建');
      console.log('  - RLS策略是否已禁用');
      console.log('  - Supabase服务是否正常运行');
      console.log('  - 网络连接是否正常');
    }
  } catch (error) {
    console.error('❌ 添加测试机构失败:', error);
  }
}

/**
 * 验证机构管理系统功能
 */
async function verifyOrganizationSystem() {
  try {
    console.log('\n3. 验证机构管理系统功能...');
    
    // 测试获取机构列表
    console.log('\n测试获取机构列表...');
    const organizations = await organizationService.getOrganizations();
    console.log(`✅ 获取成功，共 ${organizations.data.length} 个机构`);
    
    // 测试获取类型统计
    console.log('\n测试获取类型统计...');
    const stats = await organizationService.getOrganizationTypeStats();
    console.log('✅ 统计结果:', stats);
    
    // 如果有机构数据，测试根据ID获取详情
    if (organizations.data.length > 0) {
      const firstOrg = organizations.data[0];
      console.log(`\n测试获取机构详情 (ID: ${firstOrg.id})...`);
      const orgDetail = await organizationService.getOrganizationById(firstOrg.id);
      console.log(`✅ 获取成功: ${orgDetail.name}`);
    }
    
    console.log('\n✅ 所有功能测试通过！');
  } catch (error) {
    console.error('❌ 功能验证失败:', error);
  }
}

// 运行初始化
try {
  initializeOrganizationSystem();
} catch (error) {
  console.error('初始化脚本执行失败:', error);
}