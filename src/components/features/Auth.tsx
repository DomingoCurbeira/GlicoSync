import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("Revisa tu correo para confirmar la cuenta.");
    else alert("¡Usuario creado!");
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
      <div className="w-16 h-16 bg-glico-blue/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
        <Lock className="text-glico-blue" size={32} />
      </div>
      <h2 className="text-2xl font-bold mb-2">Bienvenido a GlicoSync</h2>
      <p className="text-slate-500 text-sm mb-8">Tu comunidad nítida para el control glucémico.</p>

      <form className="w-full max-w-sm space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="email" placeholder="Tu correo" 
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-glico-blue transition-colors"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="password" placeholder="Contraseña" 
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-glico-blue transition-colors"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3 pt-2">
          <button onClick={handleLogin} disabled={loading} className="flex-1 bg-glico-blue text-glico-dark font-bold py-3 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Entrar"}
          </button>
          <button onClick={handleSignUp} disabled={loading} className="flex-1 bg-slate-800 text-slate-200 font-bold py-3 rounded-2xl hover:bg-slate-700 transition-colors">
            Unirse
          </button>
        </div>
      </form>
    </div>
  );
}