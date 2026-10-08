import { Lightbulb, CheckCircle } from 'lucide-react';

export default function AISuggestion({ text, onApply }) {
  return (
    <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm">
      <div className="flex gap-3">
        {/* Icon */}
        <div className="mt-0.5 w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-900">Suggestion IA</span>
            <div className="px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full">
              Recommandation
            </div>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-blue-800">
            {text}
          </p>

          {/* Action Button */}
          <button
            onClick={onApply}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Appliquer la suggestion
          </button>
        </div>
      </div>
    </div>
  );
}