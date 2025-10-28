-- 为teaching_demands表添加分配状态字段和与student_assignments的关联

-- 1. 修改teaching_demands表的status字段约束，增加'assigned'状态
ALTER TABLE teaching_demands
DROP CONSTRAINT IF EXISTS teaching_demands_role_check;

ALTER TABLE teaching_demands
ADD CONSTRAINT teaching_demands_status_check
CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'assigned'));

-- 2. 在student_assignments表中添加teaching_demand_id字段，关联到教学需求
ALTER TABLE student_assignments
ADD COLUMN IF NOT EXISTS teaching_demand_id INTEGER;

-- 3. 添加外键约束
ALTER TABLE student_assignments
ADD CONSTRAINT fk_student_assignments_teaching_demands
FOREIGN KEY (teaching_demand_id)
REFERENCES teaching_demands(id) ON DELETE SET NULL;

-- 4. 为新字段添加索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_student_assignments_teaching_demand_id 
ON student_assignments(teaching_demand_id);

-- 5. 更新已分配的岗位状态（可选，根据实际情况决定是否执行）
/*
WITH assigned_demands AS (
    SELECT DISTINCT sd.teaching_demand_id
    FROM student_assignments sd
    WHERE sd.teaching_demand_id IS NOT NULL
      AND sd.status = 'active'
)
UPDATE teaching_demands td
SET status = 'assigned'
FROM assigned_demands ad
WHERE td.id = ad.teaching_demand_id
  AND td.status = 'approved';
*/

-- 6. 更新视图以包含新的分配状态统计
drop view if exists demand_statistics;

CREATE OR REPLACE VIEW demand_statistics AS
SELECT 
  organization,
  COUNT(*) AS total_demands,
  SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_count,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
  SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
  SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) AS assigned_count,
  SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count
FROM teaching_demands
GROUP BY organization;

-- 7. 授予权限（确保应用可以访问这些变更）
GRANT ALL ON TABLE teaching_demands TO authenticated;
GRANT ALL ON TABLE student_assignments TO authenticated;
GRANT SELECT ON TABLE demand_statistics TO authenticated;