import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']),
  period_start: z.coerce.number().min(0).max(3),
  period_end: z.coerce.number().min(0).max(3),
  reason: z.string().optional()
})

export default function UnavailabilityForm({ onSubmit }) {
  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(schema), defaultValues: { day: 'monday', period_start: 0, period_end: 0, reason: '' } })
  return (
    <form onSubmit={handleSubmit(async (v) => { await onSubmit(v); reset() })} className="grid grid-cols-4 gap-2">
      <select {...register('day')}><option value="monday">Lundi</option><option value="tuesday">Mardi</option><option value="wednesday">Mercredi</option><option value="thursday">Jeudi</option><option value="friday">Vendredi</option><option value="saturday">Samedi</option></select>
      <input type="number" {...register('period_start')} />
      <input type="number" {...register('period_end')} />
      <input placeholder="Raison" {...register('reason')} />
      <button className="col-span-4 border border-slate-300 bg-white">Ajouter indisponibilité</button>
    </form>
  )
}
