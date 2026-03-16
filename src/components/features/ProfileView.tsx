import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { convertToWebP } from '../../lib/imageUtils';
import { User, LogOut, Flame, Target, Thermometer, Camera, Save, AtSign, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileView() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

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

  const updateAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const toastId = toast.loading("Optimizando imagen de chef...");
      const webpBlob = await convertToWebP(file); 
      const filePath = `${user.id}/avatar.webp`; 

      const { error: uploadError } = await supabase.storage
          .from('platos')
          .upload(filePath, webpBlob, { 
              upsert: true,
              contentType: 'image/webp',
              cacheControl: '3600'
          });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('platos').getPublicUrl(filePath);
      const freshUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

      await supabase.from('profiles').update({ avatar_url: freshUrl }).eq('id', user.id);

      toast.success("¡Imagen nítida!", { id: toastId });
      getProfile();
      
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const toastId = toast.loading("Actualizando estación de mando...");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          nombre: profile.nombre,
          biografia: profile.biografia,
          tipo_diabetes: profile.tipo_diabetes,
          metodo_medicion: profile.metodo_medicion,
          meta_pasos: profile.meta_pasos,
          updated_at: new Date()
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success("¡Perfil guardado con éxito!", { id: toastId });
    } catch (error: any) {
      toast.error("Fallo al guardar: " + error.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("Sesión cerrada", { description: "¡Buen servicio, Chef!" });
  };

  if (loading) return <div className="p-10 text-center text-slate-500 animate-pulse">Abriendo tu perfil...</div>;

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header: Foto y Username */}
      <div className="flex flex-col items-center text-center py-4">
        <label className="relative cursor-pointer group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-glico-blue to-indigo-600 p-1 mb-4 shadow-xl shadow-glico-blue/20">
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
        <h2 className="text-xl font-black text-slate-100 italic">@{profile?.username || 'chef_anonimo'}</h2>
      </div>

      {/* FORMULARIO DE EDICIÓN */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
        
        {/* Username */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-2">
            <AtSign size={12} /> Nombre de Usuario (ID)
          </label>
          <input 
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 outline-none focus:border-glico-blue transition-all font-bold"
            value={profile?.username || ''}
            onChange={(e) => setProfile({...profile, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
            placeholder="ej: domingo_chef"
          />
        </div>

        {/* Nombre Público */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-2">
            <User size={12} /> Nombre para Mostrar
          </label>
          <input 
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 outline-none focus:border-glico-blue transition-all font-bold"
            value={profile?.nombre || ''}
            onChange={(e) => setProfile({...profile, nombre: e.target.value})}
            placeholder="Nombre completo"
          />
        </div>

        {/* Biografía */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-2">
            <BookOpen size={12} /> Biografía / Lema
          </label>
          <textarea 
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 outline-none focus:border-glico-blue transition-all font-medium resize-none h-24"
            value={profile?.biografia || ''}
            onChange={(e) => setProfile({...profile, biografia: e.target.value})}
            placeholder="Comparte tu filosofía de salud..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Condición */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Diabetes</label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 outline-none focus:border-glico-blue transition-all font-bold appearance-none text-xs"
              value={profile?.tipo_diabetes || 'Tipo 2'}
              onChange={(e) => setProfile({...profile, tipo_diabetes: e.target.value})}
            >
              <option value="Tipo 1">Tipo 1</option>
              <option value="Tipo 2">Tipo 2</option>
              <option value="Prediabetes">Prediabetes</option>
            </select>
          </div>

          {/* Método de Medición */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-2">
              <Thermometer size={12} /> Medición
            </label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 outline-none focus:border-glico-blue transition-all font-bold appearance-none text-xs"
              value={profile?.metodo_medicion || 'Glucómetro'}
              onChange={(e) => setProfile({...profile, metodo_medicion: e.target.value})}
            >
              <option value="Glucómetro">Glucómetro</option>
              <option value="Sensor (CGM)">Sensor CGM</option>
            </select>
          </div>
        </div>

        {/* Meta de Pasos */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-2">
            <Target size={14} className="text-glico-green" /> Meta Diaria de Pasos
          </label>
          <input 
            type="number"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-100 outline-none focus:border-glico-blue transition-all font-bold"
            value={profile?.meta_pasos || 10000}
            onChange={(e) => setProfile({...profile, meta_pasos: parseInt(e.target.value)})}
          />
        </div>

        <button 
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-glico-blue text-glico-dark font-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-glico-blue/20"
        >
          <Save size={18} />
          {saving ? 'Cocinando...' : 'Guardar Perfil'}
        </button>
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