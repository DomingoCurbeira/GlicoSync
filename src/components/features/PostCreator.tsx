import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { convertToWebP } from '../../lib/imageUtils';
import { Camera, Send, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

export function PostCreator({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content && !image) return;

    setUploading(true);
    const toastId = toast.loading("Preparando el post...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Inicia sesión para publicar");

      let imageUrl = '';

      if (image) {
        // 1. OPTIMIZACIÓN: Convertimos a WebP antes de subir
        const webpBlob = await convertToWebP(image);
        
        // 2. RUTA: Usamos un nombre único con timestamp para evitar choques
        const fileName = `plato-${Date.now()}.webp`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('platos')
          .upload(filePath, webpBlob, { 
            contentType: 'image/webp',
            upsert: true 
          });

        if (uploadError) throw uploadError;

        // 3. URL FRESCA: Obtenemos la URL y añadimos el token de tiempo
        const { data } = supabase.storage.from('platos').getPublicUrl(filePath);
        imageUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
      }

      // 4. REGISTRO: Guardamos en la tabla de posts
      const { error: postError } = await supabase.from('posts').insert({
        user_id: user.id,
        contenido: content,
        imagen_url: imageUrl
      });

      if (postError) throw postError;

      toast.success("¡Plato compartido!", { id: toastId });
      
      // Limpiar mesa de trabajo
      setContent('');
      setImage(null);
      setPreview(null);
      onPostCreated(); 
      
    } catch (error: any) {
      toast.error("Fallo en la cocina: " + error.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-xl mb-4">
      <textarea
        placeholder="¿Qué ingredientes tiene tu plato hoy? (Keto, bajo en carbos...)"
        className="w-full bg-transparent p-2 text-sm outline-none resize-none placeholder:text-slate-600 text-slate-200"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {preview && (
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-800 border border-slate-700">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button 
            type="button"
            onClick={() => { setImage(null); setPreview(null); }}
            className="absolute top-2 right-2 bg-slate-900/80 p-1.5 rounded-full text-white hover:bg-glico-red transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
        <label className="flex items-center gap-2 text-glico-blue cursor-pointer hover:bg-glico-blue/5 px-3 py-2 rounded-xl transition-all">
          <Camera size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Añadir Foto</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </label>

        <button
          type="submit"
          disabled={uploading || (!content && !image)}
          className="bg-glico-blue text-glico-dark font-black px-6 py-2 rounded-2xl flex items-center gap-2 disabled:opacity-50 disabled:grayscale transition-all active:scale-95 shadow-lg shadow-glico-blue/20"
        >
          {uploading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          <span className="text-sm font-bold">{uploading ? 'Cocinando...' : 'Publicar'}</span>
        </button>
      </div>
    </form>
  );
}