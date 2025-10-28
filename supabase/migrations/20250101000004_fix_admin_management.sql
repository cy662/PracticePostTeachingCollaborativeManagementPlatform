-- 修复管理员管理功能
-- 1. 修改user_profiles表结构，使其不依赖auth.users
-- 2. 更新权限策略，允许超级管理员管理所有用户

-- 首先备份现有数据
CREATE TABLE IF NOT EXISTS user_profiles_backup AS SELECT * FROM user_profiles;
CREATE TABLE IF NOT EXISTS admin_management_backup AS SELECT * FROM admin_management;

-- 删除现有表（级联删除相关对象）
DROP TABLE IF EXISTS admin_management CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 重新创建user_profiles表（不依赖auth.users）
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    organization TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'university', 'government', 'school')),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 重新创建admin_management表
CREATE TABLE admin_management (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    managed_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('university', 'government', 'school')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- 启用行级安全
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_management ENABLE ROW LEVEL SECURITY;

-- 创建宽松的权限策略（允许匿名访问，便于演示）
CREATE POLICY "允许所有人查看用户档案" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "允许所有人插入用户档案" ON user_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "允许所有人更新用户档案" ON user_profiles
    FOR UPDATE USING (true);

CREATE POLICY "允许所有人查看管理员管理" ON admin_management
    FOR SELECT USING (true);

CREATE POLICY "允许所有人插入管理员管理" ON admin_management
    FOR INSERT WITH CHECK (true);

CREATE POLICY "允许所有人更新管理员管理" ON admin_management
    FOR UPDATE USING (true);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_admin_management_admin_id ON admin_management(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_management_managed_by ON admin_management(managed_by);

-- 重新插入演示数据
INSERT INTO user_profiles (id, phone_number, name, organization, role) VALUES
    ('6500cb29-35b4-4863-a75e-5e38cf703cdd', '13800138000', '超级管理员', '平台管理部', 'super_admin'),
    ('d483908b-9db0-49df-8513-1ff6fb51534f', '13800138001', '张老师', '清华大学', 'university'),
    ('65616a9b-ad48-4d35-a42f-f6ac8e04a264', '13800138002', '李主任', '教育部', 'government'),
    ('df6bfcfd-bbf4-4f69-bac4-148f37a0fae7', '13800138003', '王校长', '北京市第一中学', 'school');

-- 先删除可能存在的重复数据
DELETE FROM admin_management WHERE admin_id IN (
    'd483908b-9db0-49df-8513-1ff6fb51534f',
    '65616a9b-ad48-4d35-a42f-f6ac8e04a264', 
    'df6bfcfd-bbf4-4f69-bac4-148f37a0fae7'
);

-- 插入管理员数据，使用不同的创建时间
INSERT INTO admin_management (admin_id, managed_by, role, status, created_by, created_at) VALUES
    ('d483908b-9db0-49df-8513-1ff6fb51534f', '6500cb29-35b4-4863-a75e-5e38cf703cdd', 'university', 'active', '6500cb29-35b4-4863-a75e-5e38cf703cdd', '2025-10-25 09:00:00+00'),
    ('65616a9b-ad48-4d35-a42f-f6ac8e04a264', '6500cb29-35b4-4863-a75e-5e38cf703cdd', 'government', 'active', '6500cb29-35b4-4863-a75e-5e38cf703cdd', '2025-10-26 14:30:00+00'),
    ('df6bfcfd-bbf4-4f69-bac4-148f37a0fae7', '6500cb29-35b4-4863-a75e-5e38cf703cdd', 'school', 'pending', '6500cb29-35b4-4863-a75e-5e38cf703cdd', '2025-10-27 16:45:00+00'),
    -- 添加历史数据
    ('993e13bd-1234-5678-90ab-cdef12345678', '6500cb29-35b4-4863-a75e-5e38cf703cdd', 'university', 'inactive', '6500cb29-35b4-4863-a75e-5e38cf703cdd', '2025-09-15 10:00:00+00'),
    ('5cc93733-1234-5678-90ab-cdef12345679', '6500cb29-35b4-4863-a75e-5e38cf703cdd', 'school', 'active', '6500cb29-35b4-4863-a75e-5e38cf703cdd', '2025-09-20 14:00:00+00'),
    ('fdd6033d-1234-5678-90ab-cdef12345680', '6500cb29-35b4-4863-a75e-5e38cf703cdd', 'government', 'active', '6500cb29-35b4-4863-a75e-5e38cf703cdd', '2025-10-01 08:30:00+00'),
    ('d07de022-1234-5678-90ab-cdef12345681', '6500cb29-35b4-4863-a75e-5e38cf703cdd', 'university', 'active', '6500cb29-35b4-4863-a75e-5e38cf703cdd', '2025-10-10 11:20:00+00');

-- 创建视图便于统计
CREATE OR REPLACE VIEW admin_statistics AS
SELECT
    role,
    COUNT(*) as total_admins,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM admin_management
GROUP BY role;