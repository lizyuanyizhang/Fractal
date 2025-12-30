-- Fractal 应用数据库 Schema
-- 使用 Supabase (PostgreSQL)

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 用于文本搜索优化

-- ============================================
-- 用户表（使用 Supabase Auth，这里只存储额外信息）
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 任务表（核心表）
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 基本信息
  title TEXT NOT NULL,
  description TEXT,
  
  -- 层级关系（支持无限嵌套）
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- 坐标属性（InterestGravity 视图）
  time_cost_x DECIMAL(5,2) DEFAULT 50.0 CHECK (time_cost_x >= 0 AND time_cost_x <= 100), -- 耗时 (0-100, Quick -> Eternal)
  interest_y DECIMAL(5,2) DEFAULT 50.0 CHECK (interest_y >= 0 AND interest_y <= 100), -- 多巴胺/兴趣值 (0-100, Boring -> Exciting)
  
  -- 任务属性
  difficulty INTEGER DEFAULT 5 CHECK (difficulty >= 1 AND difficulty <= 10), -- 困难程度 (1-10)
  category TEXT DEFAULT 'work' CHECK (category IN ('work', 'personal', 'learning', 'creative', 'health')),
  
  -- 状态管理
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'graveyard')),
  
  -- 新鲜度（用于墓地机制）
  last_touched_at TIMESTAMPTZ DEFAULT NOW(), -- 最后交互时间
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 执行相关
  focus_started_at TIMESTAMPTZ, -- 进入 FocusTunnel 的时间
  total_focus_time INTEGER DEFAULT 0, -- 累计专注时间（秒）
  
  -- 排序和位置
  position INTEGER DEFAULT 0, -- 同层级内的排序位置
  
  -- 元数据
  metadata JSONB DEFAULT '{}'::jsonb -- 存储额外信息（如 React Flow 节点位置等）
);

-- ============================================
-- 索引优化
-- ============================================

-- 用户查询优化
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);

-- 层级查询优化
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_user_parent ON tasks(user_id, parent_id);

-- 新鲜度查询优化（用于墓地机制）
CREATE INDEX IF NOT EXISTS idx_tasks_last_touched ON tasks(last_touched_at) WHERE status = 'active';

-- 坐标查询优化（用于 InterestGravity 视图）
CREATE INDEX IF NOT EXISTS idx_tasks_coordinates ON tasks(user_id, time_cost_x, interest_y) WHERE status = 'active';

-- 全文搜索优化
CREATE INDEX IF NOT EXISTS idx_tasks_title_search ON tasks USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tasks_description_search ON tasks USING gin(description gin_trgm_ops);

-- JSONB 索引（用于元数据查询）
CREATE INDEX IF NOT EXISTS idx_tasks_metadata ON tasks USING gin(metadata);

-- ============================================
-- 触发器：自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 触发器：自动更新 last_touched_at
-- ============================================
CREATE OR REPLACE FUNCTION update_last_touched_at()
RETURNS TRIGGER AS $$
BEGIN
  -- 当任务状态改变或坐标更新时，更新最后触摸时间
  IF OLD.status != NEW.status OR 
     OLD.time_cost_x != NEW.time_cost_x OR 
     OLD.interest_y != NEW.interest_y OR
     OLD.title != NEW.title THEN
    NEW.last_touched_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_last_touched
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_last_touched_at();

-- ============================================
-- 函数：获取任务的所有子任务（递归）
-- ============================================
CREATE OR REPLACE FUNCTION get_task_descendants(task_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  parent_id UUID,
  depth INTEGER,
  path TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE task_tree AS (
    -- 起始节点
    SELECT 
      t.id,
      t.title,
      t.parent_id,
      0 AS depth,
      ARRAY[t.id::TEXT] AS path
    FROM tasks t
    WHERE t.id = task_uuid
    
    UNION ALL
    
    -- 递归查找子节点
    SELECT 
      t.id,
      t.title,
      t.parent_id,
      tt.depth + 1,
      tt.path || t.id::TEXT
    FROM tasks t
    INNER JOIN task_tree tt ON t.parent_id = tt.id
    WHERE NOT t.id = ANY(tt.path) -- 防止循环引用
  )
  SELECT * FROM task_tree;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 函数：获取任务的所有父任务（递归）
-- ============================================
CREATE OR REPLACE FUNCTION get_task_ancestors(task_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  parent_id UUID,
  depth INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE task_tree AS (
    -- 起始节点
    SELECT 
      t.id,
      t.title,
      t.parent_id,
      0 AS depth
    FROM tasks t
    WHERE t.id = task_uuid
    
    UNION ALL
    
    -- 递归查找父节点
    SELECT 
      t.id,
      t.title,
      t.parent_id,
      tt.depth - 1
    FROM tasks t
    INNER JOIN task_tree tt ON t.id = tt.parent_id
  )
  SELECT * FROM task_tree ORDER BY depth;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 函数：将过期任务移至墓地
-- ============================================
CREATE OR REPLACE FUNCTION move_stale_tasks_to_graveyard(days_threshold INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  moved_count INTEGER;
BEGIN
  UPDATE tasks
  SET status = 'graveyard',
      updated_at = NOW()
  WHERE status = 'active'
    AND last_touched_at < NOW() - (days_threshold || ' days')::INTERVAL
    AND parent_id IS NULL; -- 只移动根任务，子任务会随父任务一起移动
  
  GET DIAGNOSTICS moved_count = ROW_COUNT;
  RETURN moved_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 视图：任务树视图（包含层级信息）
-- ============================================
CREATE OR REPLACE VIEW task_tree_view AS
WITH RECURSIVE task_hierarchy AS (
  -- 根任务
  SELECT 
    t.id,
    t.title,
    t.parent_id,
    t.user_id,
    t.status,
    t.time_cost_x,
    t.interest_y,
    t.difficulty,
    t.category,
    t.last_touched_at,
    t.created_at,
    0 AS depth,
    ARRAY[t.id] AS path,
    t.id::TEXT AS path_string
  FROM tasks t
  WHERE t.parent_id IS NULL
  
  UNION ALL
  
  -- 子任务
  SELECT 
    t.id,
    t.title,
    t.parent_id,
    t.user_id,
    t.status,
    t.time_cost_x,
    t.interest_y,
    t.difficulty,
    t.category,
    t.last_touched_at,
    t.created_at,
    th.depth + 1,
    th.path || t.id,
    th.path_string || ' > ' || t.id::TEXT
  FROM tasks t
  INNER JOIN task_hierarchy th ON t.parent_id = th.id
  WHERE NOT t.id = ANY(th.path) -- 防止循环引用
)
SELECT * FROM task_hierarchy;

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: 用户可以查看和更新自己的资料
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Tasks: 用户只能访问自己的任务
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 初始化数据（可选）
-- ============================================

-- 注释：实际使用时，这些数据会通过应用层创建
-- 这里只是示例结构

COMMENT ON TABLE tasks IS '任务表，支持无限层级嵌套';
COMMENT ON COLUMN tasks.time_cost_x IS '耗时坐标 (0-100, Quick -> Eternal)';
COMMENT ON COLUMN tasks.interest_y IS '兴趣值坐标 (0-100, Boring -> Exciting)';
COMMENT ON COLUMN tasks.last_touched_at IS '最后交互时间，用于新鲜度计算';
COMMENT ON COLUMN tasks.status IS '任务状态: active, completed, archived, graveyard';
COMMENT ON COLUMN tasks.metadata IS 'JSONB 字段，存储额外信息如 React Flow 节点位置等';

