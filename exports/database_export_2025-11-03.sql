-- 数据库导出 - 2025-11-03T08:14:02.593Z

-- 导出的数据库: postgres

-- 创建必要的扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- 表: organizations
CREATE TABLE IF NOT EXISTS public."organizations" (
  "id" integer NOT NULL DEFAULT nextval('organizations_id_seq'::regclass),
  "name" character varying(200) NOT NULL,
  "type" USER-DEFINED NOT NULL,
  "code" character varying(50),
  "contact_person" character varying(100),
  "contact_phone" character varying(20),
  "email" character varying(100),
  "address" text,
  "description" text,
  "status" character varying(20) DEFAULT 'active'::character varying,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- 插入数据到 organizations
INSERT INTO public."organizations" ("id", "name", "type", "code", "contact_person", "contact_phone", "email", "address", "description", "status", "created_by", "created_at", "updated_at") VALUES
  (3, '北京市教育局', 'government', 'BJEDU001', '王处长', '13800138003', 'contact@bjedu.gov.cn', '北京市西城区', '北京市教育主管部门', 'active', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc', '2025-10-31T07:04:00.888Z', '2025-10-31T07:04:00.888Z'),
  (4, '上海市教育局', 'government', 'SHEDU001', '陈主任', '13800138004', 'contact@shed.gov.cn', '上海市黄浦区', '上海市教育主管部门', 'active', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc', '2025-10-31T07:04:00.888Z', '2025-10-31T07:04:00.888Z'),
  (5, '北京市第一实验小学', 'school', 'BJSY001', '刘老师', '13800138005', 'contact@bjsy.edu.cn', '北京市西城区', '北京市重点小学', 'active', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc', '2025-10-31T07:04:00.888Z', '2025-10-31T07:04:00.888Z'),
  (6, '上海市第一中学', 'school', 'SHYZ001', '赵校长', '13800138006', 'contact@shyz.edu.cn', '上海市静安区', '上海市重点中学', 'active', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc', '2025-10-31T07:04:00.888Z', '2025-10-31T07:04:00.888Z'),
  (16, '河北师范大学', 'university', '7763', '陈瑶', '18831531035', '', '', '', 'active', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc', '2025-10-31T08:01:03.263Z', '2025-10-31T08:01:03.307Z'),
  (17, '比奇堡政府', 'government', '0000', '海绵宝宝和派大星', '18831531035', '', '', '', 'active', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc', '2025-10-31T08:03:54.861Z', '2025-11-03T07:11:15.562Z');

-- 索引: organizations_pkey
CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);

-- 索引: organizations_code_key
CREATE UNIQUE INDEX organizations_code_key ON public.organizations USING btree (code);

-- 索引: idx_organizations_name
CREATE INDEX idx_organizations_name ON public.organizations USING btree (name);

-- 索引: idx_organizations_type
CREATE INDEX idx_organizations_type ON public.organizations USING btree (type);

-- 索引: idx_organizations_code
CREATE INDEX idx_organizations_code ON public.organizations USING btree (code);

-- 索引: idx_organizations_created_at
CREATE INDEX idx_organizations_created_at ON public.organizations USING btree (created_at);

-- 外键约束: organizations_created_by_fkey
ALTER TABLE public."organizations"
  ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by")
  REFERENCES public."user_profiles" ("id");

-- 表: teacher_evaluations
CREATE TABLE IF NOT EXISTS public."teacher_evaluations" (
  "id" integer NOT NULL DEFAULT nextval('teacher_evaluations_id_seq'::regclass),
  "teacher_name" character varying(100) NOT NULL,
  "teacher_id" uuid,
  "subject" character varying(100) NOT NULL,
  "grade" character varying(100) NOT NULL,
  "school_name" character varying(200) NOT NULL,
  "period" character varying(100) NOT NULL,
  "deadline" date,
  "status" character varying(20) NOT NULL DEFAULT 'pending'::character varying,
  "score" integer,
  "teaching_content_score" integer,
  "teaching_method_score" integer,
  "classroom_management_score" integer,
  "responsibility_score" integer,
  "teamwork_score" integer,
  "learning_progress_score" integer,
  "overall_score" integer,
  "comments" text,
  "suggestions" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "evaluated_at" timestamp with time zone,
  "created_by" uuid,
  "evaluated_by" uuid
);

-- 表 teacher_evaluations 中没有数据

-- 索引: teacher_evaluations_pkey
CREATE UNIQUE INDEX teacher_evaluations_pkey ON public.teacher_evaluations USING btree (id);

-- 索引: idx_teacher_evaluations_school_name
CREATE INDEX idx_teacher_evaluations_school_name ON public.teacher_evaluations USING btree (school_name);

-- 索引: idx_teacher_evaluations_status
CREATE INDEX idx_teacher_evaluations_status ON public.teacher_evaluations USING btree (status);

-- 索引: idx_teacher_evaluations_teacher_id
CREATE INDEX idx_teacher_evaluations_teacher_id ON public.teacher_evaluations USING btree (teacher_id);

-- 外键约束: teacher_evaluations_created_by_fkey
ALTER TABLE public."teacher_evaluations"
  ADD CONSTRAINT "teacher_evaluations_created_by_fkey" FOREIGN KEY ("created_by")
  REFERENCES public."user_profiles" ("id");

-- 外键约束: teacher_evaluations_evaluated_by_fkey
ALTER TABLE public."teacher_evaluations"
  ADD CONSTRAINT "teacher_evaluations_evaluated_by_fkey" FOREIGN KEY ("evaluated_by")
  REFERENCES public."user_profiles" ("id");

-- 表: import_batches
CREATE TABLE IF NOT EXISTS public."import_batches" (
  "id" integer NOT NULL DEFAULT nextval('import_batches_id_seq'::regclass),
  "batch_name" character varying(200) NOT NULL,
  "file_name" character varying(200) NOT NULL,
  "file_size" integer,
  "total_records" integer NOT NULL,
  "success_count" integer DEFAULT 0,
  "failed_count" integer DEFAULT 0,
  "error_log" text,
  "status" character varying(20) NOT NULL DEFAULT 'processing'::character varying,
  "created_at" timestamp with time zone DEFAULT now(),
  "completed_at" timestamp with time zone,
  "created_by" uuid NOT NULL
);

-- 表 import_batches 中没有数据

-- 索引: import_batches_pkey
CREATE UNIQUE INDEX import_batches_pkey ON public.import_batches USING btree (id);

-- 索引: idx_import_batches_created_by
CREATE INDEX idx_import_batches_created_by ON public.import_batches USING btree (created_by);

-- 索引: idx_import_batches_status
CREATE INDEX idx_import_batches_status ON public.import_batches USING btree (status);

-- 外键约束: import_batches_created_by_fkey
ALTER TABLE public."import_batches"
  ADD CONSTRAINT "import_batches_created_by_fkey" FOREIGN KEY ("created_by")
  REFERENCES public."user_profiles" ("id");

-- 表: import_records
CREATE TABLE IF NOT EXISTS public."import_records" (
  "id" integer NOT NULL DEFAULT nextval('import_records_id_seq'::regclass),
  "batch_id" integer NOT NULL,
  "row_number" integer NOT NULL,
  "student_id" character varying(50),
  "name" character varying(100),
  "major" character varying(100),
  "grade" character varying(20),
  "status" character varying(20) NOT NULL DEFAULT 'pending'::character varying,
  "error_message" text,
  "imported_student_id" integer,
  "created_at" timestamp with time zone DEFAULT now()
);

-- 表 import_records 中没有数据

-- 索引: import_records_pkey
CREATE UNIQUE INDEX import_records_pkey ON public.import_records USING btree (id);

-- 索引: idx_import_records_batch_id
CREATE INDEX idx_import_records_batch_id ON public.import_records USING btree (batch_id);

-- 索引: idx_import_records_status
CREATE INDEX idx_import_records_status ON public.import_records USING btree (status);

-- 外键约束: import_records_batch_id_fkey
ALTER TABLE public."import_records"
  ADD CONSTRAINT "import_records_batch_id_fkey" FOREIGN KEY ("batch_id")
  REFERENCES public."import_batches" ("id");

-- 外键约束: import_records_imported_student_id_fkey
ALTER TABLE public."import_records"
  ADD CONSTRAINT "import_records_imported_student_id_fkey" FOREIGN KEY ("imported_student_id")
  REFERENCES public."students" ("id");

-- 表: position_student_assignments
CREATE TABLE IF NOT EXISTS public."position_student_assignments" (
  "id" integer NOT NULL DEFAULT nextval('position_student_assignments_id_seq'::regclass),
  "position_id" integer NOT NULL,
  "student_id" integer NOT NULL,
  "assigned_at" timestamp with time zone DEFAULT now(),
  "assigned_by" uuid NOT NULL,
  "status" character varying(20) NOT NULL DEFAULT 'active'::character varying,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

-- 插入数据到 position_student_assignments
INSERT INTO public."position_student_assignments" ("id", "position_id", "student_id", "assigned_at", "assigned_by", "status", "created_at", "updated_at") VALUES
  (1, 3, 1, '2025-11-03T07:14:22.442Z', '7f42491f-d3f0-4b71-bb4c-5033db7bc8f8', 'active', '2025-11-03T07:14:22.442Z', '2025-11-03T07:14:22.442Z'),
  (2, 2, 3, '2025-11-03T07:14:25.366Z', '7f42491f-d3f0-4b71-bb4c-5033db7bc8f8', 'active', '2025-11-03T07:14:25.366Z', '2025-11-03T07:14:25.366Z'),
  (3, 1, 6, '2025-11-03T07:14:27.962Z', '7f42491f-d3f0-4b71-bb4c-5033db7bc8f8', 'active', '2025-11-03T07:14:27.962Z', '2025-11-03T07:14:27.962Z');

-- 索引: position_student_assignments_pkey
CREATE UNIQUE INDEX position_student_assignments_pkey ON public.position_student_assignments USING btree (id);

-- 索引: position_student_assignments_position_id_student_id_key
CREATE UNIQUE INDEX position_student_assignments_position_id_student_id_key ON public.position_student_assignments USING btree (position_id, student_id);

-- 索引: idx_position_assignments_assigned_by
CREATE INDEX idx_position_assignments_assigned_by ON public.position_student_assignments USING btree (assigned_by);

-- 索引: idx_position_assignments_position_id
CREATE INDEX idx_position_assignments_position_id ON public.position_student_assignments USING btree (position_id);

-- 索引: idx_position_assignments_status
CREATE INDEX idx_position_assignments_status ON public.position_student_assignments USING btree (status);

-- 索引: idx_position_assignments_student_id
CREATE INDEX idx_position_assignments_student_id ON public.position_student_assignments USING btree (student_id);

-- 外键约束: position_student_assignments_assigned_by_fkey
ALTER TABLE public."position_student_assignments"
  ADD CONSTRAINT "position_student_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by")
  REFERENCES public."user_profiles" ("id");

-- 外键约束: position_student_assignments_position_id_fkey
ALTER TABLE public."position_student_assignments"
  ADD CONSTRAINT "position_student_assignments_position_id_fkey" FOREIGN KEY ("position_id")
  REFERENCES public."teaching_demands" ("id");

-- 外键约束: position_student_assignments_student_id_fkey
ALTER TABLE public."position_student_assignments"
  ADD CONSTRAINT "position_student_assignments_student_id_fkey" FOREIGN KEY ("student_id")
  REFERENCES public."students" ("id");

-- 表: students
CREATE TABLE IF NOT EXISTS public."students" (
  "id" integer NOT NULL DEFAULT nextval('students_id_seq'::regclass),
  "student_id" character varying(50) NOT NULL,
  "name" character varying(100) NOT NULL,
  "gender" character varying(10) NOT NULL,
  "birth_date" date,
  "id_card" character varying(20),
  "phone" character varying(20),
  "email" character varying(100),
  "major" character varying(100) NOT NULL,
  "grade" character varying(20) NOT NULL,
  "class_name" character varying(50),
  "admission_year" integer NOT NULL,
  "graduation_year" integer,
  "status" character varying(20) NOT NULL DEFAULT 'available'::character varying,
  "teaching_subject" character varying(100),
  "teaching_grade" character varying(100),
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "created_by" uuid NOT NULL
);

-- 插入数据到 students
INSERT INTO public."students" ("id", "student_id", "name", "gender", "birth_date", "id_card", "phone", "email", "major", "grade", "class_name", "admission_year", "graduation_year", "status", "teaching_subject", "teaching_grade", "created_at", "updated_at", "created_by") VALUES
  (2, '20210002', '李婷', 'female', '2000-01-15T16:00:00.000Z', NULL, '13900139001', 'liting@example.com', '汉语言文学', '大三', '中文 2 班', 2021, NULL, 'available', '语文', NULL, '2025-10-31T06:19:39.572Z', '2025-10-31T06:19:39.572Z', '7f42491f-d3f0-4b71-bb4c-5033db7bc8f8'),
  (4, '20210123', '张萌', 'female', '2000-01-17T16:00:00.000Z', NULL, '13600136123', 'zhangmeng@example.com', '小学教育', '大三', '小教 3 班', 2021, NULL, 'available', '美术', NULL, '2025-10-31T06:19:39.572Z', '2025-10-31T06:19:39.572Z', '7f42491f-d3f0-4b71-bb4c-5033db7bc8f8'),
  (5, '20220201', '刘阳', 'male', '2000-01-18T16:00:00.000Z', NULL, '13500135201', 'liuyang@example.com', '体育教育', '大二', '体育 2 班', 2022, NULL, 'available', '体育', NULL, '2025-10-31T06:19:39.572Z', '2025-10-31T06:19:39.572Z', '7f42491f-d3f0-4b71-bb4c-5033db7bc8f8'),
  (1, '20210001', '张三', 'male', '2000-01-14T16:00:00.000Z', NULL, '13800138000', 'zhangsan@example.com', '数学教育', '大三', '数学1班', 2021, NULL, 'assigned', '生物', '初中一年级', '2025-10-31T06:19:39.572Z', '2025-11-03T07:14:22.408Z', '7f42491f-d3f0-4b71-bb4c-5033db7bc8f8'),
  (3, '20220056', '王浩', 'male', '2000-01-16T16:00:00.000Z', NULL, '13700137056', 'wanghao@example.com', '英语师范', '大二', '英语 1 班', 2022, NULL, 'assigned', '物理', '小学三年级', '2025-10-31T06:19:39.572Z', '2025-11-03T07:14:25.341Z', '7f42491f-d3f0-4b71-bb4c-5033db7bc8f8'),
  (6, '20200089', '陈曦', 'female', '2000-01-19T16:00:00.000Z', NULL, '13400134089', 'chenxi@example.com', '生物科学', '大四', '生物 1 班', 2020, NULL, 'assigned', '化学', '小学四年级', '2025-10-31T06:19:39.572Z', '2025-11-03T07:14:27.940Z', '7f42491f-d3f0-4b71-bb4c-5033db7bc8f8');

-- 索引: students_pkey
CREATE UNIQUE INDEX students_pkey ON public.students USING btree (id);

-- 索引: students_student_id_key
CREATE UNIQUE INDEX students_student_id_key ON public.students USING btree (student_id);

-- 索引: idx_students_created_by
CREATE INDEX idx_students_created_by ON public.students USING btree (created_by);

-- 索引: idx_students_grade
CREATE INDEX idx_students_grade ON public.students USING btree (grade);

-- 索引: idx_students_major
CREATE INDEX idx_students_major ON public.students USING btree (major);

-- 索引: idx_students_name
CREATE INDEX idx_students_name ON public.students USING btree (name);

-- 索引: idx_students_status
CREATE INDEX idx_students_status ON public.students USING btree (status);

-- 索引: idx_students_student_id
CREATE INDEX idx_students_student_id ON public.students USING btree (student_id);

-- 外键约束: students_created_by_fkey
ALTER TABLE public."students"
  ADD CONSTRAINT "students_created_by_fkey" FOREIGN KEY ("created_by")
  REFERENCES public."user_profiles" ("id");

-- 表: admin_management
CREATE TABLE IF NOT EXISTS public."admin_management" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "admin_id" uuid NOT NULL,
  "managed_by" uuid NOT NULL,
  "role" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active'::text,
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "created_by" uuid NOT NULL
);

-- 插入数据到 admin_management
INSERT INTO public."admin_management" ("id", "admin_id", "managed_by", "role", "status", "created_at", "updated_at", "created_by") VALUES
  ('fe436d7e-1df5-4d9e-8736-f9d683271280', '2ef1505e-e949-452e-b8f3-46e0d7c5c9ba', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc', 'school', 'active', '2025-10-31T06:18:34.281Z', '2025-10-31T06:18:34.281Z', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'),
  ('5e269f18-71c0-482c-87a2-1d643bcde203', '7f42491f-d3f0-4b71-bb4c-5033db7bc8f8', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc', 'university', 'active', '2025-10-31T06:17:48.354Z', '2025-10-31T06:17:48.354Z', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'),
  ('4322b8b3-8d23-4739-ab61-114a3a595504', '1af5550c-24d2-4241-b2cf-d95ec78cc243', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc', 'government', 'active', '2025-10-31T06:18:15.880Z', '2025-10-31T06:18:15.880Z', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc'),
  ('f4e38c18-f13f-4cfe-ba39-d7cc720b4fdc', '29713b59-079d-447a-876d-a3100a074118', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc', 'school', 'active', '2025-11-03T07:07:35.567Z', '2025-11-03T07:07:35.567Z', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc');

-- 索引: admin_management_pkey
CREATE UNIQUE INDEX admin_management_pkey ON public.admin_management USING btree (id);

-- 索引: idx_admin_management_admin_id
CREATE INDEX idx_admin_management_admin_id ON public.admin_management USING btree (admin_id);

-- 索引: idx_admin_management_managed_by
CREATE INDEX idx_admin_management_managed_by ON public.admin_management USING btree (managed_by);

-- 索引: idx_admin_management_role
CREATE INDEX idx_admin_management_role ON public.admin_management USING btree (role);

-- 索引: idx_admin_management_status
CREATE INDEX idx_admin_management_status ON public.admin_management USING btree (status);

-- 外键约束: admin_management_admin_id_fkey
ALTER TABLE public."admin_management"
  ADD CONSTRAINT "admin_management_admin_id_fkey" FOREIGN KEY ("admin_id")
  REFERENCES public."user_profiles" ("id");

-- 外键约束: admin_management_managed_by_fkey
ALTER TABLE public."admin_management"
  ADD CONSTRAINT "admin_management_managed_by_fkey" FOREIGN KEY ("managed_by")
  REFERENCES public."user_profiles" ("id");

-- 表: student_assignments
CREATE TABLE IF NOT EXISTS public."student_assignments" (
  "id" integer NOT NULL DEFAULT nextval('student_assignments_id_seq'::regclass),
  "student_id" integer NOT NULL,
  "school_name" character varying(200) NOT NULL,
  "school_address" text,
  "teaching_subject" character varying(100) NOT NULL,
  "teaching_grade" character varying(100) NOT NULL,
  "assignment_period" character varying(100) NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date,
  "status" character varying(20) NOT NULL DEFAULT 'active'::character varying,
  "completion_status" character varying(20),
  "school_evaluation_score" integer,
  "school_evaluation_comments" text,
  "university_evaluation_score" integer,
  "university_evaluation_comments" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "assigned_by" uuid NOT NULL
);

-- 插入数据到 student_assignments
INSERT INTO public."student_assignments" ("id", "student_id", "school_name", "school_address", "teaching_subject", "teaching_grade", "assignment_period", "start_date", "end_date", "status", "completion_status", "school_evaluation_score", "school_evaluation_comments", "university_evaluation_score", "university_evaluation_comments", "created_at", "updated_at", "assigned_by") VALUES
  (1, 1, '2', NULL, '生物', '初中一年级', '2023年6月-2024年6月', '2025-11-02T16:00:00.000Z', NULL, 'active', NULL, NULL, NULL, NULL, NULL, '2025-11-03T07:14:22.432Z', '2025-11-03T07:14:22.432Z', '7f42491f-d3f0-4b71-bb4c-5033db7bc8f8'),
  (2, 3, '比奇堡大学', NULL, '物理', '小学三年级', '2023年6月-2024年6月', '2025-11-02T16:00:00.000Z', NULL, 'active', NULL, NULL, NULL, NULL, NULL, '2025-11-03T07:14:25.355Z', '2025-11-03T07:14:25.355Z', '7f42491f-d3f0-4b71-bb4c-5033db7bc8f8'),
  (3, 6, '比奇堡大学', NULL, '化学', '小学四年级', '2023年10月-2024年10月', '2025-11-02T16:00:00.000Z', NULL, 'active', NULL, NULL, NULL, NULL, NULL, '2025-11-03T07:14:27.951Z', '2025-11-03T07:14:27.951Z', '7f42491f-d3f0-4b71-bb4c-5033db7bc8f8');

-- 索引: student_assignments_pkey
CREATE UNIQUE INDEX student_assignments_pkey ON public.student_assignments USING btree (id);

-- 索引: idx_assignments_assigned_by
CREATE INDEX idx_assignments_assigned_by ON public.student_assignments USING btree (assigned_by);

-- 索引: idx_assignments_school_name
CREATE INDEX idx_assignments_school_name ON public.student_assignments USING btree (school_name);

-- 索引: idx_assignments_status
CREATE INDEX idx_assignments_status ON public.student_assignments USING btree (status);

-- 索引: idx_assignments_student_id
CREATE INDEX idx_assignments_student_id ON public.student_assignments USING btree (student_id);

-- 外键约束: student_assignments_assigned_by_fkey
ALTER TABLE public."student_assignments"
  ADD CONSTRAINT "student_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by")
  REFERENCES public."user_profiles" ("id");

-- 外键约束: student_assignments_student_id_fkey
ALTER TABLE public."student_assignments"
  ADD CONSTRAINT "student_assignments_student_id_fkey" FOREIGN KEY ("student_id")
  REFERENCES public."students" ("id");

-- 表: teaching_demands
CREATE TABLE IF NOT EXISTS public."teaching_demands" (
  "id" integer NOT NULL DEFAULT nextval('teaching_demands_id_seq'::regclass),
  "subject" character varying(100) NOT NULL,
  "grade" character varying(100) NOT NULL,
  "demand_count" integer NOT NULL DEFAULT 1,
  "duration" character varying(100) NOT NULL,
  "urgency" character varying(20) NOT NULL,
  "special_requirements" text,
  "status" character varying(20) NOT NULL DEFAULT 'draft'::character varying,
  "organization" character varying(200) NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "submitted_at" timestamp with time zone,
  "approved_at" timestamp with time zone,
  "rejected_at" timestamp with time zone,
  "rejected_reason" text,
  "contact" character varying(100)
);

-- 插入数据到 teaching_demands
INSERT INTO public."teaching_demands" ("id", "subject", "grade", "demand_count", "duration", "urgency", "special_requirements", "status", "organization", "created_by", "created_at", "submitted_at", "approved_at", "rejected_at", "rejected_reason", "contact") VALUES
  (2, '物理', '小学三年级', 1, '2023年6月-2024年6月', 'medium', '', 'assigned', '比奇堡大学', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc', '2025-10-31T06:23:09.178Z', '2025-10-31T06:23:19.810Z', '2025-11-03T07:13:44.912Z', NULL, NULL, '18831531035'),
  (1, '化学', '小学四年级', 1, '2023年10月-2024年10月', 'medium', '', 'assigned', '比奇堡大学', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc', '2025-10-31T06:20:10.930Z', '2025-10-31T06:20:13.384Z', '2025-10-31T06:20:27.270Z', NULL, NULL, '18831531035'),
  (3, '生物', '初中一年级', 1, '2023年6月-2024年6月', 'medium', '', 'approved', '2', '3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc', '2025-11-03T07:12:56.956Z', '2025-11-03T07:13:09.483Z', '2025-11-03T07:21:57.460Z', NULL, NULL, '18831531035');

-- 索引: teaching_demands_pkey
CREATE UNIQUE INDEX teaching_demands_pkey ON public.teaching_demands USING btree (id);

-- 索引: idx_teaching_demands_created_by
CREATE INDEX idx_teaching_demands_created_by ON public.teaching_demands USING btree (created_by);

-- 索引: idx_teaching_demands_organization
CREATE INDEX idx_teaching_demands_organization ON public.teaching_demands USING btree (organization);

-- 索引: idx_teaching_demands_status
CREATE INDEX idx_teaching_demands_status ON public.teaching_demands USING btree (status);

-- 外键约束: teaching_demands_created_by_fkey
ALTER TABLE public."teaching_demands"
  ADD CONSTRAINT "teaching_demands_created_by_fkey" FOREIGN KEY ("created_by")
  REFERENCES public."user_profiles" ("id");

-- 表: user_profiles
CREATE TABLE IF NOT EXISTS public."user_profiles" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "phone_number" text NOT NULL,
  "name" text NOT NULL,
  "organization" text NOT NULL,
  "role" text NOT NULL,
  "auth_user_id" uuid,
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "password_hash" text
);

-- 插入数据到 user_profiles
INSERT INTO public."user_profiles" ("id", "phone_number", "name", "organization", "role", "auth_user_id", "created_at", "updated_at", "password_hash") VALUES
  ('3a4ddbe2-4211-4d4e-9ebd-ed71f691c0bc', '13800138000', '超级管理员', '系统管理', 'super_admin', NULL, '2025-10-31T06:15:29.161Z', '2025-10-31T06:15:29.161Z', NULL),
  ('2ef1505e-e949-452e-b8f3-46e0d7c5c9ba', '18831531035', '陈瑶', '比奇堡大学', 'school', NULL, '2025-10-31T06:18:34.259Z', '2025-10-31T06:18:34.259Z', '96e79218965eb72c92a549dd5a330112'),
  ('7f42491f-d3f0-4b71-bb4c-5033db7bc8f8', '18831531034', '陈瑶', '比奇堡大学', 'university', NULL, '2025-10-31T06:17:48.313Z', '2025-10-31T06:17:48.313Z', '96e79218965eb72c92a549dd5a330112'),
  ('1af5550c-24d2-4241-b2cf-d95ec78cc243', '18831531030', '陈瑶', '比奇堡大学', 'government', NULL, '2025-10-31T06:18:15.845Z', '2025-10-31T06:18:15.845Z', 'e10adc3949ba59abbe56e057f20f883e'),
  ('29713b59-079d-447a-876d-a3100a074118', '18831531033', '陈瑶', '比奇堡政府', 'school', NULL, '2025-11-03T07:07:35.534Z', '2025-11-03T07:07:35.534Z', '96e79218965eb72c92a549dd5a330112');

-- 索引: user_profiles_phone_number_key
CREATE UNIQUE INDEX user_profiles_phone_number_key ON public.user_profiles USING btree (phone_number);

-- 索引: user_profiles_pkey
CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);

-- 索引: idx_user_profiles_auth_id
CREATE INDEX idx_user_profiles_auth_id ON public.user_profiles USING btree (auth_user_id);

-- 索引: idx_user_profiles_phone
CREATE INDEX idx_user_profiles_phone ON public.user_profiles USING btree (phone_number);

-- 索引: idx_user_profiles_role
CREATE INDEX idx_user_profiles_role ON public.user_profiles USING btree (role);

-- 表: user_profiles_backup
CREATE TABLE IF NOT EXISTS public."user_profiles_backup" (
  "id" uuid,
  "phone_number" text,
  "name" text,
  "organization" text,
  "role" text,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone
);

-- 表 user_profiles_backup 中没有数据

-- 函数: create_super_admin
CREATE OR REPLACE FUNCTION public.create_super_admin(phone_number text, name text, organization text, password text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$


-- 函数: update_organizations_updated_at
CREATE OR REPLACE FUNCTION public.update_organizations_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $function$


-- 函数: add_super_admin_to_management
CREATE OR REPLACE FUNCTION public.add_super_admin_to_management(admin_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$


-- 函数: execute_sql
CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result_set REFCURSOR;
  row_data JSONB;
  results JSONB[] := ARRAY[]::JSONB[];
BEGIN
  -- 使用动态SQL执行查询
  OPEN result_set FOR EXECUTE sql;
  
  -- 处理结果（如果是SELECT语句）
  LOOP
    FETCH result_set INTO row_data;
    EXIT WHEN NOT FOUND;
    results := results || row_data;
  END LOOP;
  
  CLOSE result_set;
  
  -- 返回结果数组的JSON表示
  RETURN jsonb_agg(result) FROM (SELECT unnest(results) AS result) AS sub;
EXCEPTION
  WHEN OTHERS THEN
    -- 如果不是查询语句（如ALTER TABLE），返回成功消息
    RETURN jsonb_build_object('status', 'success', 'message', 'SQL executed successfully');
END;
$function$


-- 函数: set_user_password
CREATE OR REPLACE FUNCTION public.set_user_password(phone text, new_password text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE user_profiles
    SET password_hash = md5(new_password)
    WHERE phone_number = phone;

    RETURN FOUND;
END;
$function$


-- 函数: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$


-- 函数: verify_password
CREATE OR REPLACE FUNCTION public.verify_password(phone text, password text)
 RETURNS TABLE(id uuid, name text, organization text, role text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT up.id, up.name, up.organization, up.role
    FROM user_profiles up
    WHERE up.phone_number = phone
    AND up.password_hash = md5(password);
END;
$function$


