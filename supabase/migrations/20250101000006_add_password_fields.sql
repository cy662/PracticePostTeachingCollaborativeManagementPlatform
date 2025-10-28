-- 添加密码相关字段和强制修改密码功能
-- 1. 为user_profiles表添加密码字段和强制修改密码标记
-- 2. 创建密码验证和更新函数

-- 为user_profiles表添加密码相关字段
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP WITH TIME ZONE;

-- 创建密码验证函数
CREATE OR REPLACE FUNCTION verify_password(phone TEXT, password TEXT)
RETURNS TABLE(user_id UUID, name TEXT, role TEXT, require_password_change BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id as user_id,
        up.name,
        up.role,
        up.require_password_change
    FROM user_profiles up
    WHERE up.phone_number = phone
    AND (
        -- 检查密码是否正确（使用简单的MD5哈希比较）
        (up.password_hash IS NOT NULL AND up.password_hash = MD5(password)) OR
        -- 或者使用默认密码
        (up.password_hash IS NULL AND password = 'admin123456')
    );
END;
$$;

-- 创建更新密码函数
CREATE OR REPLACE FUNCTION update_user_password(user_id UUID, new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE user_profiles 
    SET 
        password_hash = MD5(new_password),
        require_password_change = false,
        last_password_change = TIMEZONE('utc'::text, NOW()),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$;

-- 为现有用户设置默认密码标记
UPDATE user_profiles 
SET require_password_change = true 
WHERE password_hash IS NULL;

-- 为超级管理员设置不需要修改密码（因为已经使用默认密码）
UPDATE user_profiles 
SET require_password_change = false 
WHERE phone_number = '13800138000';

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_user_profiles_password ON user_profiles(phone_number, password_hash);