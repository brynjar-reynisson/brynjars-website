import { Routes, Route } from 'react-router-dom'
import NavCard from './components/NavCard'
import VstPlugins from './pages/VstPlugins'
import GrandStaff from './pages/GrandStaff'
import CircleOfFifths from './pages/CircleOfFifths'
import About from './pages/About'
import OllamaChat from './pages/OllamaChat'
import Todo from './pages/Todo'
import SystemMonitor from './pages/SystemMonitor'

const NAV_ITEMS = [
  { icon: '🤖', title: "Brynjar's Chatbot", to: 'https://agent.breynisson.org/' },
  { icon: '🎛', title: 'VST Plugins', to: '/vst-plugins' },
  { icon: '🔍', title: 'DigitalMe', to: 'https://digitalme.breynisson.org/' },
  { icon: '/rubiks-cube.svg', title: "Rubik's Cube", to: 'https://rubiks.breynisson.org/' },
  { icon: '📋', title: 'TODO', to: '/todo' },
  { icon: '🖥️', title: 'System Monitor', to: '/system-monitor' },
  { icon: '👤', title: 'About Me', to: '/about' },
]

function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-10 px-4">
      <h1 className="text-4xl font-bold text-gray-900">Brynjar's Online Antics</h1>
      <div className="flex flex-row flex-wrap gap-6 max-w-full">
        {NAV_ITEMS.map((item) => (
          <NavCard key={item.title} icon={item.icon} title={item.title} to={item.to} />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/ollama-chat" element={<OllamaChat />} />
      <Route path="/vst-plugins" element={<VstPlugins />} />
      <Route path="/vst-plugins/grand-staff" element={<GrandStaff />} />
      <Route path="/vst-plugins/circle-of-fifths" element={<CircleOfFifths />} />
      <Route path="/todo" element={<Todo />} />
      <Route path="/system-monitor" element={<SystemMonitor />} />
      <Route path="/about" element={<About />} />
    </Routes>
  )
}
