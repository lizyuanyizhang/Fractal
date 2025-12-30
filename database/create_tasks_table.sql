-- 创建 tasks 表
-- Supabase (PostgreSQL)

-- 启用 UUID 扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建 tasks 表
CREATE TABLE IF NOT EXISTS tasks (
  -- 主键
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 用户关联（多用户隔离）
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 任务内容
  content TEXT NOT NULL,
  
  -- 层级关系（无限拆解）
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- 坐标属性
  coordinate_x DECIMAL(5,2) DEFAULT 50.0 CHECK (coordinate_x >= 0 AND coordinate_x <= 100), -- 耗时/难度 (0-100)
  coordinate_y DECIMAL(5,2) DEFAULT 50.0 CHECK (coordinate_y >= 0 AND coordinate_y <= 100), -- 多巴胺/兴趣 (0-100)
  
  -- 任务状态
  status TEXT NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox', 'active', 'completed', 'archived')),
  
  -- 新鲜度
  last_touched_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 创建时间
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_last_touched ON tasks(last_touched_at) WHERE status = 'active';

-- 启用 Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能查看自己的任务
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能插入自己的任务
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能更新自己的任务
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- 创建 RLS 策略：用户只能删除自己的任务
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- 添加注释
COMMENT ON TABLE tasks IS '任务表，支持无限层级嵌套和坐标属性';
COMMENT ON COLUMN tasks.content IS '任务文本内容';
COMMENT ON COLUMN tasks.parent_id IS '父任务 ID，为空表示根节点';
COMMENT ON COLUMN tasks.coordinate_x IS '耗时/难度坐标 (0-100)';
COMMENT ON COLUMN tasks.coordinate_y IS '多巴胺/兴趣坐标 (0-100)';
COMMENT ON COLUMN tasks.status IS '任务状态: inbox(虚空), active(活跃), completed(完成), archived(墓地)';
COMMENT ON COLUMN tasks.last_touched_at IS '最后交互时间，用于判断任务新鲜度';

