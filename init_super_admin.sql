-- 初始化超级管理员脚本
-- 这个脚本用于创建默认的超级管理员账户

-- 1. 创建超级管理员用户档案
INSERT INTO user_profiles (
    id,
    phone_number,
    name,
    organization,
    role,
    password_hash
) VALUES (
    gen_random_uuid(),
    '13800138000',
    '超级管理员',
    '系统管理',
    'super_admin',
    md5('admin123') -- 默认密码: admin123
) ON CONFLICT (phone_number) DO NOTHING;

-- 2. 将超级管理员添加到管理员管理表
INSERT INTO admin_management (
    admin_id,
    managed_by,
    role,
    status,
    created_by
)
SELECT 
    up.id,
    up.id, -- 超级管理员自己管理自己
    'super_admin',
    'active',
    up.id
FROM user_profiles up
WHERE up.phone_number = '13800138000'
AND NOT EXISTS (
    SELECT 1 FROM admin_management am 
    WHERE am.admin_id = up.id
);

-- 3. 检查是否创建成功
SELECT '超级管理员初始化完成' as message;
SELECT id, phone_number, name, role FROM user_profiles WHERE phone_number = '13800138000';