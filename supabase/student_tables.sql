-- 学生管理数据表创建SQL
-- 为大学生管理员设计的学生管理功能数据库结构

-- 1. 学生基本信息表（students）
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) UNIQUE NOT NULL,      -- 学号（唯一标识）
  name VARCHAR(100) NOT NULL,                 -- 学生姓名
  gender VARCHAR(10) NOT NULL,                -- 性别（male, female）
  birth_date DATE,                            -- 出生日期
  id_card VARCHAR(20),                        -- 身份证号
  phone VARCHAR(20),                          -- 联系电话
  email VARCHAR(100),                         -- 邮箱
  
  -- 学业信息
  major VARCHAR(100) NOT NULL,                -- 专业
  grade VARCHAR(20) NOT NULL,                 -- 年级（大一、大二、大三、大四）
  class_name VARCHAR(50),                     -- 班级
  admission_year INTEGER NOT NULL,             -- 入学年份
  graduation_year INTEGER,                    -- 预计毕业年份
  
  -- 支教相关信息
  status VARCHAR(20) NOT NULL DEFAULT 'available', -- 状态（available, assigned, completed, suspended）
  teaching_subject VARCHAR(100),               -- 支教科目
  teaching_grade VARCHAR(100),                -- 支教年级
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,                   -- 创建人（大学管理员ID）
  
  -- 外键约束
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. 学生支教分配表（student_assignments）
CREATE TABLE IF NOT EXISTS student_assignments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,                -- 学生ID
  school_name VARCHAR(200) NOT NULL,          -- 支教学校名称
  school_address TEXT,                        -- 学校地址
  teaching_subject VARCHAR(100) NOT NULL,     -- 支教科目
  teaching_grade VARCHAR(100) NOT NULL,      -- 支教年级
  assignment_period VARCHAR(100) NOT NULL,    -- 支教周期（如：2024-2025学年第一学期）
  start_date DATE NOT NULL,                   -- 开始日期
  end_date DATE,                              -- 结束日期
  
  -- 状态信息
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 状态（active, completed, terminated）
  completion_status VARCHAR(20),              -- 完成状态（excellent, good, qualified, unqualified）
  
  -- 评价信息
  school_evaluation_score INTEGER,            -- 学校评价分数
  school_evaluation_comments TEXT,            -- 学校评价评语
  university_evaluation_score INTEGER,        -- 大学评价分数
  university_evaluation_comments TEXT,        -- 大学评价评语
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID NOT NULL,                  -- 分配人（大学管理员ID）
  
  -- 外键约束
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. 学生导入批次表（import_batches）
CREATE TABLE IF NOT EXISTS import_batches (
  id SERIAL PRIMARY KEY,
  batch_name VARCHAR(200) NOT NULL,           -- 批次名称
  file_name VARCHAR(200) NOT NULL,            -- 原始文件名
  file_size INTEGER,                          -- 文件大小（字节）
  total_records INTEGER NOT NULL,             -- 总记录数
  success_count INTEGER DEFAULT 0,           -- 成功导入数
  failed_count INTEGER DEFAULT 0,             -- 失败导入数
  error_log TEXT,                             -- 错误日志
  
  -- 状态信息
  status VARCHAR(20) NOT NULL DEFAULT 'processing', -- 状态（processing, completed, failed）
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,                   -- 导入人（大学管理员ID）
  
  -- 外键约束
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4. 学生导入记录表（import_records）
CREATE TABLE IF NOT EXISTS import_records (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL,                 -- 批次ID
  row_number INTEGER NOT NULL,                -- 行号
  student_id VARCHAR(50),                      -- 学号
  name VARCHAR(100),                          -- 姓名
  major VARCHAR(100),                         -- 专业
  grade VARCHAR(20),                          -- 年级
  
  -- 导入状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 状态（pending, success, error）
  error_message TEXT,                         -- 错误信息
  
  -- 关联的学生ID（如果导入成功）
  imported_student_id INTEGER,                -- 导入后的学生ID
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 外键约束
  FOREIGN KEY (batch_id) REFERENCES import_batches(id) ON DELETE CASCADE,
  FOREIGN KEY (imported_student_id) REFERENCES students(id) ON DELETE SET NULL
);

-- 5. 学生统计视图（student_statistics）
CREATE OR REPLACE VIEW student_statistics AS
SELECT 
  COUNT(*) AS total_students,
  SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_count,
  SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) AS assigned_count,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
  SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspended_count,
  
  -- 按年级统计
  SUM(CASE WHEN grade = '大一' THEN 1 ELSE 0 END) AS freshman_count,
  SUM(CASE WHEN grade = '大二' THEN 1 ELSE 0 END) AS sophomore_count,
  SUM(CASE WHEN grade = '大三' THEN 1 ELSE 0 END) AS junior_count,
  SUM(CASE WHEN grade = '大四' THEN 1 ELSE 0 END) AS senior_count,
  
  -- 按专业统计
  major,
  COUNT(*) AS major_count
FROM students
GROUP BY major;

-- 6. 支教分配统计视图（assignment_statistics）
CREATE OR REPLACE VIEW assignment_statistics AS
SELECT 
  COUNT(*) AS total_assignments,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
  SUM(CASE WHEN status = 'terminated' THEN 1 ELSE 0 END) AS terminated_count,
  
  -- 按学校统计
  school_name,
  COUNT(*) AS school_count,
  
  -- 按科目统计
  teaching_subject,
  COUNT(*) AS subject_count
FROM student_assignments
GROUP BY school_name, teaching_subject;

-- 7. 创建索引优化查询性能
-- 学生表索引
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_major ON students(major);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_created_by ON students(created_by);

-- 分配表索引
CREATE INDEX IF NOT EXISTS idx_assignments_student_id ON student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_school_name ON student_assignments(school_name);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON student_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_by ON student_assignments(assigned_by);

-- 导入批次表索引
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON import_batches(status);
CREATE INDEX IF NOT EXISTS idx_import_batches_created_by ON import_batches(created_by);

-- 导入记录表索引
CREATE INDEX IF NOT EXISTS idx_import_records_batch_id ON import_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_import_records_status ON import_records(status);

-- 8. 创建触发器自动更新更新时间
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON student_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. 授予必要的权限
GRANT ALL ON TABLE students TO authenticated;
GRANT ALL ON TABLE student_assignments TO authenticated;
GRANT ALL ON TABLE import_batches TO authenticated;
GRANT ALL ON TABLE import_records TO authenticated;
GRANT SELECT ON TABLE student_statistics TO authenticated;
GRANT SELECT ON TABLE assignment_statistics TO authenticated;

-- 10. 插入示例数据（可选）
/*
-- 示例学生数据
INSERT INTO students (student_id, name, gender, birth_date, major, grade, admission_year, created_by)
VALUES 
('20210001', '张三', 'male', '2000-01-15', '数学教育', '大三', 2021, (SELECT id FROM auth.users LIMIT 1)),
('20210002', '李四', 'female', '2000-03-20', '语文教育', '大四', 2021, (SELECT id FROM auth.users LIMIT 1)),
('20210003', '王五', 'male', '2001-05-10', '英语教育', '大三', 2021, (SELECT id FROM auth.users LIMIT 1));

-- 示例分配数据
INSERT INTO student_assignments (student_id, school_name, teaching_subject, teaching_grade, assignment_period, start_date, assigned_by)
VALUES 
(1, '北京市第一中学', '数学', '高一', '2024-2025学年第一学期', '2024-09-01', (SELECT id FROM auth.users LIMIT 1)),
(2, '北京市第二中学', '语文', '初二', '2024-2025学年第一学期', '2024-09-01', (SELECT id FROM auth.users LIMIT 1));
*/

-- 11. 创建行级安全策略（RLS）
-- 学生表策略
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "大学管理员可以管理所有学生" ON students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'university'
        )
    );

-- 分配表策略
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "大学管理员可以管理所有分配" ON student_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'university'
        )
    );

-- 导入批次表策略
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能查看自己的导入批次" ON import_batches
    FOR ALL USING (created_by = auth.uid());

-- 导入记录表策略
ALTER TABLE import_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能查看自己批次的导入记录" ON import_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM import_batches 
            WHERE import_batches.id = import_records.batch_id 
            AND import_batches.created_by = auth.uid()
        )
    );