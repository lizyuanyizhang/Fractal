import { motion } from 'framer-motion'
import { Circle, Box, Layers, GitBranch } from 'lucide-react'

type View = 'void' | 'prism' | 'gravity' | 'tunnel'

interface NavigationProps {
  currentView: View
  onNavigate: (view: View) => void
}

const Navigation = ({ currentView, onNavigate }: NavigationProps) => {
  const navItems = [
    { icon: Circle, label: 'Void', view: 'void' as View },
    { icon: Box, label: 'Prism', view: 'prism' as View },
    { icon: Layers, label: 'Gravity', view: 'gravity' as View },
    { icon: GitBranch, label: 'Tunnel', view: 'tunnel' as View },
  ]

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm border-t border-slate-800/50 z-50">
      <div className="container mx-auto px-8 py-4">
        <div className="flex items-center justify-center gap-12">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.view
            return (
              <motion.button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-2 transition-colors cursor-pointer ${
                  isActive ? 'text-neon-green' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={24} className={isActive ? 'text-glow-green' : ''} />
                <span className="text-xs font-mono">{item.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Navigation

