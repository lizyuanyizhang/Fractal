/**
 * 数据库类型定义
 * 对应 Supabase tasks 表结构
 */

// ============================================
// 任务状态枚举
// ============================================
export type TaskStatus = 'inbox' | 'active' | 'completed' | 'archived'

// ============================================
// 基础 Task 接口（对应数据库表结构）
// ============================================
export interface Task {
  id: string // UUID
  user_id: string // UUID
  content: string // 任务文本内容
  parent_id: string | null // UUID, 父任务 ID，null 表示根节点
  coordinate_x: number // 耗时/难度坐标 (0-100)
  coordinate_y: number // 多巴胺/兴趣坐标 (0-100)
  status: TaskStatus // 任务状态
  last_touched_at: string // ISO 8601 时间戳
  created_at: string // ISO 8601 时间戳
}

// ============================================
// TaskTree 接口（用于递归渲染）
// ============================================
export interface TaskTree extends Task {
  children: TaskTree[] // 子任务数组，支持无限嵌套
}

// ============================================
// 辅助类型：创建任务输入
// ============================================
export interface CreateTaskInput {
  content: string
  parent_id?: string | null
  coordinate_x?: number // 默认 50.0
  coordinate_y?: number // 默认 50.0
  status?: TaskStatus // 默认 'inbox'
}

// ============================================
// 辅助类型：更新任务输入
// ============================================
export interface UpdateTaskInput {
  content?: string
  parent_id?: string | null
  coordinate_x?: number
  coordinate_y?: number
  status?: TaskStatus
  // 注意：last_touched_at 通常由数据库触发器自动更新
}

// ============================================
// 辅助类型：任务查询过滤
// ============================================
export interface TaskFilters {
  status?: TaskStatus | TaskStatus[]
  parent_id?: string | null
  min_coordinate_x?: number
  max_coordinate_x?: number
  min_coordinate_y?: number
  max_coordinate_y?: number
  search?: string // 全文搜索
}

// ============================================
// 辅助类型：任务统计
// ============================================
export interface TaskStats {
  total: number
  inbox: number
  active: number
  completed: number
  archived: number
}

// ============================================
// 辅助函数：将 Task[] 转换为 TaskTree[]
// ============================================
export function buildTaskTree(tasks: Task[]): TaskTree[] {
  // 创建任务映射表
  const taskMap = new Map<string, TaskTree>()
  
  // 初始化所有任务为 TaskTree（children 为空数组）
  tasks.forEach((task) => {
    taskMap.set(task.id, { ...task, children: [] })
  })
  
  // 构建树结构
  const rootTasks: TaskTree[] = []
  
  tasks.forEach((task) => {
    const treeNode = taskMap.get(task.id)!
    
    if (task.parent_id === null) {
      // 根节点
      rootTasks.push(treeNode)
    } else {
      // 子节点，添加到父节点的 children 中
      const parent = taskMap.get(task.parent_id)
      if (parent) {
        parent.children.push(treeNode)
      }
    }
  })
  
  return rootTasks
}

// ============================================
// 辅助函数：扁平化 TaskTree[] 为 Task[]
// ============================================
export function flattenTaskTree(tree: TaskTree[]): Task[] {
  const result: Task[] = []
  
  function traverse(node: TaskTree) {
    const { children, ...task } = node
    result.push(task)
    children.forEach(traverse)
  }
  
  tree.forEach(traverse)
  return result
}

// ============================================
// 辅助函数：查找任务的所有子任务（递归）
// ============================================
export function getAllDescendants(
  tasks: Task[],
  parentId: string
): Task[] {
  const children = tasks.filter((task) => task.parent_id === parentId)
  const descendants: Task[] = [...children]
  
  children.forEach((child) => {
    descendants.push(...getAllDescendants(tasks, child.id))
  })
  
  return descendants
}

// ============================================
// 辅助函数：查找任务的所有父任务（递归）
// ============================================
export function getAllAncestors(
  tasks: Task[],
  taskId: string
): Task[] {
  const task = tasks.find((t) => t.id === taskId)
  if (!task || !task.parent_id) {
    return []
  }
  
  const parent = tasks.find((t) => t.id === task.parent_id)
  if (!parent) {
    return []
  }
  
  return [parent, ...getAllAncestors(tasks, parent.id)]
}

// ============================================
// 辅助函数：获取任务的深度
// ============================================
export function getTaskDepth(tasks: Task[], taskId: string): number {
  const ancestors = getAllAncestors(tasks, taskId)
  return ancestors.length
}

// ============================================
// 类型守卫：检查是否为根任务
// ============================================
export function isRootTask(task: Task): boolean {
  return task.parent_id === null
}

// ============================================
// 类型守卫：检查任务状态
// ============================================
export function isTaskStatus(
  task: Task,
  status: TaskStatus | TaskStatus[]
): boolean {
  if (Array.isArray(status)) {
    return status.includes(task.status)
  }
  return task.status === status
}

