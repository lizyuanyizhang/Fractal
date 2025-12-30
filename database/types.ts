// TypeScript 类型定义，对应数据库 Schema
// 用于前端类型安全

export type TaskCategory = 'work' | 'personal' | 'learning' | 'creative' | 'health'
export type TaskStatus = 'active' | 'completed' | 'archived' | 'graveyard'

export interface Task {
  id: string
  user_id: string
  
  // 基本信息
  title: string
  description?: string | null
  
  // 层级关系
  parent_id?: string | null
  
  // 坐标属性
  time_cost_x: number // 0-100, Quick -> Eternal
  interest_y: number // 0-100, Boring -> Exciting
  
  // 任务属性
  difficulty: number // 1-10
  category: TaskCategory
  
  // 状态管理
  status: TaskStatus
  
  // 新鲜度
  last_touched_at: string
  created_at: string
  updated_at: string
  
  // 执行相关
  focus_started_at?: string | null
  total_focus_time: number // 秒
  
  // 排序和位置
  position: number
  
  // 元数据
  metadata?: Record<string, any>
}

export interface TaskWithChildren extends Task {
  children?: TaskWithChildren[]
  depth?: number
  path?: string[]
}

export interface Profile {
  id: string
  username?: string | null
  email?: string
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

// 用于创建任务的输入类型
export interface CreateTaskInput {
  title: string
  description?: string
  parent_id?: string | null
  time_cost_x?: number
  interest_y?: number
  difficulty?: number
  category?: TaskCategory
  metadata?: Record<string, any>
}

// 用于更新任务的输入类型
export interface UpdateTaskInput {
  title?: string
  description?: string
  time_cost_x?: number
  interest_y?: number
  difficulty?: number
  category?: TaskCategory
  status?: TaskStatus
  metadata?: Record<string, any>
}

// 用于查询任务的过滤条件
export interface TaskFilters {
  status?: TaskStatus | TaskStatus[]
  category?: TaskCategory | TaskCategory[]
  parent_id?: string | null
  min_interest?: number
  max_interest?: number
  min_time_cost?: number
  max_time_cost?: number
  search?: string
}

// React Flow 节点位置（存储在 metadata 中）
export interface ReactFlowPosition {
  x: number
  y: number
}

// 任务统计
export interface TaskStats {
  total: number
  active: number
  completed: number
  archived: number
  graveyard: number
  by_category: Record<TaskCategory, number>
  total_focus_time: number // 秒
  average_difficulty: number
}

