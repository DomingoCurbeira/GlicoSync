import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export function DashboardSteps() {
  const [stepsToday, setStepsToday] = useState(0);
  const [stepGoal, setStepGoal] = useState(10000);
  const [, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyProgress();
  }, []);

  async function fetchDailyProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Obtenemos la meta personalizada del perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('meta_pasos')
        .eq('id', user.id)
        .single();
      
      if (profile?.meta_pasos) setStepGoal(profile.meta_pasos);

      // 2. Sumamos los pasos registrados HOY
      const today = new Date().toISOString().split('T')[0];
      const { data: logs } = await supabase
        .from('logs_glucosa') // O la tabla donde guardes actividad
        .select('pasos')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      const total = logs?.reduce((acc, curr) => acc + (curr.pasos || 0), 0) || 0;
      setStepsToday(total);
    } catch (err) {
      console.error("Error al calcular el progreso:", err);
    } finally {
      setLoading(false);
    }
  }

  const percentage = Math.min(Math.round((stepsToday / stepGoal) * 100), 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      <div className="flex justify-between items-end mb-4">
        <div>
          <p className="text-[10px] font-black text-glico-green uppercase tracking-[0.2em] mb-1">Actividad Diaria</p>
          <h3 className="text-3xl font-black text-slate-100 italic">{stepsToday.toLocaleString()} <span className="text-sm text-slate-500 not-italic font-medium">pasos</span></h3>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400">Meta: {stepGoal.toLocaleString()}</p>
        </div>
      </div>

      {/* La Barra de Progreso Nítida */}
      <div className="h-4 w-full bg-slate-950 rounded-full border border-slate-800 p-1">
        <div 
          className="h-full bg-gradient-to-r from-glico-green to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(34,197,94,0.3)]"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
        {percentage}% de la meta alcanzada
      </p>
    </div>
  );
}