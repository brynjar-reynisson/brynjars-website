import { Link } from 'react-router-dom'

export interface NavCardProps {
  icon: string
  title: string
  to: string
}

const className = "flex flex-col items-center p-8 w-48 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-400 transition-all no-underline"

export default function NavCard({ icon, title, to }: NavCardProps) {
  const iconEl = icon.startsWith('/')
    ? <img src={icon} alt="" className="w-9 h-9 mb-3" aria-hidden="true" />
    : <span className="text-4xl mb-3" aria-hidden="true">{icon}</span>

  const content = (
    <>
      {iconEl}
      <span className="text-base font-semibold text-gray-800">{title}</span>
    </>
  )

  if (to.startsWith('http')) {
    return <a href={to} className={className} target="_blank" rel="noopener noreferrer">{content}</a>
  }

  return <Link to={to} className={className}>{content}</Link>
}
