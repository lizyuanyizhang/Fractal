# Fractal 数据库 Schema

## 概述

Fractal 使用 Supabase (PostgreSQL) 作为数据库，支持以下核心功能：

1. **无限层级嵌套**：任务可以无限层级嵌套（父子关系）
2. **坐标属性**：任务基于"兴趣值"和"耗时"的二维坐标
3. **新鲜度机制**：太久没动的任务会进入"墓地"

## 核心表结构

### `tasks` 表

主要字段：

- `id`: UUID 主键
- `user_id`: 用户 ID（关联 Supabase Auth）
- `title`: 任务标题
- `description`: 任务描述
- `parent_id`: 父任务 ID（支持无限嵌套）
- `time_cost_x`: 耗时坐标 (0-100, Quick -> Eternal)
- `interest_y`: 兴趣值坐标 (0-100, Boring -> Exciting)
- `difficulty`: 困难程度 (1-10)
- `category`: 任务类别 (work, personal, learning, creative, health)
- `status`: 任务状态 (active, completed, archived, graveyard)
- `last_touched_at`: 最后交互时间（用于新鲜度计算）
- `total_focus_time`: 累计专注时间（秒）
- `metadata`: JSONB 字段，存储额外信息（如 React Flow 节点位置）

### `profiles` 表

用户资料表（扩展 Supabase Auth）：

- `id`: UUID（关联 auth.users）
- `username`: 用户名
- `email`: 邮箱
- `avatar_url`: 头像 URL

## 关键功能

### 1. 无限层级嵌套

通过 `parent_id` 字段实现自引用关系，支持无限层级嵌套。

```sql
-- 查询所有子任务
SELECT * FROM get_task_descendants('task-uuid');

-- 查询所有父任务
SELECT * FROM get_task_ancestors('task-uuid');
```

### 2. 坐标属性

任务在 InterestGravity 视图中的位置由 `time_cost_x` 和 `interest_y` 决定：

- `time_cost_x`: 0 = Quick, 100 = Eternal
- `interest_y`: 0 = Boring, 100 = Exciting

### 3. 新鲜度机制

通过 `last_touched_at` 字段跟踪任务最后交互时间：

```sql
-- 将超过 30 天未动的任务移至墓地
SELECT move_stale_tasks_to_graveyard(30);
```

## 索引优化

数据库包含以下索引以优化查询性能：

- 用户查询：`idx_tasks_user_id`, `idx_tasks_user_status`
- 层级查询：`idx_tasks_parent_id`, `idx_tasks_user_parent`
- 新鲜度查询：`idx_tasks_last_touched`
- 坐标查询：`idx_tasks_coordinates`
- 全文搜索：`idx_tasks_title_search`, `idx_tasks_description_search`

## Row Level Security (RLS)

所有表都启用了 RLS，确保用户只能访问自己的数据：

- 用户只能查看、创建、更新、删除自己的任务
- 用户只能访问自己的资料

## 部署步骤

### 在 Supabase 中部署

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `database/schema.sql` 的内容
4. 执行 SQL 脚本

### 使用 Supabase CLI

```bash
# 安装 Supabase CLI
npm install -g supabase

# 初始化项目
supabase init

# 创建迁移
supabase migration new initial_schema

# 应用迁移
supabase db push
```

## 常用查询示例

### 获取用户的所有根任务

```sql
SELECT * FROM tasks 
WHERE user_id = auth.uid() 
  AND parent_id IS NULL 
  AND status = 'active'
ORDER BY last_touched_at DESC;
```

### 获取任务及其所有子任务

```sql
SELECT * FROM task_tree_view 
WHERE user_id = auth.uid() 
  AND path_string LIKE '%task-uuid%'
ORDER BY depth, position;
```

### 获取 InterestGravity 视图的任务

```sql
SELECT * FROM tasks 
WHERE user_id = auth.uid() 
  AND status = 'active'
ORDER BY interest_y DESC, time_cost_x ASC;
```

### 获取需要移至墓地的任务

```sql
SELECT * FROM tasks 
WHERE user_id = auth.uid() 
  AND status = 'active'
  AND last_touched_at < NOW() - INTERVAL '30 days'
  AND parent_id IS NULL;
```

## 注意事项

1. **循环引用防护**：递归查询中包含循环引用检测
2. **级联删除**：删除父任务时，子任务会自动删除
3. **自动更新**：`updated_at` 和 `last_touched_at` 通过触发器自动更新
4. **数据完整性**：使用 CHECK 约束确保坐标和难度值在有效范围内

## 未来扩展

可以考虑添加：

- 任务标签系统
- 任务依赖关系（前置任务）
- 任务评论/笔记
- 任务附件
- 任务模板
- 任务统计和分析

