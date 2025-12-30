import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Circle, Box, Layers, GitBranch } from 'lucide-react'

interface Particle {
  id: number
  text: string
}

const TheVoid = () => {
  const [inputValue, setInputValue] = useState('')
  const [particles, setParticles] = useState<Particle[]>([])
  const [showCursor, setShowCursor] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const particleIdRef = useRef(0)

  // 闪烁光标效果
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 530)
    return () => clearInterval(interval)
  }, [])

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const newParticle: Particle = {
        id: particleIdRef.current++,
        text: inputValue.trim(),
      }

      // Console.log 任务
      console.log('Task created:', newParticle.text)

      // 添加粒子
      setParticles((prev) => [...prev, newParticle])

      // 清空输入框
      setInputValue('')

      // 3秒后移除粒子（动画完成后）
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== newParticle.id))
      }, 3000)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] overflow-hidden">
      {/* 中央输入框 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative inline-flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Wait, what was I doing?..."
            className="bg-transparent text-slate-100 text-xl font-mono outline-none placeholder:text-slate-600 w-[600px] text-center caret-transparent"
          />
          {/* 自定义闪烁光标 */}
          {showCursor && (
            <motion.span
              className="absolute h-6 w-0.5 bg-neon-green pointer-events-none"
              style={{
                left: inputValue.length > 0 ? '50%' : '50%',
                transform: 'translateX(-50%)',
                boxShadow: '0 0 10px #39FF14, 0 0 20px #39FF14',
              }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </div>
      </div>

      {/* 粒子动画 */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: '50%',
              y: '50%',
              opacity: 1,
              scale: 1,
            }}
            animate={{
              y: window.innerHeight + 100,
              opacity: [1, 0.8, 0.3, 0],
              scale: [1, 0.95, 0.85, 0.7],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2.5,
              ease: [0.25, 0.46, 0.45, 0.94], // 更自然的缓动
            }}
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <motion.div
              className="text-glow-green font-mono text-lg whitespace-nowrap px-4 py-2 rounded-lg bg-black/20 backdrop-blur-sm border border-neon-green/30"
              animate={{
                boxShadow: [
                  '0 0 10px rgba(57, 255, 20, 0.5)',
                  '0 0 20px rgba(57, 255, 20, 0.3)',
                  '0 0 30px rgba(57, 255, 20, 0.1)',
                  '0 0 10px rgba(57, 255, 20, 0)',
                ],
              }}
              transition={{ duration: 2.5 }}
            >
              {particle.text}
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 底部导航栏 */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm border-t border-slate-800/50">
        <div className="container mx-auto px-8 py-4">
          <div className="flex items-center justify-center gap-12">
            <NavItem icon={Circle} label="Void" active />
            <NavItem icon={Box} label="Prism" />
            <NavItem icon={Layers} label="Gravity" />
            <NavItem icon={GitBranch} label="Tunnel" />
          </div>
        </div>
      </div>

      {/* 底部混沌池效果 */}
      <div className="absolute bottom-16 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
    </div>
  )
}

interface NavItemProps {
  icon: React.ComponentType<any>
  label: string
  active?: boolean
}

const NavItem = ({ icon: Icon, label, active = false }: NavItemProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`flex flex-col items-center gap-2 transition-colors ${
        active ? 'text-neon-green' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <Icon size={24} className={active ? 'text-glow-green' : ''} />
      <span className="text-xs font-mono">{label}</span>
    </motion.button>
  )
}

export default TheVoid

