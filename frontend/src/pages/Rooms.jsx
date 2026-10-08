import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Search, DoorOpen } from 'lucide-react';
import { listRooms, saveRoom } from '../api/resources';

const schema = z.object({
  name: z.string().min(1, "Le nom est obligatoire"),
  capacity: z.coerce.number().min(1, "La capacité doit être au moins 1"),
  room_type: z.enum(['normal', 'lab', 'computer', 'drawing', 'gym']),
  max_daily_uses: z.coerce.number().min(1, "Le nombre d'utilisations doit être au moins 1")
});

const roomTypeLabels = {
  normal: 'Salle Normale',
  lab: 'Laboratoire',
  computer: 'Informatique',
  drawing: 'Dessin',
  gym: 'Gym'
};

const roomTypeColors = {
  normal: 'bg-blue-100 text-blue-700',
  lab: 'bg-purple-100 text-purple-700',
  computer: 'bg-emerald-100 text-emerald-700',
  drawing: 'bg-amber-100 text-amber-700',
  gym: 'bg-red-100 text-red-700'
};

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      capacity: 40,
      room_type: 'normal',
      max_daily_uses: 99
    }
  });

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listRooms();
      setRooms(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des salles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const onSubmit = async (data) => {
    try {
      await saveRoom(data);
      toast.success('Salle ajoutée avec succès');
      reset();
      setShowForm(false);
      loadRooms();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la salle');
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.room_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salles</h1>
          <p className="text-gray-500 mt-1">{rooms.length} salles au total</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRooms}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nouvelle Salle
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une salle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-100 rounded-xl">
                      <DoorOpen className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{room.name}</h3>
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-2 ${roomTypeColors[room.room_type] || 'bg-gray-100'}`}>
                        {roomTypeLabels[room.room_type] || room.room_type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Capacité</p>
                    <p className="font-semibold text-xl text-gray-900">{room.capacity} élèves</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Utilisations/jour</p>
                    <p className="font-semibold text-xl text-gray-900">{room.max_daily_uses}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-gray-500">
              {searchTerm ? 'Aucune salle trouvée' : 'Aucune salle enregistrée'}
            </div>
          )}
        </div>
      )}

      {/* Add Room Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-semibold">Nouvelle Salle</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la salle</label>
                <input
                  {...register('name')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  placeholder="Ex: Salle A101"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacité</label>
                  <input
                    type="number"
                    {...register('capacity')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                  {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max utilisations/jour</label>
                  <input
                    type="number"
                    {...register('max_daily_uses')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de salle</label>
                <select
                  {...register('room_type')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="normal">Salle Normale</option>
                  <option value="lab">Laboratoire</option>
                  <option value="computer">Informatique</option>
                  <option value="drawing">Dessin</option>
                  <option value="gym">Gym / Sport</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    reset();
                  }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Ajouter la salle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}