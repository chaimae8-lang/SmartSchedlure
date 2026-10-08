import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { listClasses, saveClass } from '../api/resources';
import ClassForm from '../components/forms/ClassForm';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listClasses();
      setClasses(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des classes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleSubmit = async (values) => {
    try {
      await saveClass(values);
      toast.success('Classe ajoutée avec succès');
      setShowForm(false);
      loadClasses(); // Refresh list
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la classe');
    }
  };

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cls.filiere?.code && cls.filiere.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 mt-1">{classes.length} classes au total</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadClasses}
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
            Nouvelle Classe
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une classe ou filière..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.length > 0 ? (
            filteredClasses.map((cls) => (
              <div
                key={cls.id}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900">{cls.name}</h3>
                    {cls.filiere && (
                      <p className="text-blue-600 font-medium mt-1">{cls.filiere.code}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">
                      {cls.student_count || 0}
                    </div>
                    <div className="text-xs text-gray-500">élèves</div>
                  </div>
                </div>

                {cls.description && (
                  <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                    {cls.description}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-gray-500">
              {searchTerm ? 'Aucune classe trouvée' : 'Aucune classe enregistrée'}
            </div>
          )}
        </div>
      )}

      {/* Class Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-semibold">Ajouter une nouvelle classe</h2>
            </div>
            
            <div className="p-6">
              <ClassForm 
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}