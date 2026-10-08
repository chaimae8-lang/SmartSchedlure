// src/components/ScheduleExportButtons.jsx
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { exportScheduleCSV, exportSchedulePDF } from '../utils/export';

export default function ScheduleExportButtons({ 
  slots, 
  filter = 'all', 
  className = "" 
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(null); // 'csv' | 'pdf'

  const handleExport = async (type) => {
    if (!slots?.length) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    setIsExporting(true);
    setExportType(type);

    try {
      if (type === 'csv') {
        exportScheduleCSV(slots);
        toast.success("✅ Emploi du temps exporté en CSV avec succès");
      } else {
        await exportSchedulePDF(slots, filter);
        toast.success("✅ Emploi du temps exporté en PDF avec succès");
      }
    } catch (error) {
      toast.error("Erreur lors de l'exportation");
      console.error(error);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-x">
        
        {/* PDF Export */}
        <button
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="flex items-center gap-2.5 px-6 py-3 hover:bg-slate-50 transition-all group disabled:opacity-60"
          title="Exporter en PDF professionnel"
        >
          {exportType === 'pdf' && isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
          ) : (
            <FileText className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
          )}
          <span className="font-medium text-sm text-slate-700">PDF</span>
        </button>

        {/* CSV Export */}
        <button
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="flex items-center gap-2.5 px-6 py-3 hover:bg-slate-50 transition-all group disabled:opacity-60"
          title="Exporter en CSV (compatible Excel)"
        >
          {exportType === 'csv' && isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          )}
          <span className="font-medium text-sm text-slate-700">CSV</span>
        </button>
      </div>

      {/* Bouton principal optionnel */}
      <button
        onClick={() => handleExport('pdf')}
        className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all text-sm font-medium shadow-sm"
      >
        <Download className="w-4 h-4" />
        Exporter
      </button>
    </div>
  );
}