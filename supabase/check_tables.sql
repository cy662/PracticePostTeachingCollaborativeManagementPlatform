-- 检查数据库表结构
\dt

-- 检查teaching_demands表结构
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'teaching_demands' 
ORDER BY ordinal_position;

-- 检查position_student_assignments表结构
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'position_student_assignments' 
ORDER BY ordinal_position;

-- 检查students表结构
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- 检查视图是否存在
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%position%' 
ORDER BY table_name;