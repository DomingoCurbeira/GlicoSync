import Swal from 'sweetalert2';

export const GlicoAlert = Swal.mixin({
  background: '#0f172a', // Slate-900 para que combine con tus cards
  color: '#f1f5f9',      // Slate-100 para el texto
  confirmButtonColor: '#38bdf8', // Tu glico-blue
  reverseButtons: true,
  customClass: {
    popup: 'rounded-3xl border border-slate-800 shadow-2xl',
    confirmButton: 'rounded-2xl px-6 py-3 font-bold text-slate-900',
    cancelButton: 'rounded-2xl px-6 py-3 font-bold'
  }
});