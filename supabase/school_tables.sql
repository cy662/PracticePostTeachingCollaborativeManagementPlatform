-- 需求申报数据表创建SQL

-- 1. 教学需求表（teaching_demands）
CREATE TABLE IF NOT EXISTS teaching_demands (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(100) NOT NULL,           -- 学科
  grade VARCHAR(100) NOT NULL,             -- 年级
  demand_count INTEGER NOT NULL DEFAULT 1, -- 需求人数
  duration VARCHAR(100) NOT NULL,          -- 支教时间
  urgency VARCHAR(20) NOT NULL,            -- 紧急程度（high, medium, low）
  special_requirements TEXT,               -- 特殊要求
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 状态（draft, pending, approved, rejected）
  organization VARCHAR(200) NOT NULL,      -- 学校名称（与user_profiles表中的organization对应）
  created_by UUID NOT NULL,                -- 创建人ID（关联Supabase Auth用户）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  
  -- 添加外键约束关联用户表
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_teaching_demands_organization ON teaching_demands(organization);
CREATE INDEX IF NOT EXISTS idx_teaching_demands_status ON teaching_demands(status);
CREATE INDEX IF NOT EXISTS idx_teaching_demands_created_by ON teaching_demands(created_by);

-- 2. 教师评价表（teacher_evaluations）
CREATE TABLE IF NOT EXISTS teacher_evaluations (
  id SERIAL PRIMARY KEY,
  teacher_name VARCHAR(100) NOT NULL,           -- 教师姓名
  teacher_id UUID,                              -- 教师ID（如果有）
  subject VARCHAR(100) NOT NULL,                -- 任教科目
  grade VARCHAR(100) NOT NULL,                  -- 任教年级
  school_name VARCHAR(200) NOT NULL,            -- 学校名称
  period VARCHAR(100) NOT NULL,                 -- 评价周期
  deadline DATE,                                -- 截止时间
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 状态（pending, completed）
  
  -- 评价分数字段
  score INTEGER,                                -- 总分
  teaching_content_score INTEGER,               -- 教学内容掌握
  teaching_method_score INTEGER,                -- 教学方法运用
  classroom_management_score INTEGER,           -- 课堂管理能力
  responsibility_score INTEGER,                 -- 工作责任心
  teamwork_score INTEGER,                       -- 团队协作
  learning_progress_score INTEGER,              -- 学习进步
  overall_score INTEGER,                        -- 总体评分
  
  -- 评价内容字段
  comments TEXT,                                -- 评语
  suggestions TEXT,                             -- 改进建议
  
  -- 时间和创建人字段
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  evaluated_at TIMESTAMP WITH TIME ZONE,        -- 评价时间
  created_by UUID,                              -- 创建评价任务的人
  evaluated_by UUID,                            -- 执行评价的人
  
  -- 添加外键约束
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  FOREIGN KEY (evaluated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_teacher_evaluations_school_name ON teacher_evaluations(school_name);
CREATE INDEX IF NOT EXISTS idx_teacher_evaluations_status ON teacher_evaluations(status);
CREATE INDEX IF NOT EXISTS idx_teacher_evaluations_teacher_id ON teacher_evaluations(teacher_id);

-- 3. 如果需要示例数据，可以取消下面的注释并执行
/*
-- 插入示例教学需求数据
INSERT INTO teaching_demands (subject, grade, demand_count, duration, urgency, special_requirements, status, organization, created_by)
VALUES 
('数学', '高一', 2, '2024-2025学年第一学期', 'high', '需要有高中教学经验', 'draft', '示例中学', (SELECT id FROM auth.users LIMIT 1)),
('英语', '初二', 1, '2024-2025学年第一学期', 'medium', '英语专业优先', 'pending', '示例中学', (SELECT id FROM auth.users LIMIT 1));

-- 插入示例教师评价数据
INSERT INTO teacher_evaluations (teacher_name, subject, grade, school_name, period, deadline, status)
VALUES
('张三', '数学', '高一', '示例中学', '2023-2024学年第一学期', '2024-07-31', 'pending'),
('李四', '语文', '初二', '示例中学', '2023-2024学年第一学期', '2024-07-31', 'pending');
*/

-- 4. 创建视图便于前端查询统计数据
CREATE OR REPLACE VIEW demand_statistics AS
SELECT 
  organization,
  COUNT(*) AS total_demands,
  SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_count,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
  SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
  SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count
FROM teaching_demands
GROUP BY organization;

-- 5. 创建评价统计视图
CREATE OR REPLACE VIEW evaluation_statistics AS
SELECT
  school_name,
  COUNT(*) AS total_evaluations,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
  AVG(score) AS avg_score
FROM teacher_evaluations
GROUP BY school_name;

-- 6. 授予必要的权限（在Supabase中通常由系统自动处理，但如果需要可以执行）
GRANT ALL ON TABLE teaching_demands TO authenticated;
GRANT ALL ON TABLE teacher_evaluations TO authenticated;
GRANT SELECT ON TABLE demand_statistics TO authenticated;
GRANT SELECT ON TABLE evaluation_statistics TO authenticated;