/* =====================================================================
   store.remote.js - RemoteStore (Supabase) com a MESMA interface do
   Store local. Mantem um cache em memoria sincronizado por Realtime,
   entao as leituras continuam sincronas (a interface nao muda) e as
   escritas sao otimistas (atualizam o cache na hora e enviam ao banco).
   Reaproveita STATUS/urgencia do Store local (window.LocalStore).
   ===================================================================== */
(function () {
  "use strict";
  function uid() { return Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8); }
  function nowISO() { return new Date().toISOString(); }
  function montarInicio(d, h) { if (!d || !h) return null; var ms = Date.parse(d + "T" + h + ":00"); return isNaN(ms) ? null : new Date(ms).toISOString(); }
  function horaHM(iso) { var d = new Date(iso), p = function (n) { return (n < 10 ? "0" : "") + n; }; return p(d.getHours()) + ":" + p(d.getMinutes()); }

  var SIMPLES = ["carro","carroSegue","motorista","matricula","linha","localSocorro","dataViagem",
    "horarioViagem","qtdClientes","encomendas","alimentacaoFornecida","defeitoMotorista",
    "responsavelManutencao","saidaSocorro","gerenteRegional","coordenador","obs",
    "regional","placa","modelo","capacidade","servico","dataOcorrencia","horaQuebra","terminoSocorro"];
  function toSnake(k) { return k.replace(/[A-Z]/g, function (c) { return "_" + c.toLowerCase(); }); }
  function objToRow(o) {
    var row = { id: o.id, status: o.status || "aberta", aberta_em: o.abertaEm || nowISO(),
      finalizada_em: o.finalizadaEm || null, inicio_em: o.inicioEm || null, duracao_ms: (o.duracaoMs == null ? null : o.duracaoMs),
      eventos: o.eventos || [] };
    SIMPLES.forEach(function (k) { row[toSnake(k)] = (o[k] == null ? null : o[k]); });
    return row;
  }
  function rowToObj(row) {
    var o = { id: row.id, status: row.status, abertaEm: row.aberta_em, finalizadaEm: row.finalizada_em,
      duracaoMs: row.duracao_ms, inicioEm: row.inicio_em, eventos: row.eventos || [] };
    SIMPLES.forEach(function (k) { o[k] = row[toSnake(k)]; });
    return o;
  }

  window.createRemoteStore = function (client, seed) {
    seed = seed || {};
    var L = window.LocalStore || {};
    var cad = {
      frota: (seed.frota || []).slice(), regionais: (seed.regionais || []).slice(),
      gerentes: (seed.gerentes || []).slice(), localidades: (seed.localidades || []).slice(),
      pontosApoio: (seed.pontosApoio || []).slice()
    };
    var cache = [], subs = [], gerentesCache = (seed.gerentes || []).slice();
    function fire() { subs.forEach(function (f) { try { f(); } catch (e) {} }); }
    function findIdx(id) { for (var i = 0; i < cache.length; i++) if (cache[i].id === id) return i; return -1; }
    function upsert(o) { var i = findIdx(o.id); if (i >= 0) cache[i] = o; else cache.push(o); }
    function buscarVeiculo(c) { if (!c) return null; var a = String(c).trim().toUpperCase();
      for (var i = 0; i < cad.frota.length; i++) if (String(cad.frota[i].veiculo).toUpperCase() === a) return cad.frota[i]; return null; }
    function dur(o, ate) { var base = o.inicioEm ? new Date(o.inicioEm).getTime() : new Date(o.abertaEm).getTime();
      var fim = o.finalizadaEm ? new Date(o.finalizadaEm).getTime() : (ate || Date.now()); return Math.max(0, fim - base); }
    function pushDB(o) {
      try { client.from("ocorrencias").upsert(objToRow(o)).then(function (r) { if (r && r.error) console.error("Supabase upsert:", r.error.message || r.error); }); }
      catch (e) { console.error("Supabase upsert falhou:", e); }
    }
    function carregar() {
      client.from("ocorrencias").select("*").then(function (res) {
        if (res && res.error) { console.error("Supabase select:", res.error.message || res.error); return; }
        cache = (res.data || []).map(rowToObj); fire();
      });
    }
    function carregarGerentes() {
      try {
        client.from("gerentes").select("*").then(function (res) {
          if (res && res.error) { console.error("Supabase gerentes:", res.error.message || res.error); return; }
          if (res.data && res.data.length) { gerentesCache = res.data.map(function (r) { return { nome: r.nome, telefone: r.telefone || "" }; }); fire(); }
        });
      } catch (e) { console.error("Supabase gerentes select falhou:", e); }
    }
    function assinarRealtime() {
      try {
        client.channel("ocorrencias-rt")
          .on("postgres_changes", { event: "*", schema: "public", table: "ocorrencias" }, function (payload) {
            if (payload.eventType === "DELETE") { var i = findIdx(payload.old.id); if (i >= 0) cache.splice(i, 1); }
            else { upsert(rowToObj(payload.new)); }
            fire();
          }).subscribe();
      } catch (e) { console.error("Realtime indisponivel:", e); }
    }

    var Store = {
      MODO: "remoto",
      STATUS: L.STATUS, STATUS_ATIVOS: L.STATUS_ATIVOS, URGENCIA: L.URGENCIA,
      onChange: function (cb) { if (typeof cb === "function") subs.push(cb); },

      listarAtivas: function () { return cache.filter(function (o) { return o.status !== "finalizada"; })
        .sort(function (a, b) { return new Date(a.abertaEm) - new Date(b.abertaEm); }); },
      listarFinalizadas: function () { return cache.filter(function (o) { return o.status === "finalizada"; })
        .sort(function (a, b) { return new Date(b.finalizadaEm) - new Date(a.finalizadaEm); }); },
      listarTodas: function () { return cache.slice(); },
      obter: function (id) { var i = findIdx(id); return i >= 0 ? cache[i] : null; },

      criar: function (dados) {
        var v = buscarVeiculo(dados.carro);
        var o = Object.assign({ carro:"",carroSegue:"",motorista:"",matricula:"",linha:"",localSocorro:"",
          dataViagem:"",horarioViagem:"",qtdClientes:"",encomendas:"Não",alimentacaoFornecida:"Não",
          defeitoMotorista:"",responsavelManutencao:"",saidaSocorro:"",gerenteRegional:"",coordenador:"",obs:"",
          servico:"",dataOcorrencia:"",horaQuebra:"",terminoSocorro:"" }, dados || {});
        o.id = uid(); o.status = "aberta"; o.abertaEm = nowISO(); o.finalizadaEm = null;
        o.inicioEm = montarInicio(o.dataOcorrencia, o.horaQuebra) || o.abertaEm;
        o.regional = v ? v.regional : (dados.regional || ""); o.placa = v ? v.placa : "";
        o.capacidade = v ? v.capacidade : ""; o.modelo = v ? v.modelo : "";
        o.eventos = [{ ts: o.abertaEm, tipo: "abertura", texto: "Ocorrencia aberta" }];
        upsert(o); fire(); pushDB(o); return o;
      },
      atualizar: function (id, patch) { var o = this.obter(id); if (!o) return null; Object.assign(o, patch);
        if (patch && patch.carro) { var v = buscarVeiculo(patch.carro); if (v) { o.regional=v.regional; o.placa=v.placa; o.capacidade=v.capacidade; o.modelo=v.modelo; } }
        var ini = montarInicio(o.dataOcorrencia, o.horaQuebra); if (ini) o.inicioEm = ini;
        fire(); pushDB(o); return o; },
      mudarStatus: function (id, status, texto) { var o = this.obter(id); if (!o || !L.STATUS[status]) return null;
        o.status = status; o.eventos.push({ ts: nowISO(), tipo: "status", texto: texto || ("Status: " + L.STATUS[status].label) });
        if (status === "finalizada" && !o.finalizadaEm) o.finalizadaEm = nowISO();
        if (status !== "finalizada") o.finalizadaEm = null; fire(); pushDB(o); return o; },
      addEvento: function (id, texto, tipo) { var o = this.obter(id); if (!o || !texto) return null;
        o.eventos.push({ ts: nowISO(), tipo: tipo || "medida", texto: texto }); fire(); pushDB(o); return o; },
      finalizar: function (id, texto) { var o = this.obter(id); if (!o) return null; o.status = "finalizada";
        o.finalizadaEm = nowISO(); o.terminoSocorro = horaHM(o.finalizadaEm); o.duracaoMs = dur(o);
        o.eventos.push({ ts: o.finalizadaEm, tipo: "finalizacao", texto: texto || "Ocorrencia finalizada" }); fire(); pushDB(o); return o; },
      reabrir: function (id) { var o = this.obter(id); if (!o) return null; o.status = "em_atendimento";
        o.finalizadaEm = null; o.terminoSocorro = ""; delete o.duracaoMs; o.eventos.push({ ts: nowISO(), tipo: "status", texto: "Ocorrencia reaberta" }); fire(); pushDB(o); return o; },
      remover: function (id) { var i = findIdx(id); if (i >= 0) cache.splice(i, 1); fire();
        try { client.from("ocorrencias").delete().eq("id", id).then(function (r) { if (r && r.error) console.error("Supabase delete:", r.error.message || r.error); }); }
        catch (e) { console.error("Supabase delete falhou:", e); } },

      duracaoMs: dur,
      nivelUrgencia: L.nivelUrgencia,

      frota: function () { return cad.frota.slice(); },
      regionais: function () { return cad.regionais.slice(); },
      gerentes: function () { return gerentesCache.slice(); },
      localidades: function () { return cad.localidades.slice(); },
      pontosApoio: function () { return cad.pontosApoio.slice(); },
      buscarVeiculo: buscarVeiculo,
      salvarLocalidades: function (arr) { cad.localidades = arr || []; },
      salvarPontosApoio: function (arr) { cad.pontosApoio = arr || []; },
      salvarFrota: function (arr) { if (arr && arr.length) cad.frota = arr; },
      salvarGerente: function (g) {
        if (!g || !g.nome) return;
        var i = -1; for (var k = 0; k < gerentesCache.length; k++) { if (gerentesCache[k].nome === g.nome) { i = k; break; } }
        var item = { nome: g.nome, telefone: g.telefone || "" };
        if (i >= 0) gerentesCache[i] = item; else gerentesCache.push(item);
        fire();
        try { client.from("gerentes").upsert(item).then(function (r) { if (r && r.error) console.error("Supabase gerentes upsert:", r.error.message || r.error); }); } catch (e) { console.error(e); }
      },
      removerGerente: function (nome) {
        gerentesCache = gerentesCache.filter(function (g) { return g.nome !== nome; }); fire();
        try { client.from("gerentes").delete().eq("nome", nome).then(function (r) { if (r && r.error) console.error("Supabase gerentes delete:", r.error.message || r.error); }); } catch (e) { console.error(e); }
      },

      exportarTudo: function () { return JSON.stringify({ exportadoEm: nowISO(), dados: { ocorrencias: cache.slice(), cadastros: cad } }, null, 2); },
      importarTudo: function (json) { var p = typeof json === "string" ? JSON.parse(json) : json; var novo = p && p.dados ? p.dados : p;
        if (!novo || !novo.ocorrencias) throw new Error("Arquivo invalido.");
        (novo.ocorrencias || []).forEach(function (o) { if (!o.id) o.id = uid(); upsert(o); pushDB(o); }); fire(); },

      _carregar: carregar, _assinar: assinarRealtime, _cache: function () { return cache; }
    };
    carregar(); carregarGerentes(); assinarRealtime();
    return Store;
  };
})();
