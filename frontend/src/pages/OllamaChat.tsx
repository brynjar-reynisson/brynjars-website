import { Link } from 'react-router-dom'

export default function OllamaChat() {
  return (
    <div className="min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto">
      <Link to="/" className="text-gray-900 no-underline hover:underline">
        <h1 className="text-4xl font-bold text-gray-900 mb-10">
          Brynjar's Online Antics
        </h1>
      </Link>
      <h2 className="text-2xl font-semibold text-gray-800">Ollama Chat</h2>
    </div>
  )
}
