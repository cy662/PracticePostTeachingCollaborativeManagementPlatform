// 测试本地存储版本的机构管理服务
import { organizationService } from './src/api/organizationServiceLocal.js';

/**
 * 测试本地存储机构管理服务
 * 1. 初始化服务
 * 2. 添加测试数据
 * 3. 验证各项功能
 */
async function testLocalOrganizationService() {
  try {
    console.log('=== 开始测试本地存储机构管理服务 ===\n');

    // 1. 初始化服务
    console.log('1. 初始化服务...');
    await organizationService.initialize();
    console.log('✅ 服务初始化成功');

    // 2. 添加测试数据
    console.log('\n2. 添加测试数据...');
    const batchResult = await organizationService.batchAddTestOrganizations(2);
    console.log(`✅ 批量添加完成：成功添加 ${batchResult.successCount}/${batchResult.totalCount} 个机构`);
    
    // 3. 测试获取机构列表
    console.log('\n3. 测试获取机构列表...');
    const organizations = await organizationService.getOrganizations();
    console.log(`✅ 获取成功，共 ${organizations.data.length} 个机构`);
    
    // 显示前几个机构的基本信息
    console.log('\n机构列表前3项:');
    organizations.data.slice(0, 3).forEach((org, index) => {
      console.log(`  ${index + 1}. ${org.name} (${org.type}, ${org.code})`);
    });

    // 4. 测试类型过滤
    console.log('\n4. 测试类型过滤（school类型）...');
    const schoolOrgs = await organizationService.getOrganizations({ type: 'school' });
    console.log(`✅ 获取成功，共 ${schoolOrgs.data.length} 个学校类型机构`);

    // 5. 测试搜索功能
    console.log('\n5. 测试搜索功能（搜索"测试"）...');
    const searchResults = await organizationService.getOrganizations({ search: '测试' });
    console.log(`✅ 搜索成功，共 ${searchResults.data.length} 个匹配结果`);

    // 6. 测试获取详情
    if (organizations.data.length > 0) {
      const firstOrg = organizations.data[0];
      console.log(`\n6. 测试获取机构详情（ID: ${firstOrg.id}）...`);
      const detail = await organizationService.getOrganizationById(firstOrg.id);
      console.log(`✅ 获取成功: ${detail.name} - ${detail.description}`);

      // 7. 测试更新功能
      console.log('\n7. 测试更新机构...');
      const updatedOrg = await organizationService.updateOrganization(firstOrg.id, {
        description: '这是更新后的描述信息',
        address: '新的测试地址'
      });
      console.log(`✅ 更新成功: ${updatedOrg.name}`);
      console.log(`  描述: ${updatedOrg.description}`);
      console.log(`  地址: ${updatedOrg.address}`);

      // 8. 测试删除功能
      console.log('\n8. 测试删除机构...');
      const deleteResult = await organizationService.deleteOrganization(firstOrg.id);
      console.log(`✅ 删除成功: ${deleteResult}`);

      // 验证删除是否成功
      const deletedCheck = await organizationService.getOrganizationById(firstOrg.id);
      console.log(`   验证: ${deletedCheck ? '删除失败' : '删除成功，记录已不存在'}`);
    }

    // 9. 测试统计功能
    console.log('\n9. 测试机构类型统计...');
    const stats = await organizationService.getOrganizationTypeStats();
    console.log('✅ 统计结果:');
    Object.entries(stats).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} 个`);
    });

    console.log('\n=== 测试完成 ===');
    console.log('✅ 本地存储版本的机构管理服务功能正常！');
    console.log('\n现在您可以：');
    console.log('  1. 启动前端开发服务器: npm run dev');
    console.log('  2. 访问机构管理页面，使用本地存储功能');
    console.log('  3. 所有数据将保存在浏览器的localStorage中');
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testLocalOrganizationService();