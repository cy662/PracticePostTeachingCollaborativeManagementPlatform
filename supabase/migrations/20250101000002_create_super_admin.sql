-- 创建超级管理员初始化脚本
-- 注意：在实际部署时，需要手动创建第一个超级管理员账户

-- 创建超级管理员账户的函数
CREATE OR REPLACE FUNCTION create_super_admin(
  phone_number TEXT,
  name TEXT,
  organization TEXT,
  password TEXT
) RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- 创建认证用户（需要在Supabase Auth中手动创建）
  -- 这里只是创建用户档案记录
  INSERT INTO user_profiles (
    id,
    phone_number,
    name,
    organization,
    role
  ) VALUES (
    gen_random_uuid(),
    phone_number,
    name,
    organization,
    'super_admin'
  ) RETURNING id INTO user_id;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建超级管理员管理记录的函数
CREATE OR REPLACE FUNCTION add_super_admin_to_management(
  admin_id UUID
) RETURNS VOID AS $$
BEGIN
  -- 超级管理员自己管理自己
  INSERT INTO admin_management (
    admin_id,
    managed_by,
    role,
    status,
    created_by
  ) VALUES (
    admin_id,
    admin_id,
    'super_admin',
    'active',
    admin_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建视图用于检查超级管理员权限
CREATE OR REPLACE VIEW super_admin_check AS
SELECT 
  up.id,
  up.name,
  up.phone_number,
  up.organization,
  up.role
FROM user_profiles up
WHERE up.role = 'super_admin';

-- 授予必要的权限
GRANT EXECUTE ON FUNCTION create_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION add_super_admin_to_management TO authenticated;
GRANT SELECT ON super_admin_check TO authenticated;