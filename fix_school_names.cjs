const { createClient } = require('@supabase/supabase-js')

// 创建Supabase客户端
const supabase = createClient(
  'http://127.0.0.1:54322',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

async function fixSchoolNames() {
  console.log('=== 修复学校名称显示问题 ===')
  
  try {
    // 首先检查是否有学校表
    console.log('\n1. 检查学校相关表:')
    
    // 尝试查找学校表
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('*')
      .limit(10)
    
    if (schoolsError) {
      console.log('schools表不存在，尝试查找其他学校相关表...')
    } else {
      console.log(`找到 ${schools.length} 条学校记录:`)
      schools.forEach((school, index) => {
        console.log(`  ${index + 1}. ID: ${school.id}, 名称: ${school.name || '无'}`)
      })
    }
    
    // 检查teaching_demands表中的数据
    console.log('\n2. 检查teaching_demands表:')
    const { data: demands, error: demandsError } = await supabase
      .from('teaching_demands')
      .select('*')
      .limit(10)
    
    if (demandsError) {
      console.error('查询teaching_demands表失败:', demandsError)
      return
    }
    
    console.log(`找到 ${demands.length} 条需求记录:`)
    
    // 创建学校ID到名称的映射
    const schoolMap = {
      '1': '比奇堡大学',
      '2': '比奇堡大学',  // 假设2也是比奇堡大学
      '3': '清华大学',
      '4': '北京大学',
      '5': '北京市教育局'
    }
    
    // 更新teaching_demands表中的学校名称
    console.log('\n3. 更新学校名称:')
    for (const demand of demands) {
      const schoolId = demand.organization || demand.school_name
      const schoolName = schoolMap[schoolId] || `学校${schoolId}`
      
      console.log(`  更新需求ID ${demand.id}: ${schoolId} -> ${schoolName}`)
      
      // 更新数据库中的学校名称
      const { error: updateError } = await supabase
        .from('teaching_demands')
        .update({ 
          organization: schoolName,
          school_name: schoolName 
        })
        .eq('id', demand.id)
      
      if (updateError) {
        console.error(`  更新失败:`, updateError)
      } else {
        console.log(`  更新成功`)
      }
    }
    
    console.log('\n4. 验证更新结果:')
    const { data: updatedDemands, error: updatedError } = await supabase
      .from('teaching_demands')
      .select('*')
      .limit(10)
    
    if (updatedError) {
      console.error('验证更新失败:', updatedError)
    } else {
      console.log('更新后的需求记录:')
      updatedDemands.forEach((demand, index) => {
        console.log(`  ${index + 1}. ID: ${demand.id}, 学校: ${demand.organization || demand.school_name || '无'}, 学科: ${demand.subject || '无'}`)
      })
    }
    
  } catch (error) {
    console.error('修复学校名称时发生错误:', error)
  }
}

fixSchoolNames()