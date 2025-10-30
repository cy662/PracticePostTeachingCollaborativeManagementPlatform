


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."add_super_admin_to_management"("admin_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."add_super_admin_to_management"("admin_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_super_admin"("phone_number" "text", "name" "text", "organization" "text", "password" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."create_super_admin"("phone_number" "text", "name" "text", "organization" "text", "password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_sql"("sql" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."execute_sql"("sql" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_password"("phone" "text", "new_password" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE user_profiles
    SET password_hash = md5(new_password)
    WHERE phone_number = phone;

    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."set_user_password"("phone" "text", "new_password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_password"("phone" "text", "password" "text") RETURNS TABLE("id" "uuid", "name" "text", "organization" "text", "role" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT up.id, up.name, up.organization, up.role
    FROM user_profiles up
    WHERE up.phone_number = phone
    AND up.password_hash = md5(password);
END;
$$;


ALTER FUNCTION "public"."verify_password"("phone" "text", "password" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_management" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "managed_by" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "admin_management_role_check" CHECK (("role" = ANY (ARRAY['university'::"text", 'government'::"text", 'school'::"text"]))),
    CONSTRAINT "admin_management_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."admin_management" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_statistics" AS
 SELECT "role",
    "count"(*) AS "total_admins",
    "sum"(
        CASE
            WHEN ("status" = 'active'::"text") THEN 1
            ELSE 0
        END) AS "active_count",
    "sum"(
        CASE
            WHEN ("status" = 'inactive'::"text") THEN 1
            ELSE 0
        END) AS "inactive_count",
    "sum"(
        CASE
            WHEN ("status" = 'pending'::"text") THEN 1
            ELSE 0
        END) AS "pending_count"
   FROM "public"."admin_management"
  GROUP BY "role";


ALTER VIEW "public"."admin_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_assignments" (
    "id" integer NOT NULL,
    "student_id" integer NOT NULL,
    "school_name" character varying(200) NOT NULL,
    "school_address" "text",
    "teaching_subject" character varying(100) NOT NULL,
    "teaching_grade" character varying(100) NOT NULL,
    "assignment_period" character varying(100) NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "completion_status" character varying(20),
    "school_evaluation_score" integer,
    "school_evaluation_comments" "text",
    "university_evaluation_score" integer,
    "university_evaluation_comments" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "assigned_by" "uuid" NOT NULL
);


ALTER TABLE "public"."student_assignments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."assignment_statistics" AS
 SELECT "count"(*) AS "total_assignments",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'active'::"text") THEN 1
            ELSE 0
        END) AS "active_count",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'completed'::"text") THEN 1
            ELSE 0
        END) AS "completed_count",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'terminated'::"text") THEN 1
            ELSE 0
        END) AS "terminated_count",
    "school_name",
    "count"(*) AS "school_count",
    "teaching_subject",
    "count"(*) AS "subject_count"
   FROM "public"."student_assignments"
  GROUP BY "school_name", "teaching_subject";


ALTER VIEW "public"."assignment_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teaching_demands" (
    "id" integer NOT NULL,
    "subject" character varying(100) NOT NULL,
    "grade" character varying(100) NOT NULL,
    "demand_count" integer DEFAULT 1 NOT NULL,
    "duration" character varying(100) NOT NULL,
    "urgency" character varying(20) NOT NULL,
    "special_requirements" "text",
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "organization" character varying(200) NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "submitted_at" timestamp with time zone,
    "approved_at" timestamp with time zone,
    "rejected_at" timestamp with time zone,
    "rejected_reason" "text",
    "contact" character varying(100)
);


ALTER TABLE "public"."teaching_demands" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."demand_statistics" AS
 SELECT "organization",
    "count"(*) AS "total_demands",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'draft'::"text") THEN 1
            ELSE 0
        END) AS "draft_count",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'pending'::"text") THEN 1
            ELSE 0
        END) AS "pending_count",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'approved'::"text") THEN 1
            ELSE 0
        END) AS "approved_count",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'rejected'::"text") THEN 1
            ELSE 0
        END) AS "rejected_count"
   FROM "public"."teaching_demands"
  GROUP BY "organization";


ALTER VIEW "public"."demand_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_evaluations" (
    "id" integer NOT NULL,
    "teacher_name" character varying(100) NOT NULL,
    "teacher_id" "uuid",
    "subject" character varying(100) NOT NULL,
    "grade" character varying(100) NOT NULL,
    "school_name" character varying(200) NOT NULL,
    "period" character varying(100) NOT NULL,
    "deadline" "date",
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "score" integer,
    "teaching_content_score" integer,
    "teaching_method_score" integer,
    "classroom_management_score" integer,
    "responsibility_score" integer,
    "teamwork_score" integer,
    "learning_progress_score" integer,
    "overall_score" integer,
    "comments" "text",
    "suggestions" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "evaluated_at" timestamp with time zone,
    "created_by" "uuid",
    "evaluated_by" "uuid"
);


ALTER TABLE "public"."teacher_evaluations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."evaluation_statistics" AS
 SELECT "school_name",
    "count"(*) AS "total_evaluations",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'pending'::"text") THEN 1
            ELSE 0
        END) AS "pending_count",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'completed'::"text") THEN 1
            ELSE 0
        END) AS "completed_count",
    "avg"("score") AS "avg_score"
   FROM "public"."teacher_evaluations"
  GROUP BY "school_name";


ALTER VIEW "public"."evaluation_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."import_batches" (
    "id" integer NOT NULL,
    "batch_name" character varying(200) NOT NULL,
    "file_name" character varying(200) NOT NULL,
    "file_size" integer,
    "total_records" integer NOT NULL,
    "success_count" integer DEFAULT 0,
    "failed_count" integer DEFAULT 0,
    "error_log" "text",
    "status" character varying(20) DEFAULT 'processing'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."import_batches" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."import_batches_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."import_batches_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."import_batches_id_seq" OWNED BY "public"."import_batches"."id";



CREATE TABLE IF NOT EXISTS "public"."import_records" (
    "id" integer NOT NULL,
    "batch_id" integer NOT NULL,
    "row_number" integer NOT NULL,
    "student_id" character varying(50),
    "name" character varying(100),
    "major" character varying(100),
    "grade" character varying(20),
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "error_message" "text",
    "imported_student_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."import_records" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."import_records_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."import_records_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."import_records_id_seq" OWNED BY "public"."import_records"."id";



CREATE TABLE IF NOT EXISTS "public"."position_student_assignments" (
    "id" integer NOT NULL,
    "position_id" integer NOT NULL,
    "student_id" integer NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "assigned_by" "uuid" NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."position_student_assignments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."position_assignment_stats" AS
 SELECT "psa"."position_id",
    "count"("psa"."student_id") AS "assigned_count",
    "td"."demand_count",
    "td"."status" AS "position_status"
   FROM ("public"."position_student_assignments" "psa"
     JOIN "public"."teaching_demands" "td" ON (("psa"."position_id" = "td"."id")))
  WHERE (("psa"."status")::"text" = 'active'::"text")
  GROUP BY "psa"."position_id", "td"."demand_count", "td"."status";


ALTER VIEW "public"."position_assignment_stats" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."position_student_assignments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."position_student_assignments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."position_student_assignments_id_seq" OWNED BY "public"."position_student_assignments"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."student_assignments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."student_assignments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."student_assignments_id_seq" OWNED BY "public"."student_assignments"."id";



CREATE TABLE IF NOT EXISTS "public"."students" (
    "id" integer NOT NULL,
    "student_id" character varying(50) NOT NULL,
    "name" character varying(100) NOT NULL,
    "gender" character varying(10) NOT NULL,
    "birth_date" "date",
    "id_card" character varying(20),
    "phone" character varying(20),
    "email" character varying(100),
    "major" character varying(100) NOT NULL,
    "grade" character varying(20) NOT NULL,
    "class_name" character varying(50),
    "admission_year" integer NOT NULL,
    "graduation_year" integer,
    "status" character varying(20) DEFAULT 'available'::character varying NOT NULL,
    "teaching_subject" character varying(100),
    "teaching_grade" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."students" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."student_statistics" AS
 SELECT "count"(*) AS "total_students",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'available'::"text") THEN 1
            ELSE 0
        END) AS "available_count",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'assigned'::"text") THEN 1
            ELSE 0
        END) AS "assigned_count",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'completed'::"text") THEN 1
            ELSE 0
        END) AS "completed_count",
    "sum"(
        CASE
            WHEN (("status")::"text" = 'suspended'::"text") THEN 1
            ELSE 0
        END) AS "suspended_count",
    "sum"(
        CASE
            WHEN (("grade")::"text" = '大一'::"text") THEN 1
            ELSE 0
        END) AS "freshman_count",
    "sum"(
        CASE
            WHEN (("grade")::"text" = '大二'::"text") THEN 1
            ELSE 0
        END) AS "sophomore_count",
    "sum"(
        CASE
            WHEN (("grade")::"text" = '大三'::"text") THEN 1
            ELSE 0
        END) AS "junior_count",
    "sum"(
        CASE
            WHEN (("grade")::"text" = '大四'::"text") THEN 1
            ELSE 0
        END) AS "senior_count",
    "major",
    "count"(*) AS "major_count"
   FROM "public"."students"
  GROUP BY "major";


ALTER VIEW "public"."student_statistics" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."students_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."students_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."students_id_seq" OWNED BY "public"."students"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."teacher_evaluations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."teacher_evaluations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."teacher_evaluations_id_seq" OWNED BY "public"."teacher_evaluations"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."teaching_demands_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."teaching_demands_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."teaching_demands_id_seq" OWNED BY "public"."teaching_demands"."id";



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone_number" "text" NOT NULL,
    "name" "text" NOT NULL,
    "organization" "text" NOT NULL,
    "role" "text" NOT NULL,
    "auth_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "password_hash" "text",
    CONSTRAINT "user_profiles_role_check" CHECK (("role" = ANY (ARRAY['super_admin'::"text", 'university'::"text", 'government'::"text", 'school'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles_backup" (
    "id" "uuid",
    "phone_number" "text",
    "name" "text",
    "organization" "text",
    "role" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."user_profiles_backup" OWNER TO "postgres";


ALTER TABLE ONLY "public"."import_batches" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."import_batches_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."import_records" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."import_records_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."position_student_assignments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."position_student_assignments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."student_assignments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."student_assignments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."students" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."students_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."teacher_evaluations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."teacher_evaluations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."teaching_demands" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."teaching_demands_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."admin_management"
    ADD CONSTRAINT "admin_management_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."import_batches"
    ADD CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."import_records"
    ADD CONSTRAINT "import_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."position_student_assignments"
    ADD CONSTRAINT "position_student_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."position_student_assignments"
    ADD CONSTRAINT "position_student_assignments_position_id_student_id_key" UNIQUE ("position_id", "student_id");



ALTER TABLE ONLY "public"."student_assignments"
    ADD CONSTRAINT "student_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_student_id_key" UNIQUE ("student_id");



ALTER TABLE ONLY "public"."teacher_evaluations"
    ADD CONSTRAINT "teacher_evaluations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teaching_demands"
    ADD CONSTRAINT "teaching_demands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_phone_number_key" UNIQUE ("phone_number");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admin_management_admin_id" ON "public"."admin_management" USING "btree" ("admin_id");



CREATE INDEX "idx_admin_management_managed_by" ON "public"."admin_management" USING "btree" ("managed_by");



CREATE INDEX "idx_admin_management_role" ON "public"."admin_management" USING "btree" ("role");



CREATE INDEX "idx_admin_management_status" ON "public"."admin_management" USING "btree" ("status");



CREATE INDEX "idx_assignments_assigned_by" ON "public"."student_assignments" USING "btree" ("assigned_by");



CREATE INDEX "idx_assignments_school_name" ON "public"."student_assignments" USING "btree" ("school_name");



CREATE INDEX "idx_assignments_status" ON "public"."student_assignments" USING "btree" ("status");



CREATE INDEX "idx_assignments_student_id" ON "public"."student_assignments" USING "btree" ("student_id");



CREATE INDEX "idx_import_batches_created_by" ON "public"."import_batches" USING "btree" ("created_by");



CREATE INDEX "idx_import_batches_status" ON "public"."import_batches" USING "btree" ("status");



CREATE INDEX "idx_import_records_batch_id" ON "public"."import_records" USING "btree" ("batch_id");



CREATE INDEX "idx_import_records_status" ON "public"."import_records" USING "btree" ("status");



CREATE INDEX "idx_position_assignments_assigned_by" ON "public"."position_student_assignments" USING "btree" ("assigned_by");



CREATE INDEX "idx_position_assignments_position_id" ON "public"."position_student_assignments" USING "btree" ("position_id");



CREATE INDEX "idx_position_assignments_status" ON "public"."position_student_assignments" USING "btree" ("status");



CREATE INDEX "idx_position_assignments_student_id" ON "public"."position_student_assignments" USING "btree" ("student_id");



CREATE INDEX "idx_students_created_by" ON "public"."students" USING "btree" ("created_by");



CREATE INDEX "idx_students_grade" ON "public"."students" USING "btree" ("grade");



CREATE INDEX "idx_students_major" ON "public"."students" USING "btree" ("major");



CREATE INDEX "idx_students_name" ON "public"."students" USING "btree" ("name");



CREATE INDEX "idx_students_status" ON "public"."students" USING "btree" ("status");



CREATE INDEX "idx_students_student_id" ON "public"."students" USING "btree" ("student_id");



CREATE INDEX "idx_teacher_evaluations_school_name" ON "public"."teacher_evaluations" USING "btree" ("school_name");



CREATE INDEX "idx_teacher_evaluations_status" ON "public"."teacher_evaluations" USING "btree" ("status");



CREATE INDEX "idx_teacher_evaluations_teacher_id" ON "public"."teacher_evaluations" USING "btree" ("teacher_id");



CREATE INDEX "idx_teaching_demands_created_by" ON "public"."teaching_demands" USING "btree" ("created_by");



CREATE INDEX "idx_teaching_demands_organization" ON "public"."teaching_demands" USING "btree" ("organization");



CREATE INDEX "idx_teaching_demands_status" ON "public"."teaching_demands" USING "btree" ("status");



CREATE INDEX "idx_user_profiles_auth_id" ON "public"."user_profiles" USING "btree" ("auth_user_id");



CREATE INDEX "idx_user_profiles_phone" ON "public"."user_profiles" USING "btree" ("phone_number");



CREATE INDEX "idx_user_profiles_role" ON "public"."user_profiles" USING "btree" ("role");



CREATE OR REPLACE TRIGGER "update_assignments_updated_at" BEFORE UPDATE ON "public"."student_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_position_assignments_updated_at" BEFORE UPDATE ON "public"."position_student_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_students_updated_at" BEFORE UPDATE ON "public"."students" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_management"
    ADD CONSTRAINT "admin_management_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_management"
    ADD CONSTRAINT "admin_management_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_management"
    ADD CONSTRAINT "admin_management_managed_by_fkey" FOREIGN KEY ("managed_by") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."import_batches"
    ADD CONSTRAINT "import_batches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."import_records"
    ADD CONSTRAINT "import_records_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."import_records"
    ADD CONSTRAINT "import_records_imported_student_id_fkey" FOREIGN KEY ("imported_student_id") REFERENCES "public"."students"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."position_student_assignments"
    ADD CONSTRAINT "position_student_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."position_student_assignments"
    ADD CONSTRAINT "position_student_assignments_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."teaching_demands"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_student_assignments"
    ADD CONSTRAINT "position_student_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_assignments"
    ADD CONSTRAINT "student_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_assignments"
    ADD CONSTRAINT "student_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_evaluations"
    ADD CONSTRAINT "teacher_evaluations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."teacher_evaluations"
    ADD CONSTRAINT "teacher_evaluations_evaluated_by_fkey" FOREIGN KEY ("evaluated_by") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."teaching_demands"
    ADD CONSTRAINT "teaching_demands_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Demo mode full access" ON "public"."user_profiles" USING (true);



CREATE POLICY "Demo mode full access admin" ON "public"."admin_management" USING (true);



CREATE POLICY "用户只能查看自己批次的导入记录" ON "public"."import_records" USING ((EXISTS ( SELECT 1
   FROM "public"."import_batches"
  WHERE (("import_batches"."id" = "import_records"."batch_id") AND ("import_batches"."created_by" = "auth"."uid"())))));



CREATE POLICY "用户只能查看自己的导入批次" ON "public"."import_batches" USING (("created_by" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."add_super_admin_to_management"("admin_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_super_admin_to_management"("admin_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_super_admin_to_management"("admin_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_super_admin"("phone_number" "text", "name" "text", "organization" "text", "password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_super_admin"("phone_number" "text", "name" "text", "organization" "text", "password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_super_admin"("phone_number" "text", "name" "text", "organization" "text", "password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_sql"("sql" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_sql"("sql" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_sql"("sql" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_password"("phone" "text", "new_password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_password"("phone" "text", "new_password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_password"("phone" "text", "new_password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_password"("phone" "text", "password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_password"("phone" "text", "password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_password"("phone" "text", "password" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."admin_management" TO "anon";
GRANT ALL ON TABLE "public"."admin_management" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_management" TO "service_role";



GRANT ALL ON TABLE "public"."admin_statistics" TO "anon";
GRANT ALL ON TABLE "public"."admin_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."student_assignments" TO "anon";
GRANT ALL ON TABLE "public"."student_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."student_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."assignment_statistics" TO "anon";
GRANT ALL ON TABLE "public"."assignment_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."assignment_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."teaching_demands" TO "anon";
GRANT ALL ON TABLE "public"."teaching_demands" TO "authenticated";
GRANT ALL ON TABLE "public"."teaching_demands" TO "service_role";



GRANT ALL ON TABLE "public"."demand_statistics" TO "anon";
GRANT ALL ON TABLE "public"."demand_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."demand_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_evaluations" TO "anon";
GRANT ALL ON TABLE "public"."teacher_evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_evaluations" TO "service_role";



GRANT ALL ON TABLE "public"."evaluation_statistics" TO "anon";
GRANT ALL ON TABLE "public"."evaluation_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluation_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."import_batches" TO "anon";
GRANT ALL ON TABLE "public"."import_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."import_batches" TO "service_role";



GRANT ALL ON SEQUENCE "public"."import_batches_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."import_batches_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."import_batches_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."import_records" TO "anon";
GRANT ALL ON TABLE "public"."import_records" TO "authenticated";
GRANT ALL ON TABLE "public"."import_records" TO "service_role";



GRANT ALL ON SEQUENCE "public"."import_records_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."import_records_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."import_records_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."position_student_assignments" TO "anon";
GRANT ALL ON TABLE "public"."position_student_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."position_student_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."position_assignment_stats" TO "anon";
GRANT ALL ON TABLE "public"."position_assignment_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."position_assignment_stats" TO "service_role";



GRANT ALL ON SEQUENCE "public"."position_student_assignments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."position_student_assignments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."position_student_assignments_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."student_assignments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."student_assignments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."student_assignments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";



GRANT ALL ON TABLE "public"."student_statistics" TO "anon";
GRANT ALL ON TABLE "public"."student_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."student_statistics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."students_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."students_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."students_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."teacher_evaluations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teacher_evaluations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teacher_evaluations_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."teaching_demands_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teaching_demands_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teaching_demands_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles_backup" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles_backup" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles_backup" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
