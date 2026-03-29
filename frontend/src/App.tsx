import { Routes, Route } from 'react-router-dom'
import NavCard from './components/NavCard'
import LastRead from './pages/LastRead'
import VstPlugins from './pages/VstPlugins'
import GrandStaff from './pages/GrandStaff'
import CircleOfFifths from './pages/CircleOfFifths'
import About from './pages/About'

const NAV_ITEMS = [
  { icon: '🎛', title: 'VST Plugins', to: '/vst-plugins' },
  { icon: '🔍', title: 'DigitalMe', to: 'https://digitalme.breynisson.org/' },
  { icon: '📚', title: 'Last Read', to: '/last-read' },
  { icon: '👤', title: 'About Me', to: '/about' },
]

function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-10 px-4">
      <h1 className="text-4xl font-bold text-gray-900">Brynjar's stuff</h1>
      <div className="flex flex-col md:flex-row gap-6">
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
      <Route path="/last-read" element={<LastRead />} />
      <Route path="/vst-plugins" element={<VstPlugins />} />
      <Route path="/vst-plugins/grand-staff" element={<GrandStaff />} />
      <Route path="/vst-plugins/circle-of-fifths" element={<CircleOfFifths />} />
      <Route path="/about" element={<About />} />
    </Routes>
  )
}
