-- 为演示模式优化管理员管理功能
-- 修改 user_profiles 表，使其在演示模式下更灵活

-- 首先备份现有数据（如果存在）
CREATE TABLE IF NOT EXISTS user_profiles_backup AS SELECT * FROM user_profiles;

-- 删除现有表
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 重新创建 user_profiles 表，支持演示模式
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    organization TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'university', 'government', 'school')),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 重新创建 admin_management 表
DROP TABLE IF EXISTS admin_management CASCADE;

CREATE TABLE admin_management (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    managed_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('university', 'government', 'school')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- 启用行级安全
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_management ENABLE ROW LEVEL SECURITY;

-- 创建策略：演示模式下允许所有操作
CREATE POLICY "Demo mode full access" ON user_profiles
    FOR ALL USING (true);

CREATE POLICY "Demo mode full access admin" ON admin_management
    FOR ALL USING (true);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_id ON user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_management_admin_id ON admin_management(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_management_managed_by ON admin_management(managed_by);
CREATE INDEX IF NOT EXISTS idx_admin_management_role ON admin_management(role);
CREATE INDEX IF NOT EXISTS idx_admin_management_status ON admin_management(status);

-- 重新创建视图便于统计管理员数量
CREATE OR REPLACE VIEW admin_statistics AS
SELECT 
    role,
    COUNT(*) AS total_admins,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive_count,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count
FROM admin_management
GROUP BY role;

-- 插入演示数据（使用有效的UUID格式）
INSERT INTO user_profiles (phone_number, name, organization, role) VALUES
('13800138000', '超级管理员', '平台管理部', 'super_admin'),
('13800138001', '张老师', '清华大学', 'university'),
('13800138002', '李主任', '教育部', 'government'),
('13800138003', '王校长', '北京市第一中学', 'school');

-- 获取插入的用户ID并插入到管理员管理表
WITH user_ids AS (
  SELECT id, phone_number, role FROM user_profiles 
  WHERE phone_number IN ('13800138000', '13800138001', '13800138002', '13800138003')
)
INSERT INTO admin_management (admin_id, managed_by, role, status, created_by)
SELECT 
  u.id as admin_id,
  (SELECT id FROM user_profiles WHERE phone_number = '13800138000') as managed_by,
  u.role,
  'active' as status,
  (SELECT id FROM user_profiles WHERE phone_number = '13800138000') as created_by
FROM user_ids u
WHERE u.phone_number != '13800138000';