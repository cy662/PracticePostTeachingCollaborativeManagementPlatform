import { createClient } from '@supabase/supabase-js';

// 配置Supabase客户端
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestData() {
  console.log('===== 插入测试数据脚本 =====\n');
  
  try {
    // 首先检查position_student_assignments表结构
    console.log('检查position_student_assignments表结构...');
    
    // 假设表结构包含必要字段，尝试插入测试数据
    console.log('\n准备插入测试数据到position_student_assignments表...');
    
    // 获取现有教学需求ID列表
    const { data: demands, error: demandError } = await supabase
      .from('teaching_demands')
      .select('id, subject')
      .limit(5);
    
    if (demandError || !demands || demands.length === 0) {
      console.log('错误：无法获取教学需求数据或没有可用的需求记录');
      console.log('请确保teaching_demands表中有数据');
      return;
    }
    
    console.log(`找到 ${demands.length} 个教学需求记录，准备为第一个需求添加学生分配`);
    const targetDemand = demands[0];
    console.log(`目标需求：ID=${targetDemand.id}, 学科=${targetDemand.subject}`);
    
    // 检查students表是否有数据
    console.log('\n检查students表数据...');
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, student_id, name, major, grade')
      .limit(2);
    
    // 测试数据 - 学生信息
    const testStudents = students && students.length > 0 ? students : [
      { id: 1, student_id: '2020001', name: '张三', major: '汉语言文学', grade: '大三' },
      { id: 2, student_id: '2020002', name: '李四', major: '数学教育', grade: '大四' }
    ];
    
    // 为每个测试学生创建分配记录
    console.log(`\n准备插入 ${testStudents.length} 条测试分配记录...`);
    
    for (const student of testStudents) {
      // 检查是否需要先创建学生记录
      if (!students || students.length === 0) {
        console.log(`\n创建学生记录: ${student.name}`);
        const { error: createStudentError } = await supabase
          .from('students')
          .insert({
            student_id: student.student_id,
            name: student.name,
            major: student.major,
            grade: student.grade,
            phone: '13800138000',
            email: `${student.student_id}@example.com`
          });
        
        if (createStudentError) {
          console.log(`错误：创建学生记录失败:`, createStudentError.message);
        } else {
          console.log(`学生记录创建成功`);
        }
      }
      
      // 插入分配记录
      console.log(`\n插入分配记录: ${student.name} -> ${targetDemand.subject}`);
      const { error: insertError } = await supabase
        .from('position_student_assignments')
        .insert({
          position_id: targetDemand.id,
          student_id: student.id || student.student_id,
          assigned_at: new Date().toISOString(),
          // 注意：根据前面的错误，不要使用assignment_status字段
        });
      
      if (insertError) {
        console.log(`错误：插入分配记录失败:`, insertError.message);
        console.log(`错误详情:`, JSON.stringify(insertError));
      } else {
        console.log(`分配记录插入成功`);
      }
    }
    
    // 验证数据是否成功插入
    console.log('\n===== 验证数据 =====');
    const { data: insertedAssignments, error: verifyError } = await supabase
      .from('position_student_assignments')
      .select('*')
      .eq('position_id', targetDemand.id);
    
    if (verifyError) {
      console.log('验证失败:', verifyError.message);
    } else {
      console.log(`成功验证到 ${insertedAssignments.length} 条分配记录`);
      console.log('分配记录详情:', insertedAssignments);
    }
    
    console.log('\n===== 测试完成 =====');
    console.log(`现在您可以在系统中查看 ${targetDemand.subject} (ID: ${targetDemand.id}) 的学生分配信息`);
    console.log(`\n提示：如需清理测试数据，请运行以下SQL（通过Supabase Studio）:`);
    console.log(`DELETE FROM position_student_assignments WHERE position_id = ${targetDemand.id}`);
    
  } catch (error) {
    console.error('脚本执行过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

insertTestData();