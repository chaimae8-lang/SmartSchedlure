import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Search, Trash2, Clock } from 'lucide-react';
import { addUnavailability, deleteTeacher, getTeachers, saveTeacher } from '../api/teachers';
import TeacherForm from '../components/forms/TeacherForm';
import UnavailabilityForm from '../components/forms/UnavailabilityForm';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTeachers();
      setTeachers(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des enseignants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const handleCreate = async (payload) => {
    try {
      await saveTeacher(payload);
      toast.success('Enseignant ajouté avec succès');
      setShowForm(false);
      loadTeachers();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de l\'enseignant');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet enseignant ?')) return;
    
    try {
      await deleteTeacher(id);
      toast.success('Enseignant supprimé');
      loadTeachers();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleAddUnavailability = async (teacherId, values) => {
    try {
      await addUnavailability(teacherId, values);
      toast.success('Indisponibilité ajoutée');
      loadTeachers();
      setSelectedTeacher(null);
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const filteredTeachers = teachers.filter(t =>
    `${t.first_name} ${t.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.teacher_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enseignants</h1>
          <p className="text-gray-500 mt-1">{teachers.length} enseignants</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTeachers}
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
            Nouvel Enseignant
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un enseignant..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Teachers List */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {teacher.first_name} {teacher.last_name}
                    </h3>
                    <p className="text-blue-600 font-medium mt-1">{teacher.teacher_type}</p>
                  </div>

                  <button
                    onClick={() => handleDelete(teacher.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div><span className="font-medium">Heures max/semaine :</span> {teacher.max_hours_week}h</div>
                  {teacher.subjects && teacher.subjects.length > 0 && (
                    <div>
                      <span className="font-medium">Matières :</span>{' '}
                      {teacher.subjects.map((s) => s.subject?.code).join(', ')}
                    </div>
                  )}
                </div>

                {/* Unavailability Section */}
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Clock className="w-4 h-4" />
                      Indisponibilités
                    </div>
                    <button
                      onClick={() => setSelectedTeacher(teacher)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      + Ajouter
                    </button>
                  </div>

                  <UnavailabilityForm
                    onSubmit={(v) => handleAddUnavailability(teacher.id, v)}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-16 text-gray-500">
              {searchTerm ? 'Aucun enseignant trouvé' : 'Aucun enseignant enregistré'}
            </div>
          )}
        </div>
      )}

      {/* Create Teacher Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-semibold">Nouvel Enseignant</h2>
            </div>
            <div className="p-6">
              <TeacherForm 
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Unavailability Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                Indisponibilité - {selectedTeacher.first_name} {selectedTeacher.last_name}
              </h2>
            </div>
            <div className="p-6">
              <UnavailabilityForm
                onSubmit={(v) => handleAddUnavailability(selectedTeacher.id, v)}
                onCancel={() => setSelectedTeacher(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}