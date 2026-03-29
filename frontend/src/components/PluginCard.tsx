interface PluginCardProps {
  title: string
  screenshot: string
}

export default function PluginCard({ title, screenshot }: PluginCardProps) {
  return (
    <div className="flex flex-col items-center p-6 border border-gray-200 rounded-lg bg-white w-56">
      <img
        src={screenshot}
        alt={title}
        className="w-40 h-40 object-cover object-top rounded border border-gray-100 mb-4"
      />
      <span className="text-sm font-semibold text-gray-800 text-center">{title}</span>
    </div>
  )
}
