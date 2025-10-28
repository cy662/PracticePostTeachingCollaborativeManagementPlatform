-- 添加超级管理员角色支持
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('super_admin', 'university', 'government', 'school'));

-- 创建管理员管理表
CREATE TABLE IF NOT EXISTS admin_management (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    managed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('university', 'government', 'school')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    UNIQUE(admin_id, role)
);

-- 启用行级安全
ALTER TABLE admin_management ENABLE ROW LEVEL SECURITY;

-- 创建策略：超级管理员可以管理所有管理员
CREATE POLICY "Super admins can manage all admins" ON admin_management
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'super_admin'
        )
    );

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_admin_management_admin_id ON admin_management(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_management_managed_by ON admin_management(managed_by);
CREATE INDEX IF NOT EXISTS idx_admin_management_role ON admin_management(role);
CREATE INDEX IF NOT EXISTS idx_admin_management_status ON admin_management(status);

-- 创建视图便于统计管理员数量
CREATE OR REPLACE VIEW admin_statistics AS
SELECT 
    role,
    COUNT(*) AS total_admins,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive_count,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count
FROM admin_management
GROUP BY role;