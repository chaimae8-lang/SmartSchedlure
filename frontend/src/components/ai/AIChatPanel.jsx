import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { Send, Bot, X, Minimize2 } from 'lucide-react';

import { askAI } from '../../api/ai';
import AISuggestion from './AISuggestion';

export default function AIChatPanel({ conflicts, selectedSlot }) {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const res = await askAI(userMessage, {
        conflicts,
        teacher_workload_summary: {},
        specific_slot: selectedSlot
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: res.response 
      }]);
    } catch (error) {
      console.error(error);
      toast.error("L'assistant IA n'a pas pu répondre");
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "Désolé, une erreur est survenue. Veuillez réessayer." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 z-50"
      >
        <Bot className="w-6 h-6" />
        <span className="font-medium">Assistant IA</span>
      </button>
    );
  }

  return (
    <aside className="w-80 shrink-0 border-l border-slate-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Assistant IA</h2>
            <p className="text-xs text-emerald-600">En ligne • Optimisation</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Posez-moi une question sur l'emploi du temps</p>
            <p className="text-xs mt-1">Ex: "Comment optimiser la salle A101 ?"</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 rounded-bl-none'
              }`}
            >
              <ReactMarkdown className="prose prose-sm max-w-none">
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300" />
              </div>
            </div>
          </div>
        )}

        {/* AI Suggestion */}
        {messages.length > 0 && 
         messages.at(-1)?.role === 'assistant' && 
         /move|déplacer|changer|optimiser/i.test(messages.at(-1).text) && (
          <AISuggestion 
            text="Voulez-vous appliquer cette suggestion ?" 
            onApply={() => toast.success("Suggestion appliquée !")} 
          />
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Demandez une optimisation..."
            className="flex-1 px-4 py-3 bg-slate-100 border border-transparent focus:border-blue-300 rounded-2xl text-sm focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          L'IA peut suggérer des améliorations
        </p>
      </div>
    </aside>
  );
}