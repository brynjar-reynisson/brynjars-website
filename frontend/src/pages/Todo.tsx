import { Link } from 'react-router-dom'

export default function Todo() {
  return (
    <div className="min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-10">
        <Link to="/" className="text-gray-900 no-underline hover:underline">
          Brynjar's Online Antics
        </Link>
      </h1>

      <h2 className="text-2xl font-bold text-gray-900 mb-3">TODO</h2>
      <p className="text-gray-700">Coming soon.</p>
    </div>
  )
}
