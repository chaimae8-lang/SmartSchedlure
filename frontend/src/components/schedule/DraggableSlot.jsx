import { useDrag } from 'react-dnd'

export default function DraggableSlot({ slot }) {
  const [{ isDragging }, drag] = useDrag(() => ({ type: 'slot', item: slot, collect: (monitor) => ({ isDragging: monitor.isDragging() }) }), [slot])
  return <div ref={drag} className={`cursor-move ${isDragging ? 'opacity-50' : ''}`}>{slot.subject?.code || slot.subject_id}</div>
}
