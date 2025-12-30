/**
 * 任务服务
 * 封装与 Supabase tasks 表交互的核心函数
 */
import { supabase } from '../lib/supabase'
import type {
  Task,
  TaskTree,
  CreateTaskInput,
  TaskStatus,
} from '../types/database'
import { buildTaskTree } from '../types/database'

// ============================================
// 1. 添加任务
// ============================================
/**
 * 添加任务到虚空或作为子任务
 * @param content 任务内容
 * @param parentId 父任务 ID（可选，不传则添加到虚空）
 * @returns 创建的任务对象
 */
export async function addTask(
  content: string,
  parentId?: string | null
): Promise<Task> {
  // 构建创建任务的输入
  const taskData: CreateTaskInput = {
    content,
    parent_id: parentId ?? null,
    coordinate_x: 50.0, // 默认坐标
    coordinate_y: 50.0,
    status: 'inbox', // 默认状态为虚空
  }

  // 插入任务
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single()

  if (error) {
    console.error('添加任务失败:', error)
    throw new Error(`添加任务失败: ${error.message}`)
  }

  return data as Task
}

// ============================================
// 2. 获取任务树
// ============================================
/**
 * 获取当前用户的所有任务，并将其转换为树状结构
 * @param status 可选：过滤特定状态的任务
 * @returns 任务树数组
 */
export async function getTaskTree(
  status?: TaskStatus | TaskStatus[]
): Promise<TaskTree[]> {
  // 构建查询
  let query = supabase.from('tasks').select('*').order('created_at', { ascending: false })

  // 如果指定了状态过滤
  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status)
    } else {
      query = query.eq('status', status)
    }
  }

  // 执行查询
  const { data, error } = await query

  if (error) {
    console.error('获取任务失败:', error)
    throw new Error(`获取任务失败: ${error.message}`)
  }

  // 转换为树状结构
  const tasks = (data || []) as Task[]
  return buildTaskTree(tasks)
}

// ============================================
// 3. 更新坐标
// ============================================
/**
 * 更新任务在"引力场"中的坐标
 * 当用户在 InterestGravity 视图中拖拽气泡结束时调用
 * @param id 任务 ID
 * @param x 新的 X 坐标 (0-100)
 * @param y 新的 Y 坐标 (0-100)
 * @returns 更新后的任务对象
 */
export async function updateCoordinates(
  id: string,
  x: number,
  y: number
): Promise<Task> {
  // 验证坐标范围
  if (x < 0 || x > 100 || y < 0 || y > 100) {
    throw new Error('坐标值必须在 0-100 范围内')
  }

  // 更新任务坐标
  // last_touched_at 会由数据库触发器自动更新
  const { data, error } = await supabase
    .from('tasks')
    .update({
      coordinate_x: x,
      coordinate_y: y,
      // 显式更新 last_touched_at 以确保新鲜度
      last_touched_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('更新坐标失败:', error)
    throw new Error(`更新坐标失败: ${error.message}`)
  }

  return data as Task
}

// ============================================
// 4. 任务衰减（移至墓地）
// ============================================
/**
 * 找出所有 last_touched_at 超过 14 天且未完成的任务，将其 status 改为 'archived'
 * @param daysThreshold 天数阈值，默认 14 天
 * @returns 被移至墓地的任务数量
 */
export async function decayTasks(daysThreshold: number = 14): Promise<number> {
  // 计算截止日期
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysThreshold)
  const cutoffDateISO = cutoffDate.toISOString()

  // 查找需要移至墓地的任务
  // 条件：status 不是 'completed' 和 'archived'，且 last_touched_at 超过阈值
  const { data: staleTasks, error: fetchError } = await supabase
    .from('tasks')
    .select('id')
    .in('status', ['inbox', 'active']) // 只查找 inbox 和 active 状态的任务
    .lt('last_touched_at', cutoffDateISO)

  if (fetchError) {
    console.error('查询过期任务失败:', fetchError)
    throw new Error(`查询过期任务失败: ${fetchError.message}`)
  }

  if (!staleTasks || staleTasks.length === 0) {
    return 0
  }

  // 批量更新状态为 'archived'
  const taskIds = staleTasks.map((task) => task.id)
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ status: 'archived' })
    .in('id', taskIds)

  if (updateError) {
    console.error('更新任务状态失败:', updateError)
    throw new Error(`更新任务状态失败: ${updateError.message}`)
  }

  return taskIds.length
}

// ============================================
// 辅助函数：获取单个任务
// ============================================
/**
 * 根据 ID 获取单个任务
 * @param id 任务 ID
 * @returns 任务对象
 */
export async function getTask(id: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // 任务不存在
      return null
    }
    console.error('获取任务失败:', error)
    throw new Error(`获取任务失败: ${error.message}`)
  }

  return data as Task
}

// ============================================
// 辅助函数：更新任务
// ============================================
/**
 * 更新任务
 * @param id 任务 ID
 * @param updates 要更新的字段
 * @returns 更新后的任务对象
 */
export async function updateTask(
  id: string,
  updates: {
    content?: string
    status?: TaskStatus
    coordinate_x?: number
    coordinate_y?: number
    parent_id?: string | null
  }
): Promise<Task> {
  // 如果更新了坐标，同时更新 last_touched_at
  const updateData: any = { ...updates }
  if (updates.coordinate_x !== undefined || updates.coordinate_y !== undefined) {
    updateData.last_touched_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('更新任务失败:', error)
    throw new Error(`更新任务失败: ${error.message}`)
  }

  return data as Task
}

// ============================================
// 辅助函数：删除任务
// ============================================
/**
 * 删除任务（级联删除所有子任务）
 * @param id 任务 ID
 */
export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) {
    console.error('删除任务失败:', error)
    throw new Error(`删除任务失败: ${error.message}`)
  }
}

// ============================================
// 辅助函数：获取根任务（用于 TheVoid 视图）
// ============================================
/**
 * 获取所有根任务（parent_id 为 null）
 * @param status 可选：过滤特定状态
 * @returns 根任务数组
 */
export async function getRootTasks(
  status?: TaskStatus
): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select('*')
    .is('parent_id', null)
    .order('last_touched_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('获取根任务失败:', error)
    throw new Error(`获取根任务失败: ${error.message}`)
  }

  return (data || []) as Task[]
}

// ============================================
// 辅助函数：获取 InterestGravity 视图的任务
// ============================================
/**
 * 获取用于 InterestGravity 视图的任务（根任务，按坐标排序）
 * @returns 任务数组
 */
export async function getTasksForGravity(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .is('parent_id', null)
    .eq('status', 'active')
    .order('coordinate_y', { ascending: false }) // 按兴趣值降序
    .order('coordinate_x', { ascending: true }) // 按耗时升序

  if (error) {
    console.error('获取引力场任务失败:', error)
    throw new Error(`获取引力场任务失败: ${error.message}`)
  }

  return (data || []) as Task[]
}

