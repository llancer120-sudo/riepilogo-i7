/*
  Motore del sito "Riepilogo i7" (versione gratuita, GitHub Pages).

  Fa le stesse cose del cruscotto di claude.ai, così la pagina del Riepilogo i7 gira identica:
  dash.loader, dash.calc, dash.data, dash.draw, dash.onData, dash.colors, dash.setLink.

  I dati li scrive il PC i7 con pubblica.py:
  - dati/dati.cifrati.json  -> riepilogo + salute + frase dell'AI locale, cifrati con la password del sito
  - oppure, se la cifratura è spenta, dati/riepilogo.json e dati/salute.json in chiaro.
  La pagina li ricarica da sola ogni 5 minuti.
*/
(function () {
  'use strict';

  // Quale file usa ogni dato. Tutto il resto viene da riepilogo.json.
  const DA_SALUTE = ['salute', 'salute_storico', 'salute_eventi'];
  const OGNI_MS = 5 * 60 * 1000;
  const CHIAVE_PW = 'riepilogo-i7-password';

  const loaders = {};   // id -> fn({answer})
  const calcs = {};     // id -> {inputs, fn}
  const draws = [];     // [nome, fn]
  const ascolti = [];   // onData
  let pacchetto = null; // {riepilogo, salute, ai, quando}
  let stato = 'loading';
  let messaggio = '';
  let cache = {};       // id -> risultato già calcolato per questa versione dei dati

  const vuoto = (status, msg) => ({status, data: [], columns: [], message: msg || '', refreshing: false, truncated: false, meta: null});

  function leggi(id) {
    if (cache[id]) return cache[id];
    if (calcs[id]) {
      const c = calcs[id];
      const ingressi = c.inputs.map((i) => leggi(i));
      const brutto = ingressi.find((r) => r.status !== 'ok');
      if (brutto) return {status: brutto.status, data: null, columns: [], message: brutto.message, refreshing: false, truncated: false, meta: null};
      let out;
      try {
        out = c.fn(...ingressi.map((r) => r.data));
      } catch (e) {
        console.error('calc ' + id, e);
        return vuoto('error', String(e));
      }
      const r = {status: 'ok', data: out, columns: Array.isArray(out) && out[0] ? Object.keys(out[0]) : [], message: '', refreshing: false, truncated: false, meta: null};
      cache[id] = r;
      return r;
    }
    if (stato !== 'ok') return vuoto(stato, messaggio);
    const file = DA_SALUTE.includes(id) ? pacchetto.salute : pacchetto.riepilogo;
    if (!file) return vuoto('missing', 'File non pubblicato');
    let r;
    try {
      if (loaders[id]) {
        const o = loaders[id].fn({answer: file, text: JSON.stringify(file)}, id) || {};
        const rows = Array.isArray(o) ? o : (o.rows || []);
        r = {status: 'ok', data: rows, columns: o.columns || (rows[0] ? Object.keys(rows[0]) : []), message: '', refreshing: false, truncated: false, meta: null};
      } else {
        const rows = Array.isArray(file[id]) ? file[id] : [];
        r = {status: 'ok', data: rows, columns: rows[0] ? Object.keys(rows[0]) : [], message: '', refreshing: false, truncated: false, meta: null};
      }
    } catch (e) {
      console.error('loader ' + id, e);
      r = vuoto('error', String(e));
    }
    cache[id] = r;
    return r;
  }

  function disegna() {
    ascolti.forEach((fn) => { try { fn(); } catch (e) { console.error('onData', e); } });
    draws.forEach(([nome, fn]) => {
      document.querySelectorAll('[data-draw="' + nome + '"]').forEach((el) => {
        try { fn(el); } catch (e) { console.error('draw ' + nome, e); }
      });
    });
    const ai = document.getElementById('frase-ai');
    if (ai) {
      const a = pacchetto && pacchetto.ai;
      ai.hidden = !(a && a.testo);
      const t = ai.querySelector('[data-ai="testo"]');
      if (t) t.textContent = (a && a.testo) || '';
      const s = ai.querySelector('[data-ai="stato"]');
      if (s) {
        const st = (a && a.stato) || '';
        s.textContent = {ok: 'tutto ok', attenzione: 'da guardare', problema: 'problema'}[st] || st;
        s.className = 'rp-pill ' + ({ok: 'rp-ok', attenzione: 'rp-warn', problema: 'rp-bad'}[st] || 'rp-muted');
        s.hidden = !st;
      }
      const q = ai.querySelector('[data-ai="quando"]');
      if (q) q.textContent = a && a.quando ? ' (controllo delle ' + String(a.quando).slice(11, 16) + ')' : '';
    }
    const box = document.getElementById('controlli');
    if (box) {
      const lista = (pacchetto && pacchetto.controlli) || [];
      box.hidden = !lista.length;
      const dove = box.querySelector('[data-controlli]');
      if (dove) {
        dove.replaceChildren(...lista.map((c) => {
          const el = document.createElement('div');
          el.className = 'rp-st ' + ({ok: 'rp-ok', attenzione: 'rp-warn', problema: 'rp-bad'}[c.stato] || 'rp-muted');
          const dot = document.createElement('span'); dot.className = 'rp-dot';
          const testo = document.createElement('span');
          const n = document.createElement('span'); n.className = 'rp-st-name'; n.textContent = c.nome;
          const w = document.createElement('span'); w.className = 'rp-st-when'; w.textContent = ' · ' + c.ultimo;
          testo.append(n, w);
          el.append(dot, testo);
          return el;
        }));
      }
    }
    disegnaEmergenza();
    controllaEta();
  }

  // ---------- pulsanti di emergenza (18/11/2026): Spegni / Riavvia l'i7 ----------
  // Il comando va su ntfy firmato con la password del sito; sull'i7 lo esegue tools\emergenza\emergenza.py
  // (ogni minuto) con shutdown /f: nessuna domanda sul PC.
  let pwAttuale = null;
  const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  async function mandaComando(azione, topic, esito) {
    const enc = new TextEncoder();
    const chiaveRaw = await crypto.subtle.digest('SHA-256', enc.encode('emergenza-i7|' + pwAttuale));
    const chiave = await crypto.subtle.importKey('raw', chiaveRaw, {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
    const ts = Math.floor(Date.now() / 1000);
    const nonce = hex(crypto.getRandomValues(new Uint8Array(12)));
    const firma = hex(await crypto.subtle.sign('HMAC', chiave, enc.encode(azione + '|' + ts + '|' + nonce)));
    const r = await fetch('https://ntfy.sh/' + encodeURIComponent(topic), {method: 'POST', body: azione + '|' + ts + '|' + nonce + '|' + firma});
    if (!r.ok) throw new Error('ntfy ' + r.status);
    esito.textContent = (azione === 'spegni' ? 'Comando SPEGNI inviato: l\'i7 si spegne entro 1 minuto.' : 'Comando RIAVVIA inviato: l\'i7 si riavvia entro 1 minuto.');
  }
  function disegnaEmergenza() {
    const em = pacchetto && pacchetto.emergenza;
    let box = document.getElementById('emergenza');
    if (!em || !em.topic || !pwAttuale) { if (box) box.hidden = true; return; }
    if (!box) {
      box = document.createElement('div');
      box.id = 'emergenza';
      box.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0;';
      const tit = document.createElement('span'); tit.textContent = 'Emergenza i7:'; tit.style.fontWeight = '600';
      const esito = document.createElement('span'); esito.className = 'rp-muted'; esito.style.flexBasis = '100%';
      const bottone = (azione, testo, domanda) => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = testo;
        b.style.cssText = 'padding:8px 14px;border-radius:8px;border:1px solid var(--color-bad);background:transparent;color:var(--color-bad);font:inherit;font-weight:600;cursor:pointer;';
        b.onclick = async () => {
          if (!confirm(domanda)) return;
          b.disabled = true; esito.textContent = 'Invio…';
          try { await mandaComando(azione, box.dataset.topic, esito); } catch (e) { esito.textContent = 'Comando non inviato (' + (e.message || e) + '): riprova.'; }
          b.disabled = false;
        };
        return b;
      };
      box.append(tit,
        bottone('spegni', 'Spegni il PC', 'Sei sicuro che vuoi spegnere l\'i7?\n\nSi spegne entro 1 minuto, chiudendo tutto, e resta spento finché qualcuno non preme il tasto di accensione.'),
        bottone('riavvia', 'Riavvia il PC', 'Sei sicuro che vuoi riavviare l\'i7?\n\nSi riavvia entro 1 minuto, chiudendo tutto.'),
        esito);
      const dopo = document.getElementById('controlli') || document.getElementById('frase-ai');
      if (dopo && dopo.parentNode) dopo.parentNode.insertBefore(box, dopo.nextSibling); else document.body.prepend(box);
    }
    box.dataset.topic = em.topic;
    box.hidden = false;
  }

  // Avviso se l'i7 smette di pubblicare: la pagina non mostra mai dati vecchi senza dirlo.
  const MAX_MIN = 45;
  let pubblicato = null;
  function controllaEta() {
    const av = document.getElementById('avviso-vecchio');
    if (!av) return;
    const t = av.querySelector('[data-avviso]');
    let msg = '';
    if (stato === 'error') {
      msg = 'Non riesco a leggere i dati pubblicati dall\'i7 (' + messaggio + '). Se dura, controlla l\'attività "Sito gratis" sull\'i7.';
    } else if (pubblicato) {
      const min = (Date.now() - pubblicato.getTime()) / 60000;
      if (min > MAX_MIN) {
        const quanto = min < 120 ? Math.round(min) + ' minuti' : min < 2880 ? Math.round(min / 60) + ' ore' : Math.round(min / 1440) + ' giorni';
        msg = 'L\'i7 non pubblica da ' + quanto + ': i dati qui sotto sono vecchi. Controlla che il PC sia acceso e che l\'attività "Sito gratis" giri.';
      }
    }
    av.hidden = !msg;
    if (t) t.textContent = msg;
  }
  setInterval(controllaEta, 60000);

  window.dash = {
    loader(id, o) { loaders[id] = o; },
    calc(id, o) { calcs[id] = o; },
    data: leggi,
    draw(nome, fn) { draws.push([nome, fn]); },
    onData(fn) { ascolti.push(fn); try { fn(); } catch (e) { /* prima dei dati */ } },
    colors: ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'],
    setLink(id) { try { history.replaceState(null, '', '#' + id); } catch (e) { location.hash = id; } },
    refresh() { carica(); },
    params() { return {}; },
    setParams() {},
    resetParams() {}
  };

  // ---------- cifratura (AES-GCM, chiave da password con PBKDF2) ----------
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  async function decifra(busta, password) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    const chiave = await crypto.subtle.deriveKey(
      {name: 'PBKDF2', salt: b64(busta.sale), iterations: busta.giri, hash: 'SHA-256'},
      base, {name: 'AES-GCM', length: 256}, false, ['decrypt']);
    const chiaro = await crypto.subtle.decrypt({name: 'AES-GCM', iv: b64(busta.iv)}, chiave, b64(busta.dati));
    return JSON.parse(new TextDecoder().decode(chiaro));
  }

  const pwSalvata = () => { try { return localStorage.getItem(CHIAVE_PW) || sessionStorage.getItem(CHIAVE_PW); } catch (e) { return null; } };
  const salvaPw = (pw, ricorda) => {
    try { (ricorda ? localStorage : sessionStorage).setItem(CHIAVE_PW, pw); } catch (e) { /* niente memoria: la chiede di nuovo */ }
  };
  const dimenticaPw = () => { try { localStorage.removeItem(CHIAVE_PW); sessionStorage.removeItem(CHIAVE_PW); } catch (e) { /* niente */ } };
  window.rpEsci = () => { dimenticaPw(); location.reload(); };

  function chiediPassword(errore) {
    return new Promise((ok) => {
      const box = document.getElementById('accesso');
      const form = document.getElementById('accesso-form');
      const campo = document.getElementById('accesso-pw');
      const err = document.getElementById('accesso-errore');
      box.hidden = false;
      err.hidden = !errore;
      campo.value = '';
      campo.focus();
      form.onsubmit = (ev) => {
        ev.preventDefault();
        const pw = campo.value;
        if (!pw) return;
        box.hidden = true;
        ok({pw, ricorda: document.getElementById('accesso-ricorda').checked});
      };
    });
  }

  async function prendi(url) {
    const r = await fetch(url + '?t=' + Date.now(), {cache: 'no-store'});
    if (!r.ok) { const e = new Error('HTTP ' + r.status); e.http = r.status; throw e; }
    return r.json();
  }

  let ultimaVersione = null;

  async function carica() {
    try {
      let nuovo;
      let busta = null;
      try { busta = await prendi('dati/dati.cifrati.json'); } catch (e) { if (e.http !== 404) throw e; }
      if (busta) {
        if (busta.pubblicato) { const d = new Date(busta.pubblicato); if (!isNaN(d)) pubblicato = d; }
        if (busta.versione && busta.versione === ultimaVersione) { controllaEta(); return; }
        let pw = pwSalvata();
        let sbagliata = false;
        for (;;) {
          if (!pw) {
            const r = await chiediPassword(sbagliata);
            pw = r.pw;
            try { nuovo = await decifra(busta, pw); salvaPw(pw, r.ricorda); break; } catch (e) { pw = null; sbagliata = true; continue; }
          }
          try { nuovo = await decifra(busta, pw); break; } catch (e) { dimenticaPw(); pw = null; sbagliata = true; }
        }
        pwAttuale = pw;
        ultimaVersione = busta.versione || null;
      } else {
        const [riepilogo, salute] = await Promise.all([
          prendi('dati/riepilogo.json'),
          prendi('dati/salute.json').catch(() => null)
        ]);
        let extra = {};
        try { extra = await prendi('dati/ai.json') || {}; } catch (e) { /* facoltativo */ }
        nuovo = {riepilogo, salute, ai: extra.ai || null, controlli: extra.controlli || [], giri: extra.giri || null};
      }
      pacchetto = nuovo;
      stato = 'ok';
      messaggio = '';
    } catch (e) {
      console.error('Dati non caricati', e);
      if (stato !== 'ok') { stato = 'error'; messaggio = String(e.message || e); }
    }
    cache = {};
    disegna();
  }

  let attesa = null;
  let larghezza = 0;
  window.addEventListener('resize', () => {
    if (window.innerWidth === larghezza) return;
    larghezza = window.innerWidth;
    clearTimeout(attesa);
    attesa = setTimeout(disegna, 150);
  });

  window.rpAvvia = () => {
    // App installabile sul telefono (come Allenamento): funziona anche senza rete con gli ultimi dati.
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { /* va lo stesso, solo senza offline */ });
    larghezza = window.innerWidth;
    disegna();          // prima i segnaposto "—"
    carica();
    setInterval(carica, OGNI_MS);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) carica(); });
  };
})();
