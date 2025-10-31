import { Client } from 'pg';

// 数据库连接配置
const client = new Client({
  host: '127.0.0.1',
  port: 54333,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres'
});

async function checkSchoolData() {
  try {
    console.log('🔍 正在检查学校数据...\n');
    await client.connect();
    
    // 1. 检查 teaching_demands 表结构
    console.log('1. 检查 teaching_demands 表结构...');
    const demandColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'teaching_demands'
      ORDER BY ordinal_position;
    `);
    
    console.log('teaching_demands 表字段:');
    demandColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 2. 检查 teaching_demands 表中的数据
    console.log('\n2. 检查 teaching_demands 表数据...');
    const demandsData = await client.query(`
      SELECT * FROM teaching_demands LIMIT 10;
    `);
    
    if (demandsData.rows.length > 0) {
      console.log('teaching_demands 表数据:');
      demandsData.rows.forEach((row, index) => {
        console.log(`\n   记录 ${index + 1}:`);
        console.log(`     ID: ${row.id}`);
        console.log(`     学校名称字段: ${row.school_name || '无'}`);
        console.log(`     学校ID字段: ${row.school_id || '无'}`);
        console.log(`     学科: ${row.subject || '无'}`);
        console.log(`     年级: ${row.grade || '无'}`);
        console.log(`     需求人数: ${row.demand_count || row.count || '无'}`);
        console.log(`     状态: ${row.status || '无'}`);
      });
    } else {
      console.log('teaching_demands 表为空');
    }
    
    // 3. 检查 organizations 表中的学校数据
    console.log('\n3. 检查 organizations 表中的学校数据...');
    const schoolsData = await client.query(`
      SELECT * FROM organizations WHERE type = 'school';
    `);
    
    if (schoolsData.rows.length > 0) {
      console.log('学校数据:');
      schoolsData.rows.forEach(school => {
        console.log(`   - ${school.name} (ID: ${school.id}) - ${school.code}`);
      });
    } else {
      console.log('organizations 表中没有学校数据');
    }
    
    // 4. 检查 teaching_demands 和 organizations 的关联关系
    console.log('\n4. 检查需求与学校的关联关系...');
    const demandSchoolRelation = await client.query(`
      SELECT 
        td.id as demand_id,
        td.school_name,
        td.school_id,
        o.name as org_name,
        o.id as org_id
      FROM teaching_demands td
      LEFT JOIN organizations o ON td.school_id = o.id
      LIMIT 10;
    `);
    
    if (demandSchoolRelation.rows.length > 0) {
      console.log('需求与学校关联关系:');
      demandSchoolRelation.rows.forEach(rel => {
        console.log(`\n   需求ID: ${rel.demand_id}`);
        console.log(`     学校名称字段: ${rel.school_name || '空'}`);
        console.log(`     学校ID字段: ${rel.school_id || '空'}`);
        console.log(`     关联的学校名称: ${rel.org_name || '未关联'}`);
        console.log(`     关联的学校ID: ${rel.org_id || '未关联'}`);
      });
    }
    
    // 5. 检查是否有比奇堡大学的数据
    console.log('\n5. 检查比奇堡大学数据...');
    const bikiniBottomData = await client.query(`
      SELECT * FROM organizations WHERE name ILIKE '%比奇堡%' OR name ILIKE '%bikini%';
    `);
    
    if (bikiniBottomData.rows.length > 0) {
      console.log('找到比奇堡大学数据:');
      bikiniBottomData.rows.forEach(org => {
        console.log(`   - ${org.name} (ID: ${org.id}) - ${org.type}`);
      });
    } else {
      console.log('未找到比奇堡大学数据');
    }
    
    console.log('\n✅ 数据检查完成！');
    
  } catch (error) {
    console.error('❌ 检查数据时发生错误:', error.message);
  } finally {
    await client.end();
    console.log('数据库连接已关闭');
  }
}

// 执行检查
checkSchoolData();