-- 添加学生分配信息相关字段和关联
-- 用于支持政府管理员查看岗位对应的学生信息

-- 1. 确保position_student_assignments表有正确的关联字段
ALTER TABLE position_student_assignments 
ADD COLUMN IF NOT EXISTS student_info JSONB,
ADD COLUMN IF NOT EXISTS assignment_details TEXT;

-- 2. 创建视图用于政府管理员查看岗位分配的学生信息
CREATE OR REPLACE VIEW government_position_assignments AS
SELECT 
    psa.id,
    psa.position_id,
    td.school_name,
    td.subject,
    td.grade,
    td.demand_count,
    td.status as demand_status,
    psa.student_id,
    s.name as student_name,
    s.student_id as student_number,
    s.major,
    s.grade as student_grade,
    s.phone,
    s.email,
    psa.assignment_status,
    psa.reviewed_at,
    psa.rejection_reason,
    psa.assigned_at,
    psa.assigned_by,
    u.email as assigned_by_email
FROM position_student_assignments psa
LEFT JOIN teaching_demands td ON psa.position_id = td.id
LEFT JOIN students s ON psa.student_id = s.id
LEFT JOIN auth.users u ON psa.assigned_by = u.id
WHERE psa.status = 'active';

-- 3. 创建视图用于统计每个岗位的分配情况
CREATE OR REPLACE VIEW position_assignment_summary AS
SELECT 
    td.id as position_id,
    td.school_name,
    td.subject,
    td.grade,
    td.demand_count,
    COUNT(psa.id) as assigned_count,
    COUNT(CASE WHEN psa.assignment_status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN psa.assignment_status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN psa.assignment_status = 'rejected' THEN 1 END) as rejected_count,
    STRING_AGG(DISTINCT s.name, ', ') as assigned_students
FROM teaching_demands td
LEFT JOIN position_student_assignments psa ON td.id = psa.position_id AND psa.status = 'active'
LEFT JOIN students s ON psa.student_id = s.id
GROUP BY td.id, td.school_name, td.subject, td.grade, td.demand_count;

-- 4. 授予政府管理员查看权限
GRANT SELECT ON government_position_assignments TO authenticated;
GRANT SELECT ON position_assignment_summary TO authenticated;

-- 5. 注释说明
COMMENT ON COLUMN position_student_assignments.student_info IS '学生信息快照（JSON格式）';
COMMENT ON COLUMN position_student_assignments.assignment_details IS '分配详情描述';
COMMENT ON VIEW government_position_assignments IS '政府管理员查看岗位分配信息的视图';
COMMENT ON VIEW position_assignment_summary IS '岗位分配情况统计视图';

-- 6. 更新现有数据（如果存在）
UPDATE position_student_assignments psa
SET student_info = jsonb_build_object(
    'name', s.name,
    'student_id', s.student_id,
    'major', s.major,
    'grade', s.grade,
    'phone', s.phone,
    'email', s.email
)
FROM students s
WHERE psa.student_id = s.id AND psa.student_info IS NULL;