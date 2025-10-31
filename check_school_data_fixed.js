const { createClient } = require('@supabase/supabase-js')

// 创建Supabase客户端
const supabase = createClient(
  'http://127.0.0.1:54322',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

async function checkSchoolData() {
  console.log('=== 检查学校数据 ===')
  
  try {
    // 检查teaching_demands表中的数据
    console.log('\n1. 检查teaching_demands表:')
    const { data: demands, error: demandsError } = await supabase
      .from('teaching_demands')
      .select('*')
      .limit(10)
    
    if (demandsError) {
      console.error('查询teaching_demands表失败:', demandsError)
    } else {
      console.log(`找到 ${demands.length} 条需求记录:`)
      demands.forEach((demand, index) => {
        console.log(`  ${index + 1}. ID: ${demand.id}, 学校: ${demand.organization || demand.school_name || '无'}, 学科: ${demand.subject || '无'}`)
      })
    }
    
    // 检查organizations表是否存在
    console.log('\n2. 检查organizations表:')
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .limit(10)
    
    if (orgsError) {
      console.error('查询organizations表失败:', orgsError)
      console.log('organizations表可能不存在')
    } else {
      console.log(`找到 ${orgs.length} 条机构记录:`)
      orgs.forEach((org, index) => {
        console.log(`  ${index + 1}. ID: ${org.id}, 名称: ${org.name || '无'}, 类型: ${org.type || '无'}`)
      })
    }
    
    // 检查所有表
    console.log('\n3. 检查数据库中的所有表:')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tablesError) {
      console.error('查询表信息失败:', tablesError)
    } else {
      console.log('数据库中的表:')
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`)
      })
    }
    
  } catch (error) {
    console.error('检查数据时发生错误:', error)
  }
}

checkSchoolData()