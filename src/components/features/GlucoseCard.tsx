import { Droplet, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';


const MOMENTOS = [
  "Ayunas", "Post-Desayuno (2h)", 
  "Pre-Almuerzo", "Post-Almuerzo (2h)", 
  "Pre-Cena", "Post-Cena (2h)", 
  "Al acostarse", "Extra"
];

export default function GlucoseCard() {
  const [mediciones, setMediciones] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const getColorClass = (value: string) => {
    const num = parseInt(value);
    if (!num) return 'border-slate-700 bg-slate-800/50';
    if (num < 70) return 'border-glico-indigo bg-glico-indigo/10 text-glico-indigo';
    if (num > 140) return 'border-glico-red bg-glico-red/10 text-glico-red';
    return 'border-glico-green bg-glico-green/10 text-glico-green';
  };


  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Obtenemos el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Sesión requerida", {
            description: "Debes iniciar sesión para guardar tus registros.",
        });
        return;
        }

      // Preparamos los datos para insertar
      const entries = Object.entries(mediciones)
        .filter(([_, value]) => value !== "") // No guardamos campos vacíos
        .map(([momento, valor]) => ({
          user_id: user.id,
          valor: parseInt(valor),
          momento: momento,
          es_alerta: parseInt(valor) < 70 || parseInt(valor) > 140
        }));

      if (entries.length === 0) return;

      const { error } = await supabase.from('glucemias').insert(entries);
        if (error) throw error;

        toast.success('¡Registros guardados!', {
            description: 'Tu bitácora se ha actualizado correctamente.',
        });
      
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error('Error al guardar', {
            description: 'No pudimos conectar con la cocina de datos.',
        });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Droplet className="text-glico-blue" size={20} />
            Control del Día
          </h3>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter">
            {new Date().toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-glico-blue/10 text-glico-blue text-xs font-bold px-4 py-2 rounded-full border border-glico-blue/20 hover:bg-glico-blue/20 transition-all flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="animate-spin" size={14} /> : null}
          {isSaving ? 'Guardando...' : 'Guardar Todo'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MOMENTOS.map((momento) => (
          <div key={momento} className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-200 font-bold uppercase ml-1">
              {momento}
            </label>
            <div className={`relative rounded-2xl border transition-all duration-300 ${getColorClass(mediciones[momento])}`}>
              <input
                type="number"
                placeholder="---"
                className="w-full bg-transparent p-3 pr-8 text-sm font-bold outline-none placeholder:text-slate-400"
                onChange={(e) => setMediciones({ ...mediciones, [momento]: e.target.value })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-80">
                mg
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen Inteligente */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
        <div className="p-2 bg-glico-green/10 rounded-lg">
          <CheckCircle2 className="text-glico-green" size={18} />
        </div>
        <div>
          <p className="text-xs font-bold">Estado Actual: <span className="text-glico-green">Nítido</span></p>
          <p className="text-[10px] text-slate-500">Estás dentro del rango el 85% del día.</p>
        </div>
      </div>
    </div>
  );
}