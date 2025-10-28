-- 岗位与学生分配关联表
-- 用于记录岗位与学生的分配关系，统计已分配学生数量

-- 1. 创建岗位与学生分配关联表
CREATE TABLE IF NOT EXISTS position_student_assignments (
  id SERIAL PRIMARY KEY,
  position_id INTEGER NOT NULL,                -- 岗位ID（关联teaching_demands表）
  student_id INTEGER NOT NULL,                 -- 学生ID（关联students表）
  
  -- 分配信息
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 分配时间
  assigned_by UUID NOT NULL,                   -- 分配人（大学管理员ID）
  
  -- 状态信息
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 状态（active, completed, terminated）
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 外键约束
  FOREIGN KEY (position_id) REFERENCES teaching_demands(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- 唯一约束，确保一个学生不会被重复分配到同一个岗位
  UNIQUE(position_id, student_id)
);

-- 2. 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_position_assignments_position_id ON position_student_assignments(position_id);
CREATE INDEX IF NOT EXISTS idx_position_assignments_student_id ON position_student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_position_assignments_status ON position_student_assignments(status);
CREATE INDEX IF NOT EXISTS idx_position_assignments_assigned_by ON position_student_assignments(assigned_by);

-- 3. 创建触发器自动更新更新时间
CREATE TRIGGER update_position_assignments_updated_at BEFORE UPDATE ON position_student_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. 创建视图统计每个岗位的已分配学生数量
CREATE OR REPLACE VIEW position_assignment_stats AS
SELECT 
  psa.position_id,
  COUNT(psa.student_id) AS assigned_count,
  td.demand_count,
  td.status AS position_status
FROM position_student_assignments psa
JOIN teaching_demands td ON psa.position_id = td.id
WHERE psa.status = 'active'
GROUP BY psa.position_id, td.demand_count, td.status;

-- 5. 授予必要的权限
GRANT ALL ON TABLE position_student_assignments TO authenticated;
GRANT SELECT ON TABLE position_assignment_stats TO authenticated;

-- 6. 创建行级安全策略（RLS）
ALTER TABLE position_student_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "大学管理员可以管理所有岗位分配" ON position_student_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'university'
        )
    );

-- 7. 插入示例数据（可选）
/*
-- 示例分配数据
INSERT INTO position_student_assignments (position_id, student_id, assigned_by)
VALUES 
(1, 1, (SELECT id FROM auth.users WHERE role = 'university' LIMIT 1)),
(1, 2, (SELECT id FROM auth.users WHERE role = 'university' LIMIT 1)),
(2, 3, (SELECT id FROM auth.users WHERE role = 'university' LIMIT 1));
*/

-- 8. 更新teaching_demands表，添加需求人数字段（如果不存在）
-- 注意：teaching_demands表已经有demand_count字段，这里确保字段存在
-- 如果demand_count字段不存在，可以执行以下语句：
-- ALTER TABLE teaching_demands ADD COLUMN IF NOT EXISTS demand_count INTEGER NOT NULL DEFAULT 1;