# 禁用Supabase表RLS指南

## 问题确认

测试显示尽管您提到RLS已关闭，但系统仍报告RLS策略限制（错误代码：42501）。这解释了为什么:

1. 无法查询到学生分配数据
2. 无法插入测试数据
3. 系统显示"暂无分配学生信息"

## 方法一：通过Supabase Studio手动禁用RLS（推荐）

1. **启动Supabase本地开发服务器**（如果尚未运行）
   ```bash
   npx supabase start
   ```

2. **访问Supabase Studio**
   - 打开浏览器访问: http://127.0.0.1:54323
   - 默认不需要密码

3. **为每个相关表禁用RLS**:
   - 点击左侧菜单的"Table Editor"
   - 选择 `position_student_assignments` 表
   - 点击右上角的"RLS"按钮
   - 确保"Enable Row Level Security"开关处于**关闭**状态
   - 对以下表重复相同操作：
     - `students`
     - `teaching_demands`
     - `user_profiles`
     - `school_demands`

## 方法二：使用SQL命令禁用RLS

1. **连接到本地数据库**
   ```bash
   # 使用npx连接到本地Supabase数据库
   npx supabase sql
   ```

2. **执行以下SQL命令**
   ```sql
   -- 禁用所有相关表的RLS
   ALTER TABLE position_student_assignments DISABLE ROW LEVEL SECURITY;
   ALTER TABLE students DISABLE ROW LEVEL SECURITY;
   ALTER TABLE teaching_demands DISABLE ROW LEVEL SECURITY;
   ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
   
   -- 验证RLS状态
   SELECT relname, relrowsecurity FROM pg_class WHERE relname IN (
     'position_student_assignments', 
     'students', 
     'teaching_demands', 
     'user_profiles'
   );
   ```
   - 确认输出中的`relrowsecurity`值都为`f`（表示已禁用）

## 插入测试数据（RLS禁用后）

禁用RLS后，您可以运行以下命令插入测试数据：

```bash
node insert_test_data.js
```

## 验证数据插入是否成功

1. 运行检查脚本验证数据：
   ```bash
   node check_position_table.js
   ```

2. 在系统中测试"查看学生分配信息"功能

## 故障排除

如果仍然遇到问题：

1. 确认您连接的是正确的数据库实例
2. 检查是否有其他权限限制
3. 验证表名是否正确（可能数据存储在其他表中）
4. 尝试通过Supabase Studio直接插入和查询数据进行验证

## 重要提示

- 禁用RLS仅适用于开发环境，生产环境应保持适当的RLS策略
- 完成测试后，请根据需要重新启用RLS