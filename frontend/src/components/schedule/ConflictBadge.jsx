export default function ConflictBadge({ active }) {
  if (!active) return null
  return <span className="ml-2 rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">!</span>
}
