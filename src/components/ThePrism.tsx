import { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion } from 'framer-motion'
import Navigation from './Navigation'

// 自定义神经元节点组件
const NeuronNode = ({ data, selected }: { data: { label: string }; selected?: boolean }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      className={`relative px-6 py-4 rounded-lg bg-slate-800 border-2 cursor-pointer ${
        selected
          ? 'border-neon-green shadow-[0_0_20px_rgba(57,255,20,0.5)]'
          : 'border-slate-600 hover:border-slate-500 hover:shadow-[0_0_10px_rgba(100,116,139,0.3)]'
      } transition-all duration-300`}
    >
      {/* 发光效果 */}
      {selected && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-neon-green/10"
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
      
      {/* 节点内容 */}
      <div className="relative z-10 text-slate-100 font-mono text-sm text-center">
        {data.label}
      </div>
      
      {/* 神经元连接点效果 - 只在选中时显示 */}
      {selected && (
        <>
          <motion.div
            className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-neon-green blur-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-neon-green blur-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
          <motion.div
            className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-neon-green blur-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
          />
          <motion.div
            className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-neon-green blur-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
          />
        </>
      )}
    </motion.div>
  )
}

// 自定义节点类型
const nodeTypes: NodeTypes = {
  neuron: NeuronNode,
}

// Mock 数据生成函数
const generateSubNodes = (parentId: string, parentPosition: { x: number; y: number }) => {
  const subTasks = ['环境配置', '基础语法', '写个爬虫']
  const angleStep = (2 * Math.PI) / subTasks.length
  const radius = 200

  return subTasks.map((task, index) => {
    const angle = index * angleStep
    const x = parentPosition.x + radius * Math.cos(angle)
    const y = parentPosition.y + radius * Math.sin(angle)

    return {
      id: `${parentId}-child-${index}`,
      type: 'neuron',
      position: { x, y },
      data: { label: task },
    }
  })
}

interface ThePrismProps {
  onNavigate?: (view: 'void' | 'prism' | 'gravity' | 'tunnel') => void
}

const ThePrism = ({ onNavigate }: ThePrismProps) => {
  // 初始节点：画布中央的主节点（使用相对位置，fitView 会自动居中）
  const initialNodes: Node[] = [
    {
      id: 'main',
      type: 'neuron',
      position: { x: 0, y: 0 },
      data: { label: '学习 Python' },
    },
  ]

  const initialEdges: Edge[] = []

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // 调试：检查组件是否加载
  useEffect(() => {
    console.log('✅ ThePrism 组件已加载')
  }, [])

  // 处理节点点击
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // 如果节点已经展开过，不再展开
      if (expandedNodes.has(node.id)) {
        return
      }

      // 标记为已展开
      setExpandedNodes((prev) => new Set(prev).add(node.id))

      // 生成子节点
      const subNodes = generateSubNodes(node.id, node.position)

      // 添加子节点（带延迟，实现逐个出现的效果）
      subNodes.forEach((subNode, index) => {
        setTimeout(() => {
          setNodes((nds) => [...nds, subNode])

          // 添加连线（带动画延迟）
          setTimeout(() => {
            const newEdge: Edge = {
              id: `edge-${node.id}-${subNode.id}`,
              source: node.id,
              target: subNode.id,
              type: 'smoothstep',
              animated: true,
              style: {
                stroke: '#64748b',
                strokeWidth: 1.5,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#64748b',
                width: 15,
                height: 15,
              },
            }
            setEdges((eds) => [...eds, newEdge])
          }, 100 * (index + 1))
        }, 150 * index)
      })
    },
    [expandedNodes, setNodes, setEdges]
  )

  // 处理连线
  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  return (
    <div className="w-full h-screen bg-[#0a0a0a]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.3,
          maxZoom: 1.2,
          minZoom: 0.5,
        }}
        // 隐藏默认样式
        proOptions={{ hideAttribution: true }}
        className="react-flow-dark"
        minZoom={0.5}
        maxZoom={2}
      >
        {/* 隐藏背景网格 */}
        <Background color="#1e293b" gap={16} size={1} style={{ opacity: 0 }} />
        
        {/* 隐藏控制条 */}
        <Controls showInteractive={false} style={{ display: 'none' }} />
        
        {/* 隐藏小地图 */}
        <MiniMap style={{ display: 'none' }} />
      </ReactFlow>

      {/* 自定义样式覆盖 */}
      <style>{`
        .react-flow-dark .react-flow__node {
          background: transparent;
        }
        .react-flow-dark .react-flow__edge-path {
          stroke: #64748b;
          stroke-width: 1.5;
        }
        .react-flow-dark .react-flow__edge.selected .react-flow__edge-path {
          stroke: #64748b;
        }
        .react-flow-dark .react-flow__handle {
          background: transparent;
          border: none;
          width: 0;
          height: 0;
        }
        .react-flow-dark .react-flow__background {
          opacity: 0;
        }
      `}</style>
      
      {/* 导航栏 */}
      {onNavigate && <Navigation currentView="prism" onNavigate={onNavigate} />}
    </div>
  )
}

export default ThePrism

