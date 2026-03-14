import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Send} from 'lucide-react';
import { toast } from 'sonner';

export default function CommentsSection({ postId, comments, onCommentAdded }: any) {
  const [nuevoComentario, setNuevoComentario] = useState('');

  const enviarComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Inicia sesión para comentar");

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      contenido: nuevoComentario
    });

    if (!error) {
      setNuevoComentario('');
      onCommentAdded();
      toast.success("Comentario enviado");
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
      {/* Lista de comentarios */}
      <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
        {comments?.map((c: any) => (
          <div key={c.id} className="text-xs">
            <span className="font-bold text-glico-blue">{c.profiles?.nombre}: </span>
            <span className="text-slate-300">{c.contenido}</span>
          </div>
        ))}
      </div>

      {/* Input de comentario */}
      <form onSubmit={enviarComentario} className="relative mt-2">
        <input 
          type="text" 
          value={nuevoComentario}
          onChange={(e) => setNuevoComentario(e.target.value)}
          placeholder="Escribe un comentario..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-4 pr-10 text-xs outline-none focus:border-glico-blue"
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-glico-blue">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}