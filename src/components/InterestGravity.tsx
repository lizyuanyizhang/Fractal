import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import Navigation from './Navigation'

// 任务类别颜色映射
const categoryColors: Record<string, string> = {
  work: '#39FF14', // 霓虹绿
  personal: '#BF00FF', // 霓虹紫
  learning: '#00FFFF', // 青色
  creative: '#FF00FF', // 品红
  health: '#FFFF00', // 黄色
}

interface Task {
  id: string
  title: string
  difficulty: number // 1-10，决定气泡大小
  category: string
  x: number // 0-100，在坐标系中的位置
  y: number // 0-100
  highlighted?: boolean
}

// Mock 数据
const initialTasks: Task[] = [
  {
    id: '1',
    title: '写代码',
    difficulty: 7,
    category: 'work',
    x: 30,
    y: 80, // 高多巴胺，短耗时
  },
  {
    id: '2',
    title: '读论文',
    difficulty: 6,
    category: 'learning',
    x: 70,
    y: 60,
  },
  {
    id: '3',
    title: '健身',
    difficulty: 5,
    category: 'health',
    x: 40,
    y: 50,
  },
  {
    id: '4',
    title: '写博客',
    difficulty: 4,
    category: 'creative',
    x: 50,
    y: 70,
  },
  {
    id: '5',
    title: '开会',
    difficulty: 3,
    category: 'work',
    x: 60,
    y: 20, // 低多巴胺
  },
  {
    id: '6',
    title: '学新语言',
    difficulty: 8,
    category: 'learning',
    x: 80,
    y: 65,
  },
]

// 气泡组件
const TaskBubble = ({
  task,
  containerWidth,
  containerHeight,
  onPositionChange,
  onDragEnd,
}: {
  task: Task
  containerWidth: number
  containerHeight: number
  onPositionChange: (id: string, x: number, y: number) => void
  onDragEnd: () => void
}) => {
  // 将百分比转换为像素值
  const initialX = (task.x / 100) * containerWidth
  const initialY = (task.y / 100) * containerHeight

  const x = useMotionValue(initialX)
  const y = useMotionValue(initialY)
  const springX = useSpring(x, { stiffness: 300, damping: 30 })
  const springY = useSpring(y, { stiffness: 300, damping: 30 })

  const size = 20 + task.difficulty * 4 // 气泡大小基于困难程度
  const color = categoryColors[task.category] || categoryColors.work

  // 监听位置变化，转换为百分比
  useEffect(() => {
    const unsubscribeX = springX.on('change', (latestX) => {
      const percentX = (latestX / containerWidth) * 100
      const percentY = (y.get() / containerHeight) * 100
      onPositionChange(task.id, percentX, percentY)
    })
    const unsubscribeY = springY.on('change', (latestY) => {
      const percentX = (x.get() / containerWidth) * 100
      const percentY = (latestY / containerHeight) * 100
      onPositionChange(task.id, percentX, percentY)
    })

    return () => {
      unsubscribeX()
      unsubscribeY()
    }
  }, [springX, springY, task.id, x, y, containerWidth, containerHeight, onPositionChange])

  // 更新初始位置（当 task 位置改变时）
  useEffect(() => {
    const newX = (task.x / 100) * containerWidth
    const newY = (task.y / 100) * containerHeight
    x.set(newX)
    y.set(newY)
  }, [task.x, task.y, containerWidth, containerHeight, x, y])

  return (
    <motion.div
      style={{
        x: springX,
        y: springY,
        position: 'absolute',
        left: 0,
        top: 0,
        width: size,
        height: size,
        cursor: 'grab',
      }}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      dragConstraints={{
        left: 0,
        right: containerWidth - size,
        top: 0,
        bottom: containerHeight - size,
      }}
      onDragEnd={onDragEnd}
      whileDrag={{ cursor: 'grabbing', scale: 1.1, zIndex: 1000 }}
      className="relative"
    >
      {/* 漂浮动画包装器 */}
      <motion.div
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatType: 'reverse',
        }}
        className="relative w-full h-full"
      >
        <motion.div
          className="rounded-full relative w-full h-full"
          style={{
            backgroundColor: color,
            boxShadow: task.highlighted
              ? `0 0 30px ${color}, 0 0 60px ${color}`
              : `0 0 10px ${color}`,
          }}
          animate={{
            scale: task.highlighted ? [1, 1.2, 1] : 1,
            opacity: task.highlighted ? [1, 0.8, 1] : 1,
          }}
          transition={{
            duration: 1.5,
            repeat: task.highlighted ? Infinity : 0,
          }}
        >
          {/* 气泡内部光点 */}
          <div
            className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/30 blur-sm"
            style={{ opacity: 0.6 }}
          />
          
          {/* 任务标题提示 */}
          <motion.div
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded bg-slate-900/90 border border-slate-700 text-xs text-slate-200 font-mono pointer-events-none opacity-0"
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {task.title}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

interface InterestGravityProps {
  onNavigate?: (view: 'void' | 'prism' | 'gravity' | 'tunnel') => void
}

const InterestGravity = ({ onNavigate }: InterestGravityProps) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // 获取容器尺寸
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // 更新任务位置
  const handlePositionChange = (id: string, x: number, y: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              x: Math.max(0, Math.min(100, x)),
              y: Math.max(0, Math.min(100, y)),
            }
          : task
      )
    )
  }

  // 拖拽结束，恢复漂浮动画
  const handleDragEnd = () => {
    // 动画会自动恢复
  }

  // "I'm Feeling Lucky" 按钮点击
  const handleFeelingLucky = () => {
    // 找到右上角（高多巴胺+短耗时）的任务
    // 右上角 = 高 Y（多巴胺）+ 低 X（耗时）
    const topRightTasks = tasks
      .map((task) => ({
        task,
        score: (100 - task.x) + task.y, // 低 X + 高 Y = 高分
      }))
      .sort((a, b) => b.score - a.score)

    if (topRightTasks.length > 0) {
      const luckyTask = topRightTasks[0].task

      // 高亮显示
      setTasks((prevTasks) =>
        prevTasks.map((task) => ({
          ...task,
          highlighted: task.id === luckyTask.id,
        }))
      )

      // 3秒后取消高亮
      setTimeout(() => {
        setTasks((prevTasks) =>
          prevTasks.map((task) => ({
            ...task,
            highlighted: false,
          }))
        )
      }, 3000)
    }
  }

  return (
    <div className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden">
      {/* 坐标系容器 */}
      <div
        className="absolute inset-0 p-16"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(100, 116, 139, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(100, 116, 139, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '10% 10%',
        }}
      >
        {/* X轴标签 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-8">
          <span className="text-slate-500 font-mono text-sm">Quick</span>
          <span className="text-slate-400 font-mono text-xs">耗时</span>
          <span className="text-slate-500 font-mono text-sm">Eternal</span>
        </div>

        {/* Y轴标签 */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 -rotate-90 flex items-center gap-8">
          <span className="text-slate-500 font-mono text-sm">Boring</span>
          <span className="text-slate-400 font-mono text-xs">多巴胺</span>
          <span className="text-slate-500 font-mono text-sm">Exciting</span>
        </div>

        {/* 坐标轴线条 */}
        <div className="absolute inset-0 pointer-events-none">
          {/* X轴 */}
          <div className="absolute bottom-16 left-16 right-16 h-px bg-slate-700" />
          {/* Y轴 */}
          <div className="absolute top-16 bottom-16 left-16 w-px bg-slate-700" />
        </div>

        {/* 任务气泡 */}
        <div ref={containerRef} className="relative w-full h-full">
          {containerSize.width > 0 && containerSize.height > 0 &&
            tasks.map((task) => (
              <TaskBubble
                key={task.id}
                task={task}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
                onPositionChange={handlePositionChange}
                onDragEnd={handleDragEnd}
              />
            ))}
        </div>
      </div>

      {/* "I'm Feeling Lucky" 按钮 */}
      <motion.button
        onClick={handleFeelingLucky}
        className="absolute bottom-8 right-8 px-6 py-3 rounded-lg bg-neon-green/20 border-2 border-neon-green text-neon-green font-mono text-sm font-bold hover:bg-neon-green/30 transition-all duration-300 shadow-[0_0_20px_rgba(57,255,20,0.3)]"
        whileHover={{
          scale: 1.05,
          boxShadow: '0 0 30px rgba(57,255,20,0.5)',
        }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} />
          <span>I'm Feeling Lucky</span>
        </div>
      </motion.button>

      {/* 图例 */}
      <div className="absolute top-8 right-8 bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
        <div className="text-slate-400 font-mono text-xs mb-2">类别</div>
        <div className="flex flex-col gap-2">
          {Object.entries(categoryColors).map(([category, color]) => (
            <div key={category} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}` }}
              />
              <span className="text-slate-300 font-mono text-xs capitalize">
                {category}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* 导航栏 */}
      {onNavigate && <Navigation currentView="gravity" onNavigate={onNavigate} />}
    </div>
  )
}

export default InterestGravity

