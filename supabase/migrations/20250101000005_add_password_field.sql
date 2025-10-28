-- 添加密码字段到user_profiles表
-- 修改登录逻辑以使用存储的密码

-- 添加密码字段到user_profiles表
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 更新现有用户的密码（使用默认密码admin123456的哈希值）
-- 注意：这里使用简单的MD5哈希作为示例，实际生产环境应该使用更安全的哈希算法
UPDATE user_profiles
SET password_hash = md5('admin123456')
WHERE password_hash IS NULL;

-- 为超级管理员设置特定密码
UPDATE user_profiles
SET password_hash = md5('admin123456')
WHERE phone_number = '13800138000';

-- 创建函数来验证密码
CREATE OR REPLACE FUNCTION verify_password(phone TEXT, password TEXT)
RETURNS TABLE(id UUID, name TEXT, organization TEXT, role TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT up.id, up.name, up.organization, up.role
    FROM user_profiles up
    WHERE up.phone_number = phone
    AND up.password_hash = md5(password);
END;
$$ LANGUAGE plpgsql;

-- 创建函数来设置密码
CREATE OR REPLACE FUNCTION set_user_password(phone TEXT, new_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_profiles
    SET password_hash = md5(new_password)
    WHERE phone_number = phone;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;