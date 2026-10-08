import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Play,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

import {
  generateSchedule,
  getStatus
} from '../api/schedule';

export default function Generator() {

  const [yearId, setYearId] = useState(1);

  const [running, setRunning] = useState(false);

  const [progress, setProgress] = useState(0);

  const [status, setStatus] = useState(null);

  const [result, setResult] = useState(null);

  const navigate = useNavigate();

  // =====================================================
  // SUCCESS STATUS
  // =====================================================

  const SUCCESS_STATUS = [
    'completed',
    'success',
    'FEASIBLE',
    'OPTIMAL'
  ];

  const ERROR_STATUS = [
    'failed',
    'error',
    'INFEASIBLE',
    'UNKNOWN'
  ];

  // =====================================================
  // POLLING
  // =====================================================

  const pollStatus = useCallback(async () => {

    try {

      const data = await getStatus();

      console.log("STATUS:", data);

      setStatus(data);

      // =========================================
      // SUCCESS
      // =========================================

      if (SUCCESS_STATUS.includes(data.status)) {

        setProgress(100);

        setResult(data);

        setRunning(false);

        toast.success('Emploi du temps généré avec succès !');

        return;
      }

      // =========================================
      // ERROR
      // =========================================

      if (ERROR_STATUS.includes(data.status)) {

        setRunning(false);

        setProgress(0);

        toast.error(
          data?.conflicts?.[0]?.detail ||
          'La génération a échoué'
        );

        return;
      }

      // =========================================
      // PROGRESS
      // =========================================

      if (data.progress) {

        setProgress(
          Math.min(95, data.progress)
        );

      } else {

        // Smooth fake progress
        setProgress(prev =>
          Math.min(95, prev + 5)
        );
      }

    } catch (err) {

      console.error(err);

    }

  }, []);

  // =====================================================
  // START / STOP POLLING
  // =====================================================

  useEffect(() => {

    let interval;

    if (running) {

      interval = setInterval(
        pollStatus,
        1800
      );
    }

    return () => {

      if (interval) {
        clearInterval(interval);
      }
    };

  }, [running, pollStatus]);

  // =====================================================
  // GENERATE
  // =====================================================

  const handleGenerate = async (e) => {

    e.preventDefault();

    setRunning(true);

    setProgress(10);

    setResult(null);

    setStatus(null);

    try {

      const res = await generateSchedule(
        Number(yearId)
      );

      console.log("GENERATE RESPONSE:", res);

      // IMPORTANT:
      // backend may already return final result

      if (
        SUCCESS_STATUS.includes(res.status)
      ) {

        setProgress(100);

        setResult(res);

        setRunning(false);

        toast.success(
          'Emploi du temps généré avec succès !'
        );

        return;
      }

      // still running
      setStatus(res);

      setProgress(30);

    } catch (error) {

      console.error(error);

      toast.error(
        "Erreur lors du démarrage de la génération"
      );

      setRunning(false);

      setProgress(0);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  const current = result || status;

  const isSuccess =
    SUCCESS_STATUS.includes(current?.status);

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* HEADER */}

      <div>

        <h1 className="text-3xl font-bold text-gray-900">
          Générateur d'Emploi du Temps
        </h1>

        <p className="text-gray-500 mt-2">
          Lancer l'algorithme de génération automatique
        </p>

      </div>

      {/* CARD */}

      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">

        <form
          onSubmit={handleGenerate}
          className="space-y-6"
        >

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année Académique
            </label>

            <input
              type="number"
              value={yearId}
              onChange={(e) =>
                setYearId(e.target.value)
              }
              className="w-full px-5 py-4 text-lg border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors"
              min="1"
              disabled={running}
            />

          </div>

          <button
            type="submit"
            disabled={running}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
          >

            {running ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                Générer l'emploi du temps
              </>
            )}

          </button>

        </form>

        {/* PROGRESS */}

        {running && (

          <div className="mt-8">

            <div className="flex justify-between text-sm mb-2">

              <span className="font-medium text-gray-600">
                Progression
              </span>

              <span className="font-mono font-semibold">
                {Math.round(progress)}%
              </span>

            </div>

            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">

              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                style={{
                  width: `${progress}%`
                }}
              />

            </div>

            <p className="text-center text-sm text-gray-500 mt-3">
              Veuillez patienter...
            </p>

          </div>
        )}

      </div>

      {/* RESULT */}

      {current && (

        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">

          <div className="flex items-center gap-3 mb-6">

            {isSuccess ? (
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            )}

            <h2 className="text-2xl font-semibold">
              Résultat de la génération
            </h2>

          </div>

          <div className="grid grid-cols-2 gap-6">

            <div className="bg-gray-50 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Statut
              </p>

              <p className="font-semibold capitalize text-lg mt-1">
                {current?.status || 'Terminé'}
              </p>

            </div>

            <div className="bg-gray-50 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Durée
              </p>

              <p className="font-semibold text-lg mt-1">
                {current?.solve_time_seconds || 0} secondes
              </p>

            </div>

            <div className="bg-gray-50 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Créneaux générés
              </p>

              <p className="font-semibold text-3xl mt-1">
                {current?.num_slots || 0}
              </p>

            </div>

            <div className="bg-gray-50 rounded-2xl p-5">

              <p className="text-gray-500 text-sm">
                Conflits
              </p>

              <p className={`font-semibold text-3xl mt-1 ${
                current?.conflicts?.length
                  ? 'text-red-600'
                  : 'text-emerald-600'
              }`}>
                {current?.conflicts?.length || 0}
              </p>

            </div>

          </div>

          {current?.conflicts?.length > 0 && (

            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">

              ⚠️ {current.conflicts.length} conflit(s) détecté(s)

            </div>
          )}

          {isSuccess && (

            <button
              onClick={() => navigate('/schedule')}
              className="mt-8 w-full py-4 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-black transition-colors flex items-center justify-center gap-2"
            >

              Voir l'emploi du temps complet

              <Clock className="w-5 h-5" />

            </button>
          )}

        </div>
      )}

    </div>
  );
}