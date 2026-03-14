import { useState, useEffect } from 'react';
import { Home, Users, BarChart2, User } from 'lucide-react';
import {supabase} from './lib/supabase'
import GlucoseCard from './components/features/GlucoseCard'
import Auth from './components/features/Auth';
import { Toaster } from 'sonner';
import StatsView from './components/features/StatsView';
import ProfileView from './components/features/ProfileView';
import CommunityView from './components/features/CommunityView';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('bitacora');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
  const getProfile = async () => {
    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('nombre')
        .eq('id', session.user.id)
        .single();
      
      setProfile(data);
    }
  };

  getProfile();
}, [session]);

  useEffect(() => {
    // Revisar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuchar cambios (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Si no hay sesión, mostramos la pantalla de Auth
  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen pb-20">
      <Toaster 
        theme="dark" 
        position="top-center" 
        toastOptions={{
          style: { background: '#0f172a', border: '1px solid #1e293b', color: '#f1f5f9' },
        }} 
      />
      {/* Cabecera */}
      <header className="p-4 border-b border-slate-800 bg-glico-dark/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-glico-blue tracking-tight">GlicoSync</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase">
               <span className="text-slate-200">{profile?.nombre || session?.user?.email?.split('@')[0]}</span>
            </p>
          </div>
          
          {/* Un avatar circular con la inicial */}
          <div className="w-8 h-8 rounded-full bg-glico-blue/20 border border-glico-blue/40 flex items-center justify-center text-glico-blue text-xs font-bold">
            {(profile?.nombre || 'D').charAt(0).toUpperCase()}
          </div>
      </header>

      {/* Contenido Principal (Cambiante según la pestaña) */}
      <main className="p-4 max-w-md mx-auto">
        {activeTab === 'bitacora' && (
          <div className="flex flex-col gap-6"> {/* Usamos gap-6 para un aire más moderno y limpio */}
            <header>
              <h2 className="text-lg font-semibold italic text-slate-300">Tus Glicemias de hoy</h2>
              <p className="text-xs text-slate-500">Registra tus niveles y mantente en rango.</p>
            </header>
            
            {/* La Card es la protagonista absoluta */}
            <GlucoseCard /> 
            
            {/* En el futuro, aquí podrías añadir un resumen de pasos o calorías */}
          </div>
        )}
        {activeTab === 'analisis' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold italic text-slate-300">Análisis de Salud</h2>
              <StatsView />
            </div>
          )}

          {activeTab === 'perfil' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold italic text-slate-300">Tu Perfil Pro</h2>
              <ProfileView />
            </div>
          )}

          {activeTab === 'comunidad' && (
              <div className="space-y-4">
                <header>
                  <h2 className="text-lg font-semibold italic text-slate-300">Comunidad Nítida</h2>
                  <p className="text-xs text-slate-500">Inspírate con los platos de otros guerreros.</p>
                </header>
                <CommunityView />
              </div>
            )}
      </main>

      {/* Bottom Navigation (Estilo Esencia Yoga) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white backdrop-blur-lg border-t border-slate-800 px-6 py-3">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <NavButton 
            icon={<Home size={24} />} 
            label="Bitácora" 
            active={activeTab === 'bitacora'} 
            onClick={() => setActiveTab('bitacora')} 
          />
          <NavButton 
            icon={<Users size={24} />} 
            label="Comunidad" 
            active={activeTab === 'comunidad'} 
            onClick={() => setActiveTab('comunidad')} 
          />
          <NavButton 
            icon={<BarChart2 size={24} />} 
            label="Análisis" 
            active={activeTab === 'analisis'} 
            onClick={() => setActiveTab('analisis')} 
          />
          <NavButton 
            icon={<User size={24} />} 
            label="Perfil" 
            active={activeTab === 'perfil'} 
            onClick={() => setActiveTab('perfil')} 
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-indigo-600' : 'text-glico-blue'}`}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-widest">{label}</span>
    </button>
  );
}