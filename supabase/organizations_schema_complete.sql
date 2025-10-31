-- 机构管理表完整SQL脚本
-- 支持三种主要机构类型：大学(university)、政府(government)、学校(school)

-- 1. 创建机构类型枚举（区分三种机构类型）
CREATE TYPE organization_type AS ENUM ('university', 'government', 'school', 'other');

-- 2. 创建机构表
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,                    -- 机构名称
    type organization_type NOT NULL,               -- 机构类型（区分三种机构）
    code VARCHAR(50) UNIQUE,                       -- 机构代码（唯一标识）
    contact_person VARCHAR(100),                   -- 联系人姓名
    contact_phone VARCHAR(20),                     -- 联系电话
    email VARCHAR(100),                            -- 邮箱
    address TEXT,                                  -- 地址
    description TEXT,                              -- 机构描述
    status VARCHAR(20) DEFAULT 'active',           -- 状态：active/inactive
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE, -- 创建者
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  -- 更新时间
);

-- 3. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type); -- 按机构类型索引
CREATE INDEX IF NOT EXISTS idx_organizations_code ON organizations(code);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);

-- 4. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_organizations_updated_at();

-- 5. 启用行级安全策略（RLS）
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 6. 创建策略：超级管理员可以管理所有机构
CREATE POLICY "超级管理员可以管理所有机构" ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_management 
            WHERE admin_management.admin_id = auth.uid() 
            AND admin_management.role = 'super_admin'
        )
    );

-- 7. 创建策略：机构管理员只能查看和管理自己创建的机构
CREATE POLICY "机构管理员可以管理自己创建的机构" ON organizations
    FOR ALL USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_management 
            WHERE admin_management.admin_id = auth.uid() 
            AND admin_management.role = 'super_admin'
        )
    );

-- 8. 插入示例数据（包含三种机构类型）
INSERT INTO organizations (name, type, code, contact_person, contact_phone, email, address, description, created_by)
VALUES 
    -- 大学类型示例
    ('清华大学', 'university', 'THU001', '张校长', '13800138001', 'contact@tsinghua.edu.cn', '北京市海淀区清华园', '中国著名高等学府', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'),
    ('北京大学', 'university', 'PKU001', '李主任', '13800138002', 'contact@pku.edu.cn', '北京市海淀区', '中国顶尖综合性大学', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'),
    
    -- 政府类型示例
    ('北京市教育局', 'government', 'BJEDU001', '王处长', '13800138003', 'contact@bjedu.gov.cn', '北京市西城区', '北京市教育主管部门', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'),
    ('上海市教育局', 'government', 'SHEDU001', '陈主任', '13800138004', 'contact@shed.gov.cn', '上海市黄浦区', '上海市教育主管部门', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'),
    
    -- 学校类型示例
    ('北京市第一实验小学', 'school', 'BJSY001', '刘老师', '13800138005', 'contact@bjsy.edu.cn', '北京市西城区', '北京市重点小学', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'),
    ('上海市第一中学', 'school', 'SHYZ001', '赵校长', '13800138006', 'contact@shyz.edu.cn', '上海市静安区', '上海市重点中学', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc')
ON CONFLICT (code) DO NOTHING;

-- 9. 注释说明
COMMENT ON TABLE organizations IS '机构信息表，存储大学、政府、学校等机构的基本信息';
COMMENT ON COLUMN organizations.name IS '机构名称';
COMMENT ON COLUMN organizations.type IS '机构类型：university(大学)/government(政府)/school(学校)/other(其他)';
COMMENT ON COLUMN organizations.code IS '机构代码，唯一标识';
COMMENT ON COLUMN organizations.contact_person IS '联系人姓名';
COMMENT ON COLUMN organizations.contact_phone IS '联系电话';
COMMENT ON COLUMN organizations.email IS '邮箱地址';
COMMENT ON COLUMN organizations.address IS '机构地址';
COMMENT ON COLUMN organizations.description IS '机构描述';
COMMENT ON COLUMN organizations.status IS '机构状态：active(活跃)/inactive(停用)';
COMMENT ON COLUMN organizations.created_by IS '创建者ID';
COMMENT ON COLUMN organizations.created_at IS '创建时间';
COMMENT ON COLUMN organizations.updated_at IS '更新时间';

-- 10. 创建视图便于查询三种机构的详细信息
CREATE OR REPLACE VIEW organization_details AS
SELECT 
    o.*,
    up.name as creator_name,
    up.phone_number as creator_phone
FROM organizations o
LEFT JOIN user_profiles up ON o.created_by = up.id;

-- 11. 创建视图按机构类型统计
CREATE OR REPLACE VIEW organization_type_statistics AS
SELECT 
    type,
    COUNT(*) as total_count,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
FROM organizations
GROUP BY type
ORDER BY type;