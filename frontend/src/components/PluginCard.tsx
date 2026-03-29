import { Link } from 'react-router-dom'

interface PluginCardProps {
  title: string
  screenshot: string
  to: string
}

export default function PluginCard({ title, screenshot, to }: PluginCardProps) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center p-4 border border-gray-200 rounded-lg bg-white w-44 no-underline hover:shadow-md hover:border-gray-400 transition-all"
    >
      <img
        src={screenshot}
        alt={title}
        className="w-36 h-24 object-contain rounded border border-gray-100 mb-3"
      />
      <span className="text-sm font-semibold text-gray-800 text-center">{title}</span>
    </Link>
  )
}
