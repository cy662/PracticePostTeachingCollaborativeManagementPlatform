// 测试机构CRUD操作脚本
// 验证数据库模式下的完整功能

import { organizationService } from './src/api/organizationService.js';

async function testOrganizationCRUD() {
  console.log('=== 开始机构CRUD功能测试 ===\n');
  
  let testOrgId = null;
  
  try {
    // 1. 获取机构列表
    console.log('1. 获取机构列表测试...');
    const { data: orgList, totalCount } = await organizationService.getOrganizations();
    console.log(`✅ 成功获取机构列表，共${totalCount}条记录`);
    console.log('当前机构列表:', orgList.map(o => ({ id: o.id, name: o.name, type: o.type })));
    
    // 2. 添加新机构
    console.log('\n2. 添加新机构测试...');
    const newOrg = {
      name: '测试机构-' + Date.now(),
      code: 'TEST' + Math.floor(Math.random() * 10000),
      type: 'school',
      contact_person: '测试联系人',
      contact_phone: '13800138000',
      email: 'test@example.com',
      address: '测试地址',
      description: '这是一个测试机构，用于验证CRUD功能'
    };
    
    const createdOrg = await organizationService.addOrganization(newOrg);
    testOrgId = createdOrg.id;
    console.log('✅ 成功添加机构:', {
      id: createdOrg.id,
      name: createdOrg.name,
      code: createdOrg.code
    });
    
    // 3. 获取添加后的机构详情
    console.log('\n3. 获取机构详情测试...');
    const orgDetail = await organizationService.getOrganizationById(testOrgId);
    console.log('✅ 成功获取机构详情:', {
      id: orgDetail.id,
      name: orgDetail.name,
      type: orgDetail.type,
      description: orgDetail.description
    });
    
    // 4. 更新机构信息
    console.log('\n4. 更新机构测试...');
    const updateData = {
      name: '更新后的测试机构',
      description: '这是更新后的机构描述',
      contact_phone: '13900139000'
    };
    
    const updatedOrg = await organizationService.updateOrganization(testOrgId, updateData);
    console.log('✅ 成功更新机构:', {
      id: updatedOrg.id,
      name: updatedOrg.name,
      contact_phone: updatedOrg.contact_phone,
      description: updatedOrg.description
    });
    
    // 5. 搜索功能测试
    console.log('\n5. 搜索功能测试...');
    const searchResult = await organizationService.getOrganizations({ 
      search: '测试',
      page: 1,
      pageSize: 10
    });
    console.log(`✅ 搜索结果: 找到${searchResult.totalCount}条包含"测试"的记录`);
    console.log('搜索结果示例:', searchResult.data.map(o => ({ id: o.id, name: o.name })));
    
    // 6. 按类型过滤测试
    console.log('\n6. 按类型过滤测试...');
    const filteredResult = await organizationService.getOrganizations({ type: 'school' });
    console.log(`✅ 类型过滤: 找到${filteredResult.totalCount}条学校类型的记录`);
    
    // 7. 获取类型统计
    console.log('\n7. 获取机构类型统计测试...');
    const stats = await organizationService.getOrganizationTypeStats();
    console.log('✅ 机构类型统计:', stats);
    
    // 8. 删除测试机构
    console.log('\n8. 删除机构测试...');
    await organizationService.deleteOrganization(testOrgId);
    console.log('✅ 成功删除测试机构');
    
    // 验证删除是否成功
    const deletedOrg = await organizationService.getOrganizationById(testOrgId);
    console.log('删除验证:', deletedOrg ? '❌ 删除失败' : '✅ 删除成功');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
    
    // 如果有测试机构ID，尝试清理
    if (testOrgId) {
      try {
        await organizationService.deleteOrganization(testOrgId);
        console.log('已清理测试机构');
      } catch (cleanupError) {
        console.error('清理失败:', cleanupError.message);
      }
    }
  }
  
  console.log('\n=== 测试完成 ===');
}

// 运行测试
testOrganizationCRUD();