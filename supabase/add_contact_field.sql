-- 向教学需求表添加负责人联系方式字段
ALTER TABLE teaching_demands
ADD COLUMN contact VARCHAR(100);

-- 如果数据库中存在school_demands表，也需要添加同样的字段
-- 注意：如果school_demands表不存在，下面这行将不会执行
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'school_demands') THEN
    ALTER TABLE school_demands
    ADD COLUMN contact VARCHAR(100);
  END IF;
END $$;

-- 为已有的需求记录设置默认联系方式（可选）
-- UPDATE teaching_demands SET contact = '待补充' WHERE contact IS NULL;
-- 
-- 可选：如果希望contact字段是必填的，可以在应用程序稳定运行后执行以下语句
-- ALTER TABLE teaching_demands
-- ALTER COLUMN contact SET NOT NULL;