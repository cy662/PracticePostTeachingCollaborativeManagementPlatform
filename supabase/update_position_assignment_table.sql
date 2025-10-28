-- 更新岗位与学生分配关联表，添加审核相关字段
-- 用于支持政府管理员对分配信息的审核功能

-- 1. 添加审核相关字段到position_student_assignments表
ALTER TABLE position_student_assignments 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS assignment_status VARCHAR(20) DEFAULT 'pending'; -- pending, approved, rejected

-- 2. 添加审核人外键约束
ALTER TABLE position_student_assignments 
ADD CONSTRAINT fk_position_assignments_reviewed_by 
FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. 创建索引优化审核相关查询
CREATE INDEX IF NOT EXISTS idx_position_assignments_reviewed_at ON position_student_assignments(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_position_assignments_reviewed_by ON position_student_assignments(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_position_assignments_assignment_status ON position_student_assignments(assignment_status);

-- 4. 更新视图以包含审核状态
CREATE OR REPLACE VIEW position_assignment_stats AS
SELECT 
  psa.position_id,
  COUNT(psa.student_id) AS assigned_count,
  td.demand_count,
  td.status AS position_status,
  psa.assignment_status AS review_status
FROM position_student_assignments psa
JOIN teaching_demands td ON psa.position_id = td.id
WHERE psa.status = 'active'
GROUP BY psa.position_id, td.demand_count, td.status, psa.assignment_status;

-- 5. 更新行级安全策略，允许政府管理员查看和审核分配信息
CREATE POLICY "政府管理员可以查看和审核所有岗位分配" ON position_student_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'government'
        )
    );

-- 6. 创建触发器自动更新审核时间
CREATE OR REPLACE FUNCTION update_assignment_reviewed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assignment_status != OLD.assignment_status THEN
        NEW.reviewed_at = NOW();
        NEW.reviewed_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assignment_reviewed_at_trigger 
    BEFORE UPDATE ON position_student_assignments
    FOR EACH ROW EXECUTE FUNCTION update_assignment_reviewed_at();

-- 7. 注释说明
COMMENT ON COLUMN position_student_assignments.reviewed_at IS '审核时间';
COMMENT ON COLUMN position_student_assignments.reviewed_by IS '审核人ID';
COMMENT ON COLUMN position_student_assignments.rejection_reason IS '驳回原因';
COMMENT ON COLUMN position_student_assignments.assignment_status IS '审核状态：pending-待审核, approved-已通过, rejected-已驳回';

-- 8. 更新现有数据的审核状态（如果存在）
UPDATE position_student_assignments 
SET assignment_status = 'approved' 
WHERE assignment_status IS NULL AND status = 'active';

-- 9. 创建政府管理员审核日志表（可选）
CREATE TABLE IF NOT EXISTS assignment_review_logs (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES position_student_assignments(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    review_reason TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为审核日志表创建索引
CREATE INDEX IF NOT EXISTS idx_review_logs_assignment_id ON assignment_review_logs(assignment_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_reviewer_id ON assignment_review_logs(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_reviewed_at ON assignment_review_logs(reviewed_at);

-- 10. 授予权限
GRANT ALL ON TABLE assignment_review_logs TO authenticated;
GRANT SELECT ON TABLE assignment_review_logs TO authenticated;