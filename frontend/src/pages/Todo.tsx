import { Link } from 'react-router-dom'

export default function Todo() {
  return (
    <div className="min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto">
      <Link to="/" className="text-gray-900 no-underline hover:underline">
        <h1 className="text-4xl font-bold text-gray-900 mb-10">
          Brynjar's Online Antics
        </h1>
      </Link>

      <h2 className="text-2xl font-bold text-gray-900 mb-3">TODO</h2>
      <p className="text-gray-700">Coming soon.</p>
    </div>
  )
}
