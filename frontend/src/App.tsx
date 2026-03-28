import NavCard from './components/NavCard'

const NAV_ITEMS = [
  { icon: '🎛', title: 'VST Plugins', href: '#' },
  { icon: '📚', title: 'Last Read', href: '#' },
  { icon: '👤', title: 'About Me', href: '#' },
]

export default function App() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-10 px-4">
      <h1 className="text-4xl font-bold text-gray-900">Brynjar's stuff</h1>
      <div className="flex flex-col md:flex-row gap-6">
        {NAV_ITEMS.map((item) => (
          <NavCard key={item.title} icon={item.icon} title={item.title} href={item.href} />
        ))}
      </div>
    </div>
  )
}
