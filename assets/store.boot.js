/* =====================================================================
   store.boot.js - escolhe o modo de dados:
   - REMOTO (Supabase / tempo real) quando supabase-config.js estiver
     preenchido e a lib do Supabase tiver carregado;
   - LOCAL (este navegador) caso contrario.
   Deve carregar DEPOIS de store.js / store.remote.js e ANTES de app.js.
   ===================================================================== */
(function () {
  "use strict";
  var cfg = window.SUPABASE_CONFIG || {};
  var temSb = (typeof window.supabase !== "undefined") && cfg.url && cfg.anonKey && window.createRemoteStore;
  if (temSb) {
    try {
      var client = window.supabase.createClient(cfg.url, cfg.anonKey);
      window.Store = window.createRemoteStore(client, window.SEED || {});
      window.MODO = "remoto";
    } catch (e) {
      console.error("Falha ao iniciar o Supabase; usando modo local.", e);
      window.MODO = "local";
    }
  } else {
    window.MODO = "local"; // window.Store ja e o Store local definido por store.js
  }
})();
