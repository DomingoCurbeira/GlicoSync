import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {PostCreator}  from './PostCreator';
import CommentsSection from './CommentsSection';
import { Heart, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CommunityView() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
  setLoading(true);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
    .from('posts')
    .select(`
        *,
        profiles:fk_user_profile (
        nombre, 
        tipo_diabetes, 
        avatar_url
        ), 
        likes (user_id),
        comments (
        id, 
        contenido, 
        created_at, 
        profiles:fk_comment_profile (nombre)
        )
    `) 
    .order('created_at', { ascending: false });

      if (error) {
      console.error("🚨 Detalle del fallo:", error.message);
      toast.error("Error al cargar el muro");
      return;
    }

      if (data) {
      const postsWithLikeStatus = data.map(post => ({
        ...post,
        isLiked: post.likes?.some((l: any) => l.user_id === user?.id) || false,
        likesCount: post.likes?.length || 0
      }));
      setPosts(postsWithLikeStatus);
    }
  } catch (err) {
    console.error("🔥 FALLO CRÍTICO:", err);
  } finally {
    setLoading(false);
  }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  

  const handleLike = async (postId: string) => {
    // 📳 ¡Vibración Háptica! 
  // Un pulso corto de 10ms es sutil y elegante, 
  // uno de 50ms se siente más firme.
  if (navigator.vibrate) {
    navigator.vibrate(15); 
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Inicia sesión para dar likes");

    const { error } = await supabase
      .from('likes')
      .insert({ post_id: postId, user_id: user.id });

    if (error) {
      if (error.code === '23505') { // Error de duplicado (ya le dio like)
        // Opcional: Podríamos quitar el like aquí (Unlike)
        return toast.info("Ya le diste amor a este plato");
      }
      throw error;
    }

    toast.success("¡Corazón nítido enviado!", { icon: "❤️" });
    fetchPosts(); // Recargamos para ver el nuevo conteo
  } catch (error) {
    toast.error("No se pudo procesar el like");
  }
};

  if (loading) return <div className="p-10 text-center text-slate-500 animate-pulse">Abriendo el comedor...</div>;

  return (
    <div className="space-y-6 pb-10">
      <PostCreator onPostCreated={fetchPosts} />

      {/* Feed de la Comunidad */}
      <div className="space-y-8">
        {posts.length > 0 ? (
          posts.map((post) => (
            <article key={post.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
            {/* Header del Post */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                {post.profiles?.avatar_url ? (
                    <img 
                    src={post.profiles.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = ""; e.currentTarget.style.display = 'none'; }} 
                    />
                ) : (
                    <span className="text-sm font-black text-glico-blue">
                    {post.profiles?.nombre?.charAt(0).toUpperCase() || 'D'}
                    </span>
                )}
                </div>
              <div>
                <p className="text-sm font-bold text-slate-100">{post.profiles?.nombre || 'GlicoUser'}</p>
                <p className="text-[10px] text-glico-blue font-bold uppercase">{post.profiles?.tipo_diabetes}</p>
              </div>
            </div>

            {/* Imagen del Plato (Si existe) */}
            {post.imagen_url && (
              <div className="aspect-square w-full bg-slate-800">
                <img src={post.imagen_url} alt="Plato saludable" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Contenido */}
            <div className="p-4">
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                {post.contenido}
              </p>

              {/* Interacciones */}
              <div className="flex items-center gap-6 pt-2 border-t border-slate-800/50">
                <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 transition-colors ${post.isLiked ? 'text-glico-red' : 'text-slate-500'}`}
                >
                    <Heart size={20} className={post.isLiked ? 'fill-current' : ''} />
                    <span className="text-xs font-bold">{post.likesCount}</span>
                </button>
                
                <button className="flex items-center gap-2 text-slate-500">
                    <MessageCircle size={20} />
                    <span className="text-xs font-bold">{post.comments?.length || 0}</span>
                </button>

              </div>
                <CommentsSection 
                    postId={post.id} 
                    comments={post.comments} 
                    onCommentAdded={fetchPosts} 
                    />
            </div>
          </article>
        ))
        ) : (
          /* Mensaje si la despensa está vacía */
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
            <p className="text-slate-500 italic">Aún no hay platos en el muro.<br/>¡Sé el primero en compartir!</p>
          </div>
        )}
      </div>
    </div>
  );
}