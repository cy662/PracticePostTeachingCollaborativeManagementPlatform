-- 禁用所有相关表的RLS限制
ALTER TABLE IF EXISTS teaching_demands DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS position_student_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;

-- 确认RLS状态
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname IN ('teaching_demands', 'position_student_assignments', 'students', 'user_profiles');