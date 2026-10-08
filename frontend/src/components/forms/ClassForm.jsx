import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { listFilieres } from '../../api/resources'

const schema = z.object({ name: z.string().min(1), filiere_id: z.coerce.number(), student_count: z.coerce.number().min(1) })

export default function ClassForm({ onSubmit }) {
  const [filieres, setFilieres] = useState([])
  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(schema), defaultValues: { name: '', filiere_id: '', student_count: 35 } })
  useEffect(() => { listFilieres().then(setFilieres) }, [])
  return (
    <form onSubmit={handleSubmit(async (v) => { await onSubmit(v); reset() })} className="grid grid-cols-4 gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <input placeholder="Nom de classe" {...register('name')} />
      <select {...register('filiere_id')}><option value="">Filière</option>{filieres.map((f) => <option key={f.id} value={f.id}>{f.code}</option>)}</select>
      <input type="number" placeholder="Effectif" {...register('student_count')} />
      <button className="bg-ocean text-white hover:bg-blue-700">Ajouter</button>
    </form>
  )
}
