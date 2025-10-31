-- 修复 admin_management 表的角色约束
-- 当前约束只允许 'university', 'government', 'school'，需要添加 'super_admin'

-- 方法1：删除现有约束并重新创建
ALTER TABLE admin_management DROP CONSTRAINT IF EXISTS admin_management_role_check;

-- 创建新的约束，允许 super_admin 角色
ALTER TABLE admin_management 
ADD CONSTRAINT admin_management_role_check 
CHECK (role = ANY (ARRAY['university', 'government', 'school', 'super_admin']));

-- 方法2：或者使用更简洁的方式（如果约束名已知）
-- ALTER TABLE admin_management 
-- DROP CONSTRAINT admin_management_role_check,
-- ADD CONSTRAINT admin_management_role_check 
-- CHECK (role = ANY (ARRAY['university', 'government', 'school', 'super_admin']));

-- 验证约束已更新
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'admin_management_role_check' 
AND conrelid = 'admin_management'::regclass;