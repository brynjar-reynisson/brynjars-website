export interface ReadingEntry {
  name: string
  pages: string
  weekday_english: string
  weekday_icelandic: string
}

interface ReadingCardProps {
  entry: ReadingEntry
}

export default function ReadingCard({ entry }: ReadingCardProps) {
  return (
    <div className="flex flex-col p-8 w-48 border border-gray-200 rounded-lg bg-white">
      <span className="text-base font-bold text-gray-900 mb-2">{entry.name}</span>
      <span className="text-sm text-gray-600">Pages {entry.pages}</span>
      <span className="text-xs text-gray-400 mt-1">
        {entry.weekday_english} · {entry.weekday_icelandic}
      </span>
    </div>
  )
}
