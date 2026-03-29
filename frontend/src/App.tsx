import { Routes, Route } from 'react-router-dom'
import NavCard from './components/NavCard'
import LastRead from './pages/LastRead'

const NAV_ITEMS = [
  { icon: '🎛', title: 'VST Plugins', to: '#' },
  { icon: '📚', title: 'Last Read', to: '/last-read' },
  { icon: '👤', title: 'About Me', to: '#' },
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
    </Routes>
  )
}
