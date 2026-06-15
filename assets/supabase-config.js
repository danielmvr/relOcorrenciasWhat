/* =====================================================================
   Configuracao do Supabase (modo compartilhado em tempo real).
   - Enquanto url/anonKey estiverem VAZIOS, o app roda em modo LOCAL
     (dados so neste navegador).
   - Preencha com os dados do seu projeto: Supabase > Project Settings >
     API  ->  "Project URL" e "anon public".
   - Passo a passo completo em SETUP-SUPABASE.md
   ===================================================================== */
window.SUPABASE_CONFIG = {
  url: "https://kmjtuoapmfgoxvtulhtr.supabase.co",      // ex.: https://abcxyz.supabase.co
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttanR1b2FwbWZnb3h2dHVsaHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzMyMzMsImV4cCI6MjA5NzEwOTIzM30.RpFObETVrakfmCSWXulJ9OWz4TWlm4ESQ7HKaa9kbPM"   // chave "anon public"
};
