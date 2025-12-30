-- 常用查询函数和视图
-- 这些查询可以在 Supabase 中作为数据库函数创建，或在前端直接使用

-- ============================================
-- 查询函数
-- ============================================

-- 1. 获取用户的所有根任务（用于 TheVoid 视图）
CREATE OR REPLACE FUNCTION get_root_tasks(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  time_cost_x DECIMAL,
  interest_y DECIMAL,
  difficulty INTEGER,
  category TEXT,
  status TEXT,
  last_touched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  total_focus_time INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.time_cost_x,
    t.interest_y,
    t.difficulty,
    t.category,
    t.status,
    t.last_touched_at,
    t.created_at,
    t.total_focus_time
  FROM tasks t
  WHERE t.user_id = user_uuid
    AND t.parent_id IS NULL
    AND t.status = 'active'
  ORDER BY t.last_touched_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 获取任务树（用于 ThePrism 视图）
CREATE OR REPLACE FUNCTION get_task_tree(user_uuid UUID, root_task_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  parent_id UUID,
  time_cost_x DECIMAL,
  interest_y DECIMAL,
  difficulty INTEGER,
  category TEXT,
  status TEXT,
  depth INTEGER,
  path TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE task_tree AS (
    -- 起始节点（根任务或指定任务）
    SELECT 
      t.id,
      t.title,
      t.parent_id,
      t.time_cost_x,
      t.interest_y,
      t.difficulty,
      t.category,
      t.status,
      0 AS depth,
      ARRAY[t.id::TEXT] AS path
    FROM tasks t
    WHERE t.user_id = user_uuid
      AND (
        (root_task_uuid IS NULL AND t.parent_id IS NULL) OR
        (root_task_uuid IS NOT NULL AND t.id = root_task_uuid)
      )
      AND t.status = 'active'
    
    UNION ALL
    
    -- 递归查找子节点
    SELECT 
      t.id,
      t.title,
      t.parent_id,
      t.time_cost_x,
      t.interest_y,
      t.difficulty,
      t.category,
      t.status,
      tt.depth + 1,
      tt.path || t.id::TEXT
    FROM tasks t
    INNER JOIN task_tree tt ON t.parent_id = tt.id
    WHERE t.user_id = user_uuid
      AND t.status = 'active'
      AND NOT t.id = ANY(tt.path) -- 防止循环引用
  )
  SELECT * FROM task_tree ORDER BY depth, path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 获取 InterestGravity 视图的任务（按坐标排序）
CREATE OR REPLACE FUNCTION get_tasks_for_gravity(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  difficulty INTEGER,
  category TEXT,
  time_cost_x DECIMAL,
  interest_y DECIMAL,
  last_touched_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.difficulty,
    t.category,
    t.time_cost_x,
    t.interest_y,
    t.last_touched_at
  FROM tasks t
  WHERE t.user_id = user_uuid
    AND t.status = 'active'
    AND t.parent_id IS NULL -- 只显示根任务
  ORDER BY t.interest_y DESC, t.time_cost_x ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 搜索任务（全文搜索）
CREATE OR REPLACE FUNCTION search_tasks(user_uuid UUID, search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  parent_id UUID,
  status TEXT,
  category TEXT,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.parent_id,
    t.status,
    t.category,
    GREATEST(
      similarity(t.title, search_query),
      COALESCE(similarity(t.description, search_query), 0)
    ) AS similarity
  FROM tasks t
  WHERE t.user_id = user_uuid
    AND (
      t.title ILIKE '%' || search_query || '%' OR
      t.description ILIKE '%' || search_query || '%'
    )
  ORDER BY similarity DESC, t.last_touched_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 获取任务统计信息
CREATE OR REPLACE FUNCTION get_task_stats(user_uuid UUID)
RETURNS TABLE (
  total INTEGER,
  active INTEGER,
  completed INTEGER,
  archived INTEGER,
  graveyard INTEGER,
  total_focus_time INTEGER,
  average_difficulty DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total,
    COUNT(*) FILTER (WHERE status = 'active')::INTEGER AS active,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER AS completed,
    COUNT(*) FILTER (WHERE status = 'archived')::INTEGER AS archived,
    COUNT(*) FILTER (WHERE status = 'graveyard')::INTEGER AS graveyard,
    COALESCE(SUM(total_focus_time), 0)::INTEGER AS total_focus_time,
    COALESCE(AVG(difficulty), 0)::DECIMAL AS average_difficulty
  FROM tasks
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 获取需要移至墓地的任务
CREATE OR REPLACE FUNCTION get_stale_tasks(user_uuid UUID, days_threshold INTEGER DEFAULT 30)
RETURNS TABLE (
  id UUID,
  title TEXT,
  last_touched_at TIMESTAMPTZ,
  days_since_touched INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.last_touched_at,
    EXTRACT(DAY FROM NOW() - t.last_touched_at)::INTEGER AS days_since_touched
  FROM tasks t
  WHERE t.user_id = user_uuid
    AND t.status = 'active'
    AND t.last_touched_at < NOW() - (days_threshold || ' days')::INTERVAL
    AND t.parent_id IS NULL -- 只显示根任务
  ORDER BY t.last_touched_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 更新任务坐标（用于 InterestGravity 拖拽）
CREATE OR REPLACE FUNCTION update_task_coordinates(
  task_uuid UUID,
  new_time_cost_x DECIMAL,
  new_interest_y DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE tasks
  SET 
    time_cost_x = new_time_cost_x,
    interest_y = new_interest_y,
    last_touched_at = NOW()
  WHERE id = task_uuid
    AND user_id = auth.uid();
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 创建子任务（用于 ThePrism 拆解）
CREATE OR REPLACE FUNCTION create_subtask(
  parent_uuid UUID,
  subtask_title TEXT,
  subtask_description TEXT DEFAULT NULL,
  subtask_category TEXT DEFAULT 'work'
)
RETURNS UUID AS $$
DECLARE
  new_task_id UUID;
  parent_user_id UUID;
BEGIN
  -- 获取父任务的用户 ID
  SELECT user_id INTO parent_user_id
  FROM tasks
  WHERE id = parent_uuid AND user_id = auth.uid();
  
  IF parent_user_id IS NULL THEN
    RAISE EXCEPTION 'Parent task not found or access denied';
  END IF;
  
  -- 创建子任务
  INSERT INTO tasks (
    user_id,
    title,
    description,
    parent_id,
    category,
    time_cost_x,
    interest_y,
    difficulty
  ) VALUES (
    parent_user_id,
    subtask_title,
    subtask_description,
    parent_uuid,
    subtask_category,
    50.0, -- 默认坐标
    50.0,
    5 -- 默认难度
  )
  RETURNING id INTO new_task_id;
  
  -- 更新父任务的最后触摸时间
  UPDATE tasks
  SET last_touched_at = NOW()
  WHERE id = parent_uuid;
  
  RETURN new_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 完成任务并更新统计
CREATE OR REPLACE FUNCTION complete_task(task_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE tasks
  SET 
    status = 'completed',
    updated_at = NOW(),
    last_touched_at = NOW()
  WHERE id = task_uuid
    AND user_id = auth.uid()
    AND status = 'active';
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 更新专注时间（用于 FocusTunnel）
CREATE OR REPLACE FUNCTION update_focus_time(
  task_uuid UUID,
  additional_seconds INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE tasks
  SET 
    total_focus_time = total_focus_time + additional_seconds,
    focus_started_at = NULL, -- 清除开始时间
    last_touched_at = NOW()
  WHERE id = task_uuid
    AND user_id = auth.uid();
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 视图：任务统计视图
-- ============================================
CREATE OR REPLACE VIEW task_statistics AS
SELECT 
  user_id,
  COUNT(*) AS total_tasks,
  COUNT(*) FILTER (WHERE status = 'active') AS active_tasks,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_tasks,
  COUNT(*) FILTER (WHERE status = 'archived') AS archived_tasks,
  COUNT(*) FILTER (WHERE status = 'graveyard') AS graveyard_tasks,
  SUM(total_focus_time) AS total_focus_seconds,
  AVG(difficulty) AS avg_difficulty,
  COUNT(*) FILTER (WHERE category = 'work') AS work_tasks,
  COUNT(*) FILTER (WHERE category = 'personal') AS personal_tasks,
  COUNT(*) FILTER (WHERE category = 'learning') AS learning_tasks,
  COUNT(*) FILTER (WHERE category = 'creative') AS creative_tasks,
  COUNT(*) FILTER (WHERE category = 'health') AS health_tasks
FROM tasks
GROUP BY user_id;

-- ============================================
-- 注释
-- ============================================
COMMENT ON FUNCTION get_root_tasks IS '获取用户的所有根任务（用于 TheVoid 视图）';
COMMENT ON FUNCTION get_task_tree IS '获取任务树（用于 ThePrism 视图）';
COMMENT ON FUNCTION get_tasks_for_gravity IS '获取 InterestGravity 视图的任务（按坐标排序）';
COMMENT ON FUNCTION search_tasks IS '搜索任务（全文搜索）';
COMMENT ON FUNCTION get_task_stats IS '获取任务统计信息';
COMMENT ON FUNCTION get_stale_tasks IS '获取需要移至墓地的任务';
COMMENT ON FUNCTION update_task_coordinates IS '更新任务坐标（用于 InterestGravity 拖拽）';
COMMENT ON FUNCTION create_subtask IS '创建子任务（用于 ThePrism 拆解）';
COMMENT ON FUNCTION complete_task IS '完成任务并更新统计';
COMMENT ON FUNCTION update_focus_time IS '更新专注时间（用于 FocusTunnel）';

