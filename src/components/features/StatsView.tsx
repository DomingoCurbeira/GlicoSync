import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Activity, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StatsView() {
  const [stats, setStats] = useState({ avg: 0, a1c: 0, count: 0, inRange: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('glucemias')
        .select('valor, fecha, momento')
        .eq('user_id', user.id)
        .order('fecha', { ascending: true }) // Ascendente para la gráfica (izquierda a derecha)
        .limit(20);

      if (data && data.length > 0) {
        // Procesar datos para la gráfica
        const formattedData = data.map(d => ({
          name: new Date(d.fecha).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' }),
          valor: d.valor,
          momento: d.momento
        }));
        setChartData(formattedData);

        // Cálculos
        const sum = data.reduce((acc, curr) => acc + curr.valor, 0);
        const avg = sum / data.length;
        const estimatedA1c = (avg + 46.7) / 28.7;
        const inRangeCount = data.filter(d => d.valor >= 70 && d.valor <= 140).length;

        setStats({
          avg: Math.round(avg),
          a1c: Number(estimatedA1c.toFixed(1)),
          count: data.length,
          inRange: Math.round((inRangeCount / data.length) * 100)
        });
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-500 animate-pulse font-bold">Analizando tendencias...</div>;

  return (
    <div className="space-y-6 pb-10">
      {/* Resumen Principal */}
      <div className="bg-gradient-to-br from-glico-blue to-blue-600 rounded-3xl p-6 text-slate-900 shadow-lg">
        <div className="flex justify-between items-center">
          <p className="text-xs font-black uppercase tracking-tighter opacity-70">HbA1c Estimada</p>
          <Award size={24} />
        </div>
        <h2 className="text-5xl font-black">{stats.a1c}%</h2>
        <p className="text-[10px] mt-2 font-bold opacity-60 italic">Cálculo basado en {stats.count} mediciones</p>
      </div>

      {/* Gráfica de Tendencia */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl">
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 px-2">Tendencia Semanal</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" hide />
              <YAxis hide domain={['dataMin - 20', 'dataMax + 20']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="valor" 
                stroke="#38bdf8" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValor)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Métricas Secundarias */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Promedio" value={`${stats.avg} mg`} color="text-glico-blue" icon={<Activity size={16}/>} />
        <MetricCard label="En Rango" value={`${stats.inRange}%`} color="text-glico-green" icon={<TrendingUp size={16}/>} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, color, icon }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl">
      <div className={`flex items-center gap-2 ${color} mb-1 opacity-80`}>
        {icon}
        <span className="text-[10px] font-bold uppercase">{label}</span>
      </div>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}