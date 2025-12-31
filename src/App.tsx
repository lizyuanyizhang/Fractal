import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TheVoid from './components/TheVoid'
import ThePrism from './components/ThePrism'
import InterestGravity from './components/InterestGravity'
import FocusTunnel from './components/FocusTunnel'

type View = 'void' | 'prism' | 'gravity' | 'tunnel'

function App() {
  const [currentView, setCurrentView] = useState<View>('void')

  const handleViewChange = (view: View) => {
    setCurrentView(view)
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full h-screen"
      >
        {currentView === 'void' && <TheVoid onNavigate={handleViewChange} />}
        {currentView === 'prism' && <ThePrism onNavigate={handleViewChange} />}
        {currentView === 'gravity' && <InterestGravity onNavigate={handleViewChange} />}
        {currentView === 'tunnel' && <FocusTunnel onNavigate={handleViewChange} />}
      </motion.div>
    </AnimatePresence>
  )
}

export default App

