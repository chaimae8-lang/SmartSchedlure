import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { listSubjects } from '../../api/resources'

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  teacher_type: z.enum(['titulaire', 'vacataire']),
  max_hours_week: z.coerce.number().min(1).max(30),
  max_hours_day: z.coerce.number().min(1).max(8),
  subject_ids: z.array(z.coerce.number())
})

export default function TeacherForm({ onSubmit, initial }) {
  const [subjects, setSubjects] = useState([])
  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(schema), defaultValues: initial || { first_name: '', last_name: '', teacher_type: 'titulaire', max_hours_week: 18, max_hours_day: 8, subject_ids: [] } })
  useEffect(() => { listSubjects().then(setSubjects) }, [])
  useEffect(() => { if (initial) reset(initial) }, [initial, reset])
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <input placeholder="Prénom" {...register('first_name')} />
      <input placeholder="Nom" {...register('last_name')} />
      <select {...register('teacher_type')}><option value="titulaire">Titulaire</option><option value="vacataire">Vacataire</option></select>
      <input type="number" placeholder="Max heures semaine" {...register('max_hours_week')} />
      <input type="number" placeholder="Max heures jour" {...register('max_hours_day')} />
      <select multiple className="min-h-24" {...register('subject_ids')}>
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
      </select>
      <button className="col-span-2 bg-ocean text-white hover:bg-blue-700">Enregistrer</button>
    </form>
  )
}
