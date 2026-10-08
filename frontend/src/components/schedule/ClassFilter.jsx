export default function ClassFilter({ classes, value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="all">Toutes les classes</option>
      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  )
}
