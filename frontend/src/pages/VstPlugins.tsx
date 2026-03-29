import { Link } from 'react-router-dom'
import PluginCard from '../components/PluginCard'

const PLUGINS = [
  { title: 'Grand Staff MIDI Visualizer', screenshot: '/grandstaff.png' },
  { title: 'Interactive Circle of Fifths', screenshot: '/circle5ths.png' },
]

export default function VstPlugins() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-10 px-4">
      <h1 className="text-4xl font-bold text-gray-900">
        <Link to="/" className="text-gray-900 no-underline hover:underline">
          Brynjar's stuff
        </Link>
      </h1>
      <div className="flex flex-col md:flex-row gap-6">
        {PLUGINS.map((plugin) => (
          <PluginCard key={plugin.title} title={plugin.title} screenshot={plugin.screenshot} />
        ))}
      </div>
    </div>
  )
}
