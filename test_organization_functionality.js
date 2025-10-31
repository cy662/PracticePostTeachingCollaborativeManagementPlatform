import { supabase } from './src/lib/supabaseClient.js'

async function testOrganizationFunctionality() {
  console.log('🧪 开始测试组织管理功能...\n')

  try {
    // 1. 测试查询所有机构
    console.log('1. 测试查询所有机构...')
    const { data: allOrgs, error: queryError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (queryError) {
      console.error('❌ 查询机构失败:', queryError)
      return
    }

    console.log(`✅ 查询成功，共找到 ${allOrgs.length} 个机构`)
    allOrgs.forEach(org => {
      console.log(`   - ${org.name} (${org.type}) - ${org.code}`)
    })

    // 2. 测试按条件搜索
    console.log('\n2. 测试按条件搜索...')
    const { data: universityOrgs, error: searchError } = await supabase
      .from('organizations')
      .select('*')
      .eq('type', 'university')

    if (searchError) {
      console.error('❌ 搜索机构失败:', searchError)
      return
    }

    console.log(`✅ 搜索成功，找到 ${universityOrgs.length} 个大学机构`)

    // 3. 测试添加新机构
    console.log('\n3. 测试添加新机构...')
    const newOrg = {
      name: '测试机构',
      type: 'other',
      code: 'TEST001',
      contact_person: '测试联系人',
      contact_phone: '13800138000',
      email: 'test@example.com',
      address: '测试地址',
      description: '这是一个测试机构',
      created_by: '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'
    }

    const { data: insertedOrg, error: insertError } = await supabase
      .from('organizations')
      .insert([newOrg])
      .select()

    if (insertError) {
      console.error('❌ 添加机构失败:', insertError)
      return
    }

    console.log('✅ 添加机构成功:', insertedOrg[0].name)

    // 4. 测试编辑机构
    console.log('\n4. 测试编辑机构...')
    const updateData = {
      name: '更新后的测试机构',
      contact_person: '更新联系人'
    }

    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', insertedOrg[0].id)
      .select()

    if (updateError) {
      console.error('❌ 编辑机构失败:', updateError)
      return
    }

    console.log('✅ 编辑机构成功:', updatedOrg[0].name)

    // 5. 测试删除机构
    console.log('\n5. 测试删除机构...')
    const { error: deleteError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', insertedOrg[0].id)

    if (deleteError) {
      console.error('❌ 删除机构失败:', deleteError)
      return
    }

    console.log('✅ 删除机构成功')

    // 6. 验证最终数据
    console.log('\n6. 验证最终数据...')
    const { data: finalOrgs, error: finalError } = await supabase
      .from('organizations')
      .select('*')

    if (finalError) {
      console.error('❌ 最终验证失败:', finalError)
      return
    }

    console.log(`✅ 最终验证成功，系统中共有 ${finalOrgs.length} 个机构`)

    console.log('\n🎉 所有组织管理功能测试通过！')
    console.log('\n📋 功能清单：')
    console.log('   ✅ 查询所有机构')
    console.log('   ✅ 按条件搜索机构')
    console.log('   ✅ 添加新机构')
    console.log('   ✅ 编辑机构信息')
    console.log('   ✅ 删除机构')
    console.log('   ✅ 数据验证')

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 执行测试
testOrganizationFunctionality()