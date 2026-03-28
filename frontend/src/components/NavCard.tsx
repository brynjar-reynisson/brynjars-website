interface NavCardProps {
  icon: string
  title: string
  href: string
}

export default function NavCard({ icon, title, href }: NavCardProps) {
  return (
    <a
      href={href}
      className="flex flex-col items-center p-8 w-48 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-400 transition-all no-underline"
    >
      <span className="text-4xl mb-3">{icon}</span>
      <span className="text-base font-semibold text-gray-800">{title}</span>
    </a>
  )
}
