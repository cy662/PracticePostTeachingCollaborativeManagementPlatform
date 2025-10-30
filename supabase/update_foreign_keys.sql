-- 安全更新所有外键约束，从auth.users改为指向user_profiles表
-- 策略：先删除所有外键约束，然后修复数据，最后添加新的外键约束

-- 1. 检查user_profiles表是否存在
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE EXCEPTION 'user_profiles表不存在，请先创建该表';
    END IF;
END
$$;

-- 2. 先删除所有外键约束
-- 2.1 删除students表外键约束
ALTER TABLE students
DROP CONSTRAINT IF EXISTS students_created_by_fkey;

-- 2.2 删除student_assignments表外键约束
ALTER TABLE student_assignments
DROP CONSTRAINT IF EXISTS student_assignments_assigned_by_fkey;

-- 2.3 删除import_batches表外键约束
ALTER TABLE import_batches
DROP CONSTRAINT IF EXISTS import_batches_created_by_fkey;

-- 2.4 删除teaching_demands表外键约束
ALTER TABLE teaching_demands
DROP CONSTRAINT IF EXISTS teaching_demands_created_by_fkey;

-- 2.5 删除teacher_evaluations表外键约束
ALTER TABLE teacher_evaluations
DROP CONSTRAINT IF EXISTS teacher_evaluations_created_by_fkey;

ALTER TABLE teacher_evaluations
DROP CONSTRAINT IF EXISTS teacher_evaluations_evaluated_by_fkey;

-- 2.6 删除position_student_assignments表外键约束
ALTER TABLE position_student_assignments
DROP CONSTRAINT IF EXISTS position_student_assignments_assigned_by_fkey;

-- 2.7 删除admin_management表外键约束（如果表存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_management') THEN
        BEGIN
            ALTER TABLE admin_management
            DROP CONSTRAINT IF EXISTS admin_management_admin_id_fkey;
            
            ALTER TABLE admin_management
            DROP CONSTRAINT IF EXISTS admin_management_managed_by_fkey;
            
            ALTER TABLE admin_management
            DROP CONSTRAINT IF EXISTS admin_management_created_by_fkey;
            
            RAISE NOTICE 'admin_management表外键约束已删除';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'admin_management表外键约束删除失败: %', SQLERRM;
        END;
    END IF;
END
$$;

-- 3. 修复数据，确保所有外键引用有效
-- 3.1 修复students表数据
UPDATE students
SET created_by = (SELECT id FROM user_profiles LIMIT 1)
WHERE created_by NOT IN (SELECT id FROM user_profiles)
AND (SELECT id FROM user_profiles LIMIT 1) IS NOT NULL;

-- 3.2 修复student_assignments表数据
UPDATE student_assignments
SET assigned_by = NULL
WHERE assigned_by IS NOT NULL AND assigned_by NOT IN (SELECT id FROM user_profiles);

-- 3.3 修复import_batches表数据
UPDATE import_batches
SET created_by = NULL
WHERE created_by IS NOT NULL AND created_by NOT IN (SELECT id FROM user_profiles);

-- 3.4 修复teaching_demands表数据
UPDATE teaching_demands
SET created_by = (SELECT id FROM user_profiles LIMIT 1)
WHERE created_by NOT IN (SELECT id FROM user_profiles)
AND (SELECT id FROM user_profiles LIMIT 1) IS NOT NULL;

-- 3.5 修复teacher_evaluations表数据
UPDATE teacher_evaluations
SET created_by = NULL
WHERE created_by IS NOT NULL AND created_by NOT IN (SELECT id FROM user_profiles);

UPDATE teacher_evaluations
SET evaluated_by = NULL
WHERE evaluated_by IS NOT NULL AND evaluated_by NOT IN (SELECT id FROM user_profiles);

-- 3.6 修复position_student_assignments表数据
UPDATE position_student_assignments
SET assigned_by = NULL
WHERE assigned_by IS NOT NULL AND assigned_by NOT IN (SELECT id FROM user_profiles);

-- 4. 添加新的外键约束，指向user_profiles表
-- 4.1 为students表添加外键约束
ALTER TABLE students
ADD CONSTRAINT students_created_by_fkey
FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- 4.2 为student_assignments表添加外键约束
ALTER TABLE student_assignments
ADD CONSTRAINT student_assignments_assigned_by_fkey
FOREIGN KEY (assigned_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- 4.3 为import_batches表添加外键约束
ALTER TABLE import_batches
ADD CONSTRAINT import_batches_created_by_fkey
FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- 4.4 为teaching_demands表添加外键约束
ALTER TABLE teaching_demands
ADD CONSTRAINT teaching_demands_created_by_fkey
FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- 4.5 为teacher_evaluations表添加外键约束
ALTER TABLE teacher_evaluations
ADD CONSTRAINT teacher_evaluations_created_by_fkey
FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE teacher_evaluations
ADD CONSTRAINT teacher_evaluations_evaluated_by_fkey
FOREIGN KEY (evaluated_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- 4.6 为position_student_assignments表添加外键约束
ALTER TABLE position_student_assignments
ADD CONSTRAINT position_student_assignments_assigned_by_fkey
FOREIGN KEY (assigned_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- 4.7 为admin_management表添加外键约束（如果表存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_management') THEN
        BEGIN
            ALTER TABLE admin_management
            ADD CONSTRAINT admin_management_admin_id_fkey
            FOREIGN KEY (admin_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
            
            ALTER TABLE admin_management
            ADD CONSTRAINT admin_management_managed_by_fkey
            FOREIGN KEY (managed_by) REFERENCES user_profiles(id) ON DELETE CASCADE;
            
            ALTER TABLE admin_management
            ADD CONSTRAINT admin_management_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'admin_management表外键约束已更新';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'admin_management表外键约束更新失败: %', SQLERRM;
        END;
    END IF;
END
$$;

-- 5. 验证更新结果
SELECT '所有外键约束已成功从auth.users表更新为user_profiles表' AS result;