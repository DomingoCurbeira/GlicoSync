import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { convertToWebP } from '../../lib/imageUtils';
import { User, LogOut, Flame, Target, Thermometer, Camera } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileView() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    getProfile();
  }, []);


const updateAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
  try {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const toastId = toast.loading("Optimizando imagen...");

    // 1. Usamos la herramienta de la despensa
    const webpBlob = await convertToWebP(file); 

    const filePath = `${user.id}/avatar.webp`; 

    const { error: uploadError } = await supabase.storage
        .from('platos')
        .upload(filePath, webpBlob, { 
            upsert: true,
            contentType: 'image/webp',
            cacheControl: '3600' // Opcional: ayuda a que no se quede la imagen vieja en caché
        });

    if (uploadError) throw uploadError;

// 1. Obtenemos la URL pública
const { data } = supabase.storage.from('platos').getPublicUrl(filePath);

// 2. EL TRUCO: Añadimos un parámetro de tiempo para romper el cache
// Esto genera algo como: .../avatar.webp?t=1710345600
const freshUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

// 3. Guardamos la URL "fresca" en la base de datos
const { error: updateError } = await supabase
  .from('profiles')
  .update({ avatar_url: freshUrl })
  .eq('id', user.id);

if (updateError) throw updateError;

toast.success("¡Imagen de chef actualizada!", { id: toastId });

// Un pequeño refresco para limpiar la memoria visual
setTimeout(() => window.location.reload(), 500);
    
  } catch (error: any) {
    toast.error("Error: " + error.message);
  }
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("Sesión cerrada", { description: "¡Te esperamos pronto en la cocina!" });
  };

  

  if (loading) return <div className="p-10 text-center text-slate-500 animate-pulse">Abriendo tu perfil...</div>;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header del Perfil */}
      <div className="flex flex-col items-center text-center py-4">
        <label className="relative cursor-pointer group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-glico-blue to-indigo-600 p-1 mb-4">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-4 border-slate-900">
                {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" />
                ) : (
                    <User size={40} className="text-slate-500" />
                )}
                </div>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={updateAvatar} />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                <Camera className="text-white" size={20} />
            </div>
        </label>
        <h2 className="text-2xl font-black text-slate-100">{profile?.nombre || 'Usuario'}</h2>
        <p className="text-xs font-bold text-glico-blue uppercase tracking-widest bg-glico-blue/10 px-3 py-1 rounded-full mt-2">
          Diabetes {profile?.tipo_diabetes || 'No definida'}
        </p>
      </div>

      {/* Tarjeta de Racha (Gamificación) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500">
            <Flame size={32} />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-100">12 Días</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Racha de Control Nítido</p>
          </div>
        </div>
        {/* Decoración de fondo */}
        <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
          <Flame size={120} />
        </div>
      </div>

      {/* Ajustes Rápidos */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-500 uppercase ml-4 tracking-widest">Ajustes de Cocina</h3>
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl divide-y divide-slate-800">
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Thermometer size={18} className="text-slate-400" />
              <span className="text-sm font-medium">Método de medición</span>
            </div>
            <span className="text-xs font-bold text-glico-blue">{profile?.metodo_medicion || 'Glucómetro'}</span>
          </div>
          
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Target size={18} className="text-slate-400" />
              <span className="text-sm font-medium">Objetivo Diario</span>
            </div>
            <span className="text-xs font-bold text-slate-500">70 - 140 mg</span>
          </div>
        </div>
      </div>

      {/* Botón de Salida */}
      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-5 rounded-3xl bg-slate-900 border border-slate-800 text-glico-red font-black hover:bg-slate-800 transition-colors"
      >
        <LogOut size={20} />
        Cerrar Sesión
      </button>

    </div>
  );
}