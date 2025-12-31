import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import Navigation from './Navigation'

interface ConfettiParticle {
  id: number
  x: number
  y: number
  color: string
  size: number
  angle: number
  velocity: number
}

interface FocusTunnelProps {
  taskTitle?: string
  onComplete?: () => void
  onExit?: () => void
  onNavigate?: (view: 'void' | 'prism' | 'gravity' | 'tunnel') => void
}

const FocusTunnel = ({ taskTitle = 'Focus Mode', onComplete, onExit, onNavigate }: FocusTunnelProps) => {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isRunning, setIsRunning] = useState(true)
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const confettiIdRef = useRef(0)

  // 计时器
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // 生成粒子特效
  const generateConfetti = () => {
    const colors = ['#39FF14', '#BF00FF', '#00FFFF', '#FF00FF', '#FFFF00', '#FF6B6B', '#4ECDC4']
    const particles: ConfettiParticle[] = []
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    // 生成 150 个粒子（圆形爆炸）
    for (let i = 0; i < 150; i++) {
      const angle = (Math.PI * 2 * i) / 150 + (Math.random() - 0.5) * 0.3
      particles.push({
        id: confettiIdRef.current++,
        x: centerX,
        y: centerY,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        angle: angle,
        velocity: Math.random() * 8 + 5,
      })
    }

    setConfetti(particles)
    setShowConfetti(true)

    // 2.5秒后清理并返回
    setTimeout(() => {
      setShowConfetti(false)
      setTimeout(() => {
        if (onComplete) {
          onComplete()
        }
        if (onExit) {
          onExit()
        }
      }, 500)
    }, 2500)
  }

  // 处理完成按钮点击
  const handleComplete = () => {
    setIsRunning(false)
    generateConfetti()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* 极光背景动画 - 多层叠加 */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(57, 255, 20, 0.08) 0%, transparent 60%)',
            'radial-gradient(circle at 80% 50%, rgba(191, 0, 255, 0.08) 0%, transparent 60%)',
            'radial-gradient(circle at 50% 20%, rgba(0, 255, 255, 0.08) 0%, transparent 60%)',
            'radial-gradient(circle at 20% 50%, rgba(57, 255, 20, 0.08) 0%, transparent 60%)',
          ],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* 流动渐变层 1 */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundImage:
            'linear-gradient(45deg, rgba(57, 255, 20, 0.05), transparent, rgba(191, 0, 255, 0.05))',
          backgroundSize: '200% 200%',
        }}
      />

      {/* 流动渐变层 2 */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ['100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundImage:
            'linear-gradient(135deg, transparent, rgba(0, 255, 255, 0.05), transparent)',
          backgroundSize: '200% 200%',
        }}
      />

      {/* 主要内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        {/* 任务标题 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl font-bold text-white mb-8 text-center px-8 font-sans tracking-tight"
          style={{
            textShadow: '0 0 40px rgba(255, 255, 255, 0.3)',
          }}
        >
          {taskTitle}
        </motion.h1>

        {/* 计时器 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-mono text-white mb-16 tracking-wider"
          style={{
            fontFamily: 'monospace',
            textShadow: '0 0 20px rgba(57, 255, 20, 0.5)',
            color: '#39FF14',
          }}
        >
          {formatTime(elapsedTime)}
        </motion.div>

        {/* Mission Complete 按钮 */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          onClick={handleComplete}
          disabled={showConfetti}
          className="px-8 py-4 rounded-lg bg-neon-green/20 border-2 border-neon-green text-neon-green font-mono text-lg font-bold hover:bg-neon-green/30 transition-all duration-300 shadow-[0_0_30px_rgba(57,255,20,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(57,255,20,0.6)' }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} />
            <span>Mission Complete</span>
          </div>
        </motion.button>
      </div>

      {/* 粒子特效 - 圆形粒子 */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {confetti.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{
                  x: particle.x,
                  y: particle.y,
                  opacity: 1,
                  scale: 1,
                }}
                animate={{
                  x: particle.x + Math.cos(particle.angle) * particle.velocity * 300,
                  y: particle.y + Math.sin(particle.angle) * particle.velocity * 300 + 600,
                  opacity: [1, 1, 0.8, 0],
                  scale: [1, 1.3, 0.8, 0],
                  rotate: [0, Math.random() * 720 - 360],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2.5,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="absolute rounded-full"
                style={{
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  boxShadow: `0 0 15px ${particle.color}, 0 0 30px ${particle.color}`,
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* 破碎效果 - 三角形碎片 */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-20">
            {Array.from({ length: 60 }).map((_, i) => {
              const angle = (Math.PI * 2 * i) / 60
              const distance = 150 + Math.random() * 300
              const size = 15 + Math.random() * 20
              return (
                <motion.div
                  key={`fragment-${i}`}
                  initial={{
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                    opacity: 1,
                    rotate: 0,
                    scale: 1,
                  }}
                  animate={{
                    x: window.innerWidth / 2 + Math.cos(angle) * distance,
                    y: window.innerHeight / 2 + Math.sin(angle) * distance,
                    opacity: [1, 0.9, 0.5, 0],
                    rotate: [0, Math.random() * 1080 - 540],
                    scale: [1, 0.8, 0.3, 0],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 2,
                    delay: Math.random() * 0.2,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="absolute"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: ['#39FF14', '#BF00FF', '#00FFFF', '#FFFFFF', '#FFFF00'][
                      Math.floor(Math.random() * 5)
                    ],
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                    filter: 'blur(0.5px)',
                  }}
                />
              )
            })}
          </div>
        )}
      </AnimatePresence>
      
      {/* 导航栏（在非全屏模式下显示） */}
      {onNavigate && (
        <div className="absolute bottom-0 left-0 right-0 z-50">
          <Navigation currentView="tunnel" onNavigate={onNavigate} />
        </div>
      )}
    </div>
  )
}

export default FocusTunnel

