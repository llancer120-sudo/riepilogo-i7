// Esercizi del ripasso di meccanica (app "Meccanica", dal 21/11/2026).
// Ogni modello genera un esercizio nuovo a ogni giro, con numeri diversi, in 3 livelli:
//   1 Guidato     numeri comodi, impostazione già aperta
//   2 Normale     unità miste, l'aiuto si apre solo se lo chiedi
//   3 Progettista il problema al contrario: scegli tu la misura (diametro, motore, molla...)
// Per aggiungere un esercizio: un nuovo oggetto in MODELLI con id, blocco, titolo e genera(livello, R).
// genera() restituisce { contesto, richiesta, dati:[[nome,valore,unità]], impostazione:[...],
//   risposta:{nome, valore, unita}, passi:[[cosa, formula, valore, unità]], decisione?:{domanda, opzioni, giusta}, giudizio }.
(function () {
  const G = 9.81;
  const PI = Math.PI;

  function f(x) { // come fmt() di risolvi.py: virgola italiana, punto per le migliaia
    if (!isFinite(x)) return String(x);
    const a = Math.abs(x);
    if (a >= 1000) return Math.round(x).toLocaleString('it-IT');
    if (a >= 10) return x.toFixed(1).replace('.', ',');
    if (a >= 0.01) return x.toFixed(3).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
    if (a === 0) return '0';
    return x.toExponential(2).replace('.', ',');
  }

  function prossimo(lista, x) { // il primo valore di catalogo che basta
    for (const v of lista) if (v >= x - 1e-9) return v;
    return lista[lista.length - 1];
  }

  function sceltaCatalogo(lista, x, unita) {
    const g = prossimo(lista, x);
    const i = lista.indexOf(g);
    const da = Math.max(0, Math.min(i - 1, lista.length - 4));
    const opz = lista.slice(da, da + 4);
    return { opzioni: opz.map((v) => f(v) + (unita ? ' ' + unita : '')), giusta: opz.indexOf(g), valore: g };
  }

  const BLOCCHI = [
    { id: 'b1', nome: 'Basi applicate', dettaglio: 'unità, trigonometria, energia, dilatazioni' },
    { id: 'b2', nome: 'Statica', dettaglio: 'forze, momenti, reazioni vincolari' },
    { id: 'b3', nome: 'Resistenza dei materiali', dettaglio: 'trazione, torsione, flessione' },
    { id: 'b5', nome: 'Meccanica applicata', dettaglio: 'trasmissioni, attrito' },
    { id: 'b6', nome: 'Elementi costruttivi', dettaglio: 'cuscinetti' },
    { id: 'b7', nome: 'Disegno e tolleranze', dettaglio: 'accoppiamenti, montaggio a caldo' },
    { id: 'b8', nome: 'Termodinamica', dettaglio: 'calore, riscaldamento, raffreddamento' },
  ];

  const MARGINE = ['Sì, con margine (oltre il 15%)', 'Sì, ma al limite (0–15%)', 'No, non basta'];
  function giustaMargine(ha, serve) { const m = ha / serve - 1; return m > 0.15 ? 0 : m >= 0 ? 1 : 2; }

  const MODELLI = [
    // ---------------- BLOCCO 1 ----------------
    {
      id: 'cilindro', blocco: 'b1', titolo: 'Il cilindro basta per serrare il pezzo?',
      genera(liv, R) {
        const eta = 0.9;
        if (liv === 3) {
          const Fr = R.tra(800, 3000, 100), pmin = R.da([4.5, 5, 5.5]);
          const Fp = Fr * 1.2;
          const p = pmin * 0.1;
          const Dmin = Math.sqrt(4 * Fp / (PI * p * eta));
          const cat = [25, 32, 40, 50, 63, 80, 100, 125];
          const sc = sceltaCatalogo(cat, Dmin, 'mm');
          return {
            contesto: `Devi scegliere il cilindro pneumatico di un bloccaggio che deve tenere ${f(Fr)} N. La rete è a 6 bar ma nei momenti di punta scende a ${f(pmin)} bar. Vuoi il 20% di margine. Rendimento del cilindro circa 0,9.`,
            richiesta: 'Diametro minimo del pistone, in mm. Poi scegli il cilindro di catalogo.',
            dati: [['F richiesta', Fr, 'N'], ['p minima', pmin, 'bar'], ['margine', 20, '%'], ['η', eta, '']],
            impostazione: ['Si progetta sul caso peggiore: la pressione minima, non quella nominale.', 'Forza da garantire: F = 1,2 · F richiesta.', 'F = p · (π D²/4) · η, quindi D = √(4F / (π p η)), con p in MPa e D in mm.', 'Arrotonda sempre al catalogo verso l\'alto.'],
            risposta: { nome: 'D minimo', valore: Dmin, unita: 'mm' },
            passi: [['Forza con il margine', `F = ${f(Fr)} · 1,2`, Fp, 'N'], ['Pressione minima in MPa', `p = ${f(pmin)} · 0,1`, p, 'MPa'], ['Diametro minimo', 'D = √(4F / (π · p · η))', Dmin, 'mm']],
            decisione: { domanda: 'Quale cilindro di catalogo monti?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Serve almeno Ø${f(Dmin)} mm: si monta il Ø${sc.valore}. Con la pressione nominale avrai ancora più margine, ma il progetto si fa sul caso peggiore.`,
          };
        }
        const D = liv === 1 ? R.da([40, 50, 63]) : R.da([32, 40, 50, 63, 80]);
        const pbar = liv === 1 ? 6 : R.da([5.5, 6, 6.5, 7]);
        const pTesto = liv === 1 ? `${f(pbar)} bar` : `${f(pbar * 100)} kPa`;
        const p = pbar * 0.1;
        const A = PI * D * D / 4;
        const F = p * A * eta;
        const Fr = Math.round(F * R.da([0.75, 0.9, 0.95, 1.1, 1.25]) / 50) * 50;
        return {
          contesto: `Su una macchina di montaggio un pezzo va bloccato con almeno ${f(Fr)} N. In officina c'è un cilindro pneumatico Ø${D} mm e la rete d'aria è a ${pTesto}. Il catalogo dà un rendimento di circa 0,9 per gli attriti delle guarnizioni.`,
          richiesta: 'Forza reale di spinta del cilindro, in N.',
          dati: [['D', D, 'mm'], ['p', liv === 1 ? pbar : pbar * 100, liv === 1 ? 'bar' : 'kPa'], ['η', eta, ''], ['F richiesta', Fr, 'N']],
          impostazione: ['In spinta la pressione agisce su tutta l\'area del pistone.', liv === 1 ? 'Porta i bar in MPa (1 bar = 0,1 MPa = 0,1 N/mm²): con l\'area in mm² esce subito N.' : 'Porta i kPa in MPa (1000 kPa = 1 MPa = 1 N/mm²): con l\'area in mm² esce subito N.', 'F = p · A · η.', 'Confronta con la forza richiesta e calcola il margine.'],
          risposta: { nome: 'F', valore: F, unita: 'N' },
          passi: [['Pressione in MPa', liv === 1 ? `p = ${f(pbar)} · 0,1` : `p = ${f(pbar * 100)} / 1000`, p, 'MPa'], ['Area del pistone', `A = π · ${D}² / 4`, A, 'mm²'], ['Forza teorica', 'F₀ = p · A', p * A, 'N'], ['Forza reale', 'F = F₀ · η', F, 'N'], ['Margine sul richiesto', `(F − ${f(Fr)}) / ${f(Fr)}`, (F / Fr - 1) * 100, '%']],
          decisione: { domanda: 'Il cilindro basta?', opzioni: MARGINE, giusta: giustaMargine(F, Fr) },
          giudizio: `Il cilindro spinge ${f(F)} N contro ${f(Fr)} N richiesti (${F >= Fr ? '+' : ''}${f((F / Fr - 1) * 100)}%). In officina la rete scende spesso di 1 bar: sotto il 15% di margine conviene il diametro più grande.`,
        };
      },
    },
    {
      id: 'motoriduttore', blocco: 'b1', titolo: 'Il motoriduttore muove il rullo?',
      genera(liv, R) {
        if (liv === 3) {
          const C = R.tra(120, 600, 10), n = R.tra(15, 60, 1), eta = 0.85, fs = 1.4;
          const w = 2 * PI * n / 60;
          const P = C * fs * w / eta / 1000;
          const sc = sceltaCatalogo([0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11], P, 'kW');
          return {
            contesto: `Un nastro trasportatore chiede ${f(C)} N·m al rullo a ${n} giri/min. Per gli avviamenti frequenti usi un fattore di servizio 1,4. Il riduttore ha rendimento 0,85.`,
            richiesta: 'Potenza minima del motore, in kW. Poi scegli il motore di catalogo.',
            dati: [['C rullo', C, 'N·m'], ['n uscita', n, 'giri/min'], ['fattore di servizio', fs, ''], ['η riduttore', eta, '']],
            impostazione: ['ω = 2π n / 60 in rad/s.', 'Potenza all\'uscita: P = C · ω · fattore di servizio.', 'Il motore deve dare anche quello che il riduttore perde: P motore = P uscita / η.', 'Arrotonda al motore di catalogo verso l\'alto.'],
            risposta: { nome: 'P motore', valore: P, unita: 'kW' },
            passi: [['Velocità angolare', `ω = 2π · ${n} / 60`, w, 'rad/s'], ['Potenza all\'uscita con il fattore di servizio', `P = ${f(C)} · ω · 1,4`, C * w * fs, 'W'], ['Potenza del motore', 'P = P uscita / 0,85', P, 'kW']],
            decisione: { domanda: 'Quale motore scegli?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Servono ${f(P)} kW: si prende il ${f(sc.valore)} kW. Controlla poi la coppia di spunto del motore: all'avvio a pieno carico è quella che conta.`,
          };
        }
        const P = R.da([0.37, 0.55, 0.75, 1.1]), eta = 0.85;
        let n, nTesto, passiN;
        if (liv === 1) {
          n = R.tra(20, 60, 1);
          nTesto = `uscita a ${n} giri/min`;
          passiN = [];
        } else {
          const n1 = R.da([1400, 1450, 2800]), i = R.da([25, 30, 40, 50, 60]);
          n = n1 / i;
          nTesto = `motore a ${n1} giri/min e rapporto di riduzione i = ${i}`;
          passiN = [['Giri in uscita', `n = ${n1} / ${i}`, n, 'giri/min']];
        }
        const w = 2 * PI * n / 60;
        const C = P * 1000 * eta / w;
        const Cr = Math.round(C * R.da([0.8, 0.9, 0.95, 1.1, 1.2]) / 5) * 5;
        return {
          contesto: `Un rullo di un trasportatore chiede ${f(Cr)} N·m per partire a pieno carico. Il fornitore propone un motoriduttore da ${f(P)} kW, ${nTesto}, rendimento del riduttore 0,85.`,
          richiesta: 'Coppia disponibile all\'albero di uscita, in N·m.',
          dati: [['P motore', P, 'kW'], ...(liv === 1 ? [['n uscita', n, 'giri/min']] : []), ['η', eta, ''], ['C richiesta', Cr, 'N·m']],
          impostazione: [...(liv === 1 ? [] : ['Prima i giri all\'uscita: n = n motore / i.']), 'Potenza = coppia × velocità angolare: C = P / ω.', 'ω in rad/s: ω = 2π n / 60. P in W.', 'All\'uscita arriva P · η.'],
          risposta: { nome: 'C', valore: C, unita: 'N·m' },
          passi: [...passiN, ['Velocità angolare in uscita', 'ω = 2π · n / 60', w, 'rad/s'], ['Potenza all\'uscita', `P = ${f(P * 1000)} W · 0,85`, P * 1000 * eta, 'W'], ['Coppia all\'uscita', 'C = P / ω', C, 'N·m']],
          decisione: { domanda: 'Basta per il rullo?', opzioni: MARGINE, giusta: giustaMargine(C, Cr) },
          giudizio: `${f(C)} N·m contro ${f(Cr)} richiesti. Per la partenza a pieno carico controlla la coppia di spunto del motore sul catalogo (di solito 2–2,5 volte la nominale) e il fattore di servizio del riduttore.`,
        };
      },
    },
    {
      id: 'funi', blocco: 'b1', titolo: 'Le due funi reggono la cassa?',
      genera(liv, R) {
        const m = R.tra(200, 1200, 50);
        const W = m * G;
        if (liv === 3) {
          const T = Math.round(W * R.da([0.6, 0.7, 0.8]) / 100) * 100;
          const c = W / (2 * T);
          const a = Math.acos(c) * 180 / PI;
          return {
            contesto: `Devi sollevare una cassa di ${m} kg con due funi agganciate allo stesso gancio. Ogni fune ha un carico di lavoro di ${f(T)} N. L'operatore chiede quanto può aprire le funi.`,
            richiesta: 'Angolo massimo TRA le due funi, in gradi.',
            dati: [['m', m, 'kg'], ['T ammessa', T, 'N']],
            impostazione: ['Equilibrio al gancio: 2 · T · cos α = m · g, con α tra fune e verticale.', 'cos α = m g / (2 T), quindi α = arccos(...).', 'L\'angolo tra le funi è 2α.'],
            risposta: { nome: 'angolo tra le funi', valore: 2 * a, unita: '°' },
            passi: [['Peso', `W = ${m} · 9,81`, W, 'N'], ['cos α', `cos α = W / (2 · ${f(T)})`, c, ''], ['α con la verticale', 'α = arccos(...)', a, '°'], ['Angolo tra le funi', '2α', 2 * a, '°']],
            giudizio: `Al massimo ${f(2 * a)}° tra le funi. In pratica si sta sotto: sopra 90° le tensioni crescono in fretta e un piccolo errore di aggancio porta oltre il limite.`,
          };
        }
        const a = liv === 1 ? R.da([30, 45]) : R.da([40, 45, 50, 60]);
        const ar = a * PI / 180;
        const T = W / (2 * Math.cos(ar));
        const Ta = Math.round(T * R.da([0.85, 0.95, 1.1, 1.3]) / 100) * 100;
        const angTesto = liv === 1 ? `Ogni fune forma ${a}° con la verticale.` : `Le due funi formano ${2 * a}° tra loro.`;
        return {
          contesto: `Una cassa di ${m} kg viene sollevata con due funi agganciate allo stesso gancio. ${angTesto} Le funi in magazzino hanno un carico di lavoro di ${f(Ta)} N ciascuna.`,
          richiesta: 'Tensione in ogni fune, in N.',
          dati: [['m', m, 'kg'], [liv === 1 ? 'α (con la verticale)' : 'angolo tra le funi', liv === 1 ? a : 2 * a, '°'], ['T ammessa', Ta, 'N']],
          impostazione: [...(liv === 1 ? [] : ['L\'angolo che conta è quello con la verticale: la metà dell\'angolo tra le funi.']), 'Disegna il nodo del gancio: peso in giù, due tensioni inclinate.', 'Le orizzontali si annullano, le verticali reggono il peso: 2 · T · cos α = m · g.', 'Confronta con il carico di lavoro.'],
          risposta: { nome: 'T', valore: T, unita: 'N' },
          passi: [['Peso della cassa', `W = ${m} · 9,81`, W, 'N'], ...(liv === 1 ? [] : [['Angolo con la verticale', `α = ${2 * a} / 2`, a, '°']]), ['cos α', `cos ${a}°`, Math.cos(ar), ''], ['Tensione', 'T = W / (2 · cos α)', T, 'N']],
          decisione: { domanda: 'Le funi vanno bene?', opzioni: MARGINE, giusta: giustaMargine(Ta, T) },
          giudizio: `Ogni fune tira ${f(T)} N contro ${f(Ta)} ammessi. Più si aprono, più tirano: chiudere l'angolo (funi più lunghe) è spesso la soluzione più economica.`,
        };
      },
    },
    {
      id: 'molla', blocco: 'b1', titolo: 'La molla di fine corsa ferma il carrello?',
      genera(liv, R) {
        const m = R.tra(5, 40, 1), v = R.da([0.5, 0.6, 0.8, 1, 1.2]);
        const Ec = 0.5 * m * v * v;
        if (liv === 3) {
          const s = R.da([20, 25, 30, 40]);
          const kmin = 2 * Ec / Math.pow(s / 1000, 2) / 1000;
          const Fp = kmin * s;
          return {
            contesto: `Un carrello di ${m} kg arriva a fine corsa a ${f(v)} m/s. Hai spazio per una molla con corsa utile di ${s} mm e la vuoi scegliere dal catalogo.`,
            richiesta: 'Rigidezza minima della molla, in N/mm, per fermare il carrello dentro la corsa utile.',
            dati: [['m', m, 'kg'], ['v', v, 'm/s'], ['corsa utile', s, 'mm']],
            impostazione: ['Energia del carrello: E = ½ m v².', 'La molla a corsa piena assorbe ½ k s².', 'k = 2E / s², con s in m esce N/m: dividi per 1000 per avere N/mm.', 'Pensa anche alla forza di picco F = k · s: il telaio la deve reggere.'],
            risposta: { nome: 'k minima', valore: kmin, unita: 'N/mm' },
            passi: [['Energia cinetica', `E = 0,5 · ${m} · ${f(v)}²`, Ec, 'J'], ['Rigidezza minima', `k = 2E / (${s}/1000)²`, kmin * 1000, 'N/m'], ['In N/mm', 'k / 1000', kmin, 'N/mm'], ['Forza di picco', `F = k · ${s}`, Fp, 'N']],
            giudizio: `Serve almeno ${f(kmin)} N/mm: prendi la molla di catalogo subito sopra. Una molla più rigida ferma prima ma dà un picco più alto (qui ${f(Fp)} N): spesso conviene un ammortizzatore.`,
          };
        }
        const k = R.da([4, 6, 8, 10, 12, 15]), x = R.da([20, 25, 30, 40]);
        const Em = 0.5 * k * 1000 * Math.pow(x / 1000, 2);
        const xu = Math.sqrt(2 * Ec / (k * 1000)) * 1000;
        const base = {
          contesto: `Un carrello di ${m} kg arriva a fine corsa a ${f(v)} m/s. Come fermo c'è una molla con rigidezza ${k} N/mm e corsa utile ${x} mm.`,
          dati: [['m', m, 'kg'], ['v', v, 'm/s'], ['k', k, 'N/mm'], ['corsa utile', x, 'mm']],
          decisione: { domanda: 'Il carrello si ferma prima che la molla vada a pacco?', opzioni: ['Sì', 'No, va a pacco'], giusta: xu <= x ? 0 : 1 },
          giudizio: xu <= x ? `Si ferma dopo ${f(xu)} mm su ${x}: la molla basta. Il fermo deve reggere circa ${f(k * xu)} N di picco.` : `Servirebbero ${f(xu)} mm ma la corsa è ${x}: la molla va a pacco e il colpo arriva sul telaio. Serve una molla più rigida o più corsa.`,
        };
        if (liv === 1) {
          return Object.assign(base, {
            richiesta: 'Energia che la molla assorbe a corsa piena, in J.',
            impostazione: ['Il carrello porta E = ½ m v².', 'La molla assorbe ½ k x² (l\'area del triangolo forza-corsa).', 'Unità: k in N/m e x in m, così esce J.', 'Se E molla ≥ E carrello si ferma.'],
            risposta: { nome: 'E molla', valore: Em, unita: 'J' },
            passi: [['Energia cinetica del carrello', `E = 0,5 · ${m} · ${f(v)}²`, Ec, 'J'], ['Rigidezza in N/m', `k = ${k} · 1000`, k * 1000, 'N/m'], ['Corsa in m', `x = ${x} / 1000`, x / 1000, 'm'], ['Energia della molla a corsa piena', 'E = ½ · k · x²', Em, 'J']],
          });
        }
        return Object.assign(base, {
          richiesta: 'Corsa che la molla usa davvero per fermare il carrello, in mm.',
          impostazione: ['Il carrello porta E = ½ m v².', 'La molla si ferma quando ½ k x² = E, quindi x = √(2E / k).', 'k in N/m, il risultato in m: poi portalo in mm.'],
          risposta: { nome: 'x', valore: xu, unita: 'mm' },
          passi: [['Energia cinetica', `E = 0,5 · ${m} · ${f(v)}²`, Ec, 'J'], ['Rigidezza in N/m', `k = ${k} · 1000`, k * 1000, 'N/m'], ['Corsa usata', 'x = √(2E / k) · 1000', xu, 'mm']],
        });
      },
    },
    {
      id: 'dilatazione', blocco: 'b1', titolo: 'Il gioco del cuscinetto flottante basta?',
      genera(liv, R) {
        const aS = 12e-6;
        if (liv === 3) {
          const L = R.tra(400, 1200, 50), dTa = R.tra(40, 70, 5), dTc = R.tra(10, 25, 5), aAl = 23e-6;
          const dS = aS * L * dTa, dC = aAl * L * dTc, rel = dS - dC;
          const gioco = R.da([0.1, 0.15, 0.2, 0.3]);
          return {
            contesto: `Un albero d'acciaio lungo ${L} mm tra i cuscinetti si scalda di ${dTa} °C in esercizio. La carcassa è in alluminio e si scalda solo di ${dTc} °C. Un cuscinetto è fisso, l'altro flottante con ${f(gioco)} mm di gioco assiale. α acciaio 12·10⁻⁶ 1/°C, α alluminio 23·10⁻⁶ 1/°C.`,
            richiesta: 'Di quanto l\'albero si allunga RISPETTO alla carcassa, in mm?',
            dati: [['L', L, 'mm'], ['ΔT albero', dTa, '°C'], ['ΔT carcassa', dTc, '°C'], ['gioco', gioco, 'mm']],
            impostazione: ['Si allungano tutti e due: conta la differenza.', 'ΔL albero = α_acciaio · L · ΔT albero.', 'ΔL carcassa = α_alluminio · L · ΔT carcassa.', 'Differenza = ΔL albero − ΔL carcassa.'],
            risposta: { nome: 'ΔL relativo', valore: rel, unita: 'mm' },
            passi: [['Allungamento albero', `12·10⁻⁶ · ${L} · ${dTa}`, dS, 'mm'], ['Allungamento carcassa', `23·10⁻⁶ · ${L} · ${dTc}`, dC, 'mm'], ['Differenza', 'ΔL albero − ΔL carcassa', rel, 'mm']],
            decisione: { domanda: `Il gioco di ${f(gioco)} mm basta?`, opzioni: ['Sì', 'No'], giusta: rel <= gioco ? 0 : 1 },
            giudizio: `L'albero cresce di ${f(rel)} mm più della carcassa, contro ${f(gioco)} mm di gioco. Attenzione al transitorio: all'avviamento l'albero si scalda prima della carcassa e la differenza è peggiore.`,
          };
        }
        let L, dT, Ltesto, dTtesto, passiPre = [];
        if (liv === 1) {
          L = R.tra(400, 1200, 50); dT = R.tra(20, 60, 5);
          Ltesto = `${L} mm`; dTtesto = `lavora a ${dT} °C più dell'ambiente di montaggio`;
        } else {
          const Lm = R.da([0.6, 0.8, 1, 1.2, 1.5]); const t1 = 20, t2 = R.tra(55, 90, 5);
          L = Lm * 1000; dT = t2 - t1;
          Ltesto = `${f(Lm)} m`; dTtesto = `viene montato a ${t1} °C e in esercizio arriva a ${t2} °C`;
          passiPre = [['Lunghezza in mm', `${f(Lm)} · 1000`, L, 'mm'], ['Salto di temperatura', `${t2} − ${t1}`, dT, '°C']];
        }
        const dL = aS * L * dT;
        const gioco = R.da([0.2, 0.3, 0.5]);
        return {
          contesto: `Un albero d'acciaio lungo ${Ltesto} tra i cuscinetti ${dTtesto}. Un cuscinetto è fisso, l'altro flottante con ${f(gioco)} mm di gioco assiale. α acciaio 12·10⁻⁶ 1/°C; la carcassa si scalda poco (la trascuri).`,
          richiesta: 'Allungamento dell\'albero, in mm.',
          dati: [['L', liv === 1 ? L : L / 1000, liv === 1 ? 'mm' : 'm'], ['ΔT', dT, '°C'], ['α', '12·10⁻⁶', '1/°C'], ['gioco', gioco, 'mm']],
          impostazione: ['Dilatazione lineare: ΔL = α · L · ΔT.', 'Ordine di grandezza: 12 µm per metro e per grado.', 'Confronta con il gioco: se non basta il cuscinetto si carica assialmente e scalda.'],
          risposta: { nome: 'ΔL', valore: dL, unita: 'mm' },
          passi: [...passiPre, ['Dilatazione lineare', `ΔL = 12·10⁻⁶ · ${L} · ${dT}`, dL, 'mm'], ['Gioco che resta', `${f(gioco)} − ΔL`, gioco - dL, 'mm']],
          decisione: { domanda: `Il gioco di ${f(gioco)} mm basta?`, opzioni: ['Sì', 'No'], giusta: dL <= gioco ? 0 : 1 },
          giudizio: dL <= gioco ? `L'albero si allunga di ${f(dL)} mm: il gioco basta, con ${f(gioco - dL)} mm che restano.` : `L'albero si allunga di ${f(dL)} mm ma il gioco è ${f(gioco)}: NON basta. Più gioco, o un cuscinetto a rulli cilindrici che lascia scorrere l'albero.`,
        };
      },
    },

    // ---------------- BLOCCO 2 ----------------
    {
      id: 'trave-appoggiata', blocco: 'b2', titolo: 'Quanto carica ogni appoggio della trave?',
      genera(liv, R) {
        const L = R.da([2000, 2500, 3000, 4000, 5000]);
        if (liv === 3) {
          const m = R.tra(250, 2000, 50), q = R.da([20, 30, 42, 57]), c = R.da([200, 300, 400]);
          const P = m * G, Q = q * G * L / 1000;
          const Rmax = P * (L - c) / L + Q / 2;
          const Ramm = Math.round(Rmax * R.da([0.9, 1.05, 1.3]) / 100) * 100;
          return {
            contesto: `Una trave lunga ${f(L / 1000)} m, appoggiata alle due estremità, porta un paranco da ${m} kg che scorre su tutta la luce (il carrello si avvicina agli appoggi fino a ${c} mm). La trave pesa ${q} kg/m. Ogni mensola d'appoggio è data per ${f(Ramm)} N.`,
            richiesta: 'Reazione MASSIMA su un appoggio, in N.',
            dati: [['luce', L, 'mm'], ['m paranco', m, 'kg'], ['q trave', q, 'kg/m'], ['distanza minima', c, 'mm'], ['R ammessa', Ramm, 'N']],
            impostazione: ['Il caso peggiore per l\'appoggio A è il paranco più vicino possibile ad A.', 'Momenti attorno a B: R_A · L = P · (L − c) + Q · L/2.', 'Il peso della trave si divide a metà.'],
            risposta: { nome: 'R max', valore: Rmax, unita: 'N' },
            passi: [['Peso del paranco', `P = ${m} · 9,81`, P, 'N'], ['Peso della trave', `Q = ${q} · 9,81 · ${f(L / 1000)}`, Q, 'N'], ['Quota del paranco su A', `P · (L − ${c}) / L`, P * (L - c) / L, 'N'], ['Reazione massima', '+ Q / 2', Rmax, 'N']],
            decisione: { domanda: 'Le mensole bastano?', opzioni: MARGINE, giusta: giustaMargine(Ramm, Rmax) },
            giudizio: `Al massimo ${f(Rmax)} N su un appoggio contro ${f(Ramm)} N ammessi. Per un paranco si aggiunge anche un coefficiente dinamico (spesso 1,1–1,3) per le partenze del sollevamento.`,
          };
        }
        if (liv === 1) {
          const F = R.tra(1000, 10000, 500), a = R.tra(L * 0.2, L * 0.8, 100);
          const RA = F * (L - a) / L;
          return {
            contesto: `Una trave lunga ${L} mm è appoggiata alle due estremità A e B. A ${a} mm da A c'è un carico di ${f(F)} N (un motore appoggiato sul telaio).`,
            richiesta: 'Reazione sull\'appoggio A, in N.',
            dati: [['L', L, 'mm'], ['F', F, 'N'], ['distanza da A', a, 'mm']],
            impostazione: ['Equilibrio dei momenti attorno a B: così R_B sparisce.', 'R_A · L = F · (L − a).', 'Controllo: R_A + R_B = F.'],
            risposta: { nome: 'R_A', valore: RA, unita: 'N' },
            passi: [['Braccio del carico rispetto a B', `L − a = ${L} − ${a}`, L - a, 'mm'], ['Reazione in A', `R_A = ${f(F)} · ${L - a} / ${L}`, RA, 'N'], ['Reazione in B', 'R_B = F − R_A', F - RA, 'N']],
            giudizio: `R_A = ${f(RA)} N, R_B = ${f(F - RA)} N: l'appoggio più vicino al carico prende di più. Controllo veloce: la somma deve dare il carico.`,
          };
        }
        const F1 = R.tra(1, 6, 0.5), F2 = R.tra(1, 6, 0.5), a1 = R.tra(L * 0.15, L * 0.45, 100), a2 = R.tra(L * 0.55, L * 0.85, 100);
        const RA = (F1 * 1000 * (L - a1) + F2 * 1000 * (L - a2)) / L;
        return {
          contesto: `Una trave lunga ${f(L / 1000)} m è appoggiata in A e B. Porta due carichi: ${f(F1)} kN a ${a1} mm da A e ${f(F2)} kN a ${a2} mm da A.`,
          richiesta: 'Reazione sull\'appoggio A, in N.',
          dati: [['L', L / 1000, 'm'], ['F1', F1, 'kN'], ['a1', a1, 'mm'], ['F2', F2, 'kN'], ['a2', a2, 'mm']],
          impostazione: ['Porta tutto nelle stesse unità: N e mm.', 'Momenti attorno a B: R_A · L = F1 · (L − a1) + F2 · (L − a2).', 'Controllo: R_A + R_B = F1 + F2.'],
          risposta: { nome: 'R_A', valore: RA, unita: 'N' },
          passi: [['Luce in mm', `${f(L / 1000)} · 1000`, L, 'mm'], ['Momento di F1 attorno a B', `${f(F1 * 1000)} · ${L - a1}`, F1 * 1000 * (L - a1), 'N·mm'], ['Momento di F2 attorno a B', `${f(F2 * 1000)} · ${L - a2}`, F2 * 1000 * (L - a2), 'N·mm'], ['Reazione in A', 'R_A = somma / L', RA, 'N']],
          giudizio: `R_A = ${f(RA)} N e R_B = ${f((F1 + F2) * 1000 - RA)} N. Il trucco è scegliere il polo dei momenti su un'incognita: così ne resta una sola.`,
        };
      },
    },
    {
      id: 'mensola', blocco: 'b2', titolo: 'Che momento arriva all\'attacco della mensola?',
      genera(liv, R) {
        const L = R.da([300, 400, 500, 600, 800]);
        const F = R.tra(500, 4000, 100);
        const M = F * L / 1000;
        if (liv === 3) {
          const h = R.da([100, 120, 150, 200]);
          const Fv = M * 1000 / h;
          const sc = sceltaCatalogo([5000, 8000, 12000, 18000, 25000, 35000, 50000, 70000], Fv * 1.25, 'N');
          return {
            contesto: `Una mensola sporge ${L} mm da un montante e porta in punta ${f(F)} N. È fissata con una piastra e due viti, una in alto e una in basso, a ${h} mm di distanza. La piastra fa leva sul bordo basso: la vite alta lavora a trazione.`,
            richiesta: 'Forza di trazione sulla vite alta, in N.',
            dati: [['sbalzo', L, 'mm'], ['F', F, 'N'], ['distanza viti', h, 'mm']],
            impostazione: ['Momento all\'attacco: M = F · L.', 'La piastra ruota attorno al bordo basso: la vite alta deve dare lo stesso momento.', 'F vite = M / h (stessa unità: N·mm e mm).'],
            risposta: { nome: 'F vite', valore: Fv, unita: 'N' },
            passi: [['Momento all\'attacco', `M = ${f(F)} · ${L}`, F * L, 'N·mm'], ['Trazione sulla vite alta', `F = M / ${h}`, Fv, 'N']],
            decisione: { domanda: 'Con il 25% di margine, quale carico ammesso deve avere la vite?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `La vite alta tira ${f(Fv)} N, cioè ${f(Fv / F)} volte il carico in punta: è l'effetto leva. Allontanare le viti è il modo più economico per scaricarle.`,
          };
        }
        if (liv === 1) {
          return {
            contesto: `Una mensola sporge ${L} mm da una parete e porta in punta un carico di ${f(F)} N.`,
            richiesta: 'Momento all\'incastro, in N·m.',
            dati: [['L', L, 'mm'], ['F', F, 'N']],
            impostazione: ['Momento = forza × braccio.', 'Il braccio va in metri per avere N·m.'],
            risposta: { nome: 'M', valore: M, unita: 'N·m' },
            passi: [['Braccio in m', `${L} / 1000`, L / 1000, 'm'], ['Momento all\'incastro', `M = ${f(F)} · ${f(L / 1000)}`, M, 'N·m']],
            giudizio: `${f(M)} N·m all'incastro. È il punto più caricato della mensola: lì si controllano saldature o viti.`,
          };
        }
        const q = R.da([5, 8, 12, 20]);
        const qN = q * G;
        const Mq = qN * Math.pow(L / 1000, 2) / 2;
        return {
          contesto: `Una mensola in acciaio sporge ${L} mm e porta in punta ${f(F)} N. La mensola stessa pesa ${q} kg/m e non lo vuoi trascurare.`,
          richiesta: 'Momento totale all\'incastro, in N·m.',
          dati: [['L', L, 'mm'], ['F', F, 'N'], ['peso proprio', q, 'kg/m']],
          impostazione: ['Due contributi: il carico in punta e il peso distribuito.', 'Carico in punta: F · L.', 'Peso distribuito q (in N/m): equivale a q · L applicato a metà, quindi q · L² / 2.'],
          risposta: { nome: 'M', valore: M + Mq, unita: 'N·m' },
          passi: [['Momento del carico in punta', `${f(F)} · ${f(L / 1000)}`, M, 'N·m'], ['Peso proprio in N/m', `q = ${q} · 9,81`, qN, 'N/m'], ['Momento del peso proprio', `q · ${f(L / 1000)}² / 2`, Mq, 'N·m'], ['Momento totale', 'somma', M + Mq, 'N·m']],
          giudizio: `${f(M + Mq)} N·m, di cui ${f(Mq)} dal peso proprio (${f(Mq / (M + Mq) * 100)}%). Su mensole corte si trascura, su quelle lunghe e pesanti no.`,
        };
      },
    },

    // ---------------- BLOCCO 3 ----------------
    {
      id: 'tirante', blocco: 'b3', titolo: 'Il tirante resiste?',
      genera(liv, R) {
        const Rs = 235, nu = 1.5, amm = Rs / nu;
        if (liv === 3) {
          const F = R.tra(10, 80, 2);
          const d = Math.sqrt(4 * F * 1000 * nu / (PI * Rs));
          const sc = sceltaCatalogo([10, 12, 14, 16, 18, 20, 22, 25, 30, 35], d, 'mm');
          return {
            contesto: `Devi dimensionare un tirante tondo pieno in S235 (snervamento 235 MPa) che porta ${f(F)} kN a trazione. Coefficiente di sicurezza 1,5.`,
            richiesta: 'Diametro minimo, in mm. Poi scegli la barra commerciale.',
            dati: [['F', F, 'kN'], ['Rs', Rs, 'MPa'], ['ν', nu, '']],
            impostazione: ['Tensione ammissibile: σ amm = Rs / ν.', 'Area minima: A = F / σ amm (F in N, così esce mm²).', 'd = √(4A / π).'],
            risposta: { nome: 'd minimo', valore: d, unita: 'mm' },
            passi: [['Tensione ammissibile', '235 / 1,5', amm, 'MPa'], ['Area minima', `A = ${f(F * 1000)} / ${f(amm)}`, F * 1000 / amm, 'mm²'], ['Diametro minimo', 'd = √(4A / π)', d, 'mm']],
            decisione: { domanda: 'Che barra prendi?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Serve almeno Ø${f(d)}: si prende il Ø${sc.valore}. Se il tirante è filettato alle estremità, la sezione che conta è quella del filetto, più piccola.`,
          };
        }
        if (liv === 1) {
          const d = R.da([10, 12, 16, 20, 24]), F = R.tra(5, 60, 1);
          const A = PI * d * d / 4, s = F * 1000 / A;
          return {
            contesto: `Un tirante tondo pieno Ø${d} mm in S235 (snervamento 235 MPa) porta ${f(F)} kN. Il progetto chiede un coefficiente di sicurezza 1,5, quindi σ ammissibile ≈ 157 MPa.`,
            richiesta: 'Tensione nel tirante, in MPa.',
            dati: [['d', d, 'mm'], ['F', F, 'kN'], ['σ amm', 157, 'MPa']],
            impostazione: ['σ = F / A.', 'F in N e A in mm²: esce N/mm², cioè MPa.'],
            risposta: { nome: 'σ', valore: s, unita: 'MPa' },
            passi: [['Forza in N', `${f(F)} · 1000`, F * 1000, 'N'], ['Area', `π · ${d}² / 4`, A, 'mm²'], ['Tensione', 'σ = F / A', s, 'MPa']],
            decisione: { domanda: 'Il tirante va bene?', opzioni: MARGINE, giusta: giustaMargine(amm, s) },
            giudizio: `${f(s)} MPa contro 157 ammessi. Ricorda: 1 MPa = 1 N/mm², per questo conviene lavorare sempre in N e mm.`,
          };
        }
        const filetti = [['M8', 36.6], ['M10', 58], ['M12', 84.3], ['M16', 157], ['M20', 245], ['M24', 353]];
        const [nome, As] = R.da(filetti);
        const F = Math.round(As * amm * R.da([0.6, 0.8, 0.95, 1.1, 1.3]) / 100) / 10;
        const s = F * 1000 / As;
        return {
          contesto: `Un tirante filettato ${nome} in S235 porta ${f(F)} kN. Da tabella la sezione resistente del filetto ${nome} è ${f(As)} mm². Sicurezza 1,5 sullo snervamento (σ amm ≈ 157 MPa).`,
          richiesta: 'Tensione nella sezione del filetto, in MPa.',
          dati: [['filetto', nome, ''], ['As', As, 'mm²'], ['F', F, 'kN']],
          impostazione: ['La sezione che cede è quella del filetto, non il diametro nominale.', 'σ = F / As, con F in N.'],
          risposta: { nome: 'σ', valore: s, unita: 'MPa' },
          passi: [['Forza in N', `${f(F)} · 1000`, F * 1000, 'N'], ['Tensione sul filetto', `σ = F / ${f(As)}`, s, 'MPa']],
          decisione: { domanda: 'Il tirante va bene?', opzioni: MARGINE, giusta: giustaMargine(amm, s) },
          giudizio: `${f(s)} MPa. Con il diametro nominale avresti trovato circa il 25–30% in meno: è l'errore classico che fa rompere i tiranti filettati.`,
        };
      },
    },
    {
      id: 'torsione', blocco: 'b3', titolo: 'L\'albero regge la coppia?',
      genera(liv, R) {
        const tamm = R.da([40, 50, 60]);
        if (liv === 3) {
          const P = R.da([1.5, 2.2, 4, 5.5, 7.5, 11]), n = R.da([300, 500, 750, 1000, 1450]);
          const T = P * 1000 / (2 * PI * n / 60);
          const d = Math.cbrt(16 * T * 1000 / (PI * tamm));
          const sc = sceltaCatalogo([12, 14, 16, 18, 20, 22, 25, 28, 30, 35, 40, 45, 50], d, 'mm');
          return {
            contesto: `Devi dimensionare un albero che trasmette ${f(P)} kW a ${n} giri/min. Per tenere conto di fatica e sedi chiavetta usi una τ ammissibile di ${tamm} MPa.`,
            richiesta: 'Diametro minimo dell\'albero, in mm.',
            dati: [['P', P, 'kW'], ['n', n, 'giri/min'], ['τ amm', tamm, 'MPa']],
            impostazione: ['Coppia: T = P / ω, con ω = 2π n / 60.', 'Tensione di torsione: τ = 16 T / (π d³).', 'Ricava d = ∛(16 T / (π τ amm)), con T in N·mm.'],
            risposta: { nome: 'd minimo', valore: d, unita: 'mm' },
            passi: [['Velocità angolare', `ω = 2π · ${n} / 60`, 2 * PI * n / 60, 'rad/s'], ['Coppia', `T = ${f(P * 1000)} / ω`, T, 'N·m'], ['Diametro minimo', 'd = ∛(16 · T · 1000 / (π · τ))', d, 'mm']],
            decisione: { domanda: 'Che diametro scegli?', opzioni: sc.opzioni, giusta: sc.giusta },
            giudizio: `Almeno Ø${f(d)} mm: si fa Ø${sc.valore}. Più giri = meno coppia a parità di potenza: per questo gli alberi lenti dopo il riduttore sono così grossi.`,
          };
        }
        const d = R.da([16, 20, 25, 30, 35, 40]);
        let T, passiT = [], testo;
        if (liv === 1) {
          T = R.tra(20, 400, 10);
          testo = `trasmette una coppia di ${f(T)} N·m`;
        } else {
          const P = R.da([1.1, 2.2, 3, 4, 5.5]), n = R.da([300, 500, 960, 1450]);
          T = P * 1000 / (2 * PI * n / 60);
          testo = `trasmette ${f(P)} kW a ${n} giri/min`;
          passiT = [['Velocità angolare', `ω = 2π · ${n} / 60`, 2 * PI * n / 60, 'rad/s'], ['Coppia', `T = ${f(P * 1000)} / ω`, T, 'N·m']];
        }
        const tau = 16 * T * 1000 / (PI * d * d * d);
        return {
          contesto: `Un albero pieno Ø${d} mm ${testo}. Il progettista ha fissato τ ammissibile = ${tamm} MPa.`,
          richiesta: 'Tensione tangenziale massima, in MPa.',
          dati: [['d', d, 'mm'], ...(liv === 1 ? [['T', T, 'N·m']] : []), ['τ amm', tamm, 'MPa']],
          impostazione: [...(liv === 1 ? [] : ['Prima la coppia: T = P / ω.']), 'τ = 16 · T / (π · d³).', 'T in N·mm (× 1000) e d in mm: esce MPa.'],
          risposta: { nome: 'τ', valore: tau, unita: 'MPa' },
          passi: [...passiT, ['Coppia in N·mm', `${f(T)} · 1000`, T * 1000, 'N·mm'], ['Tensione di torsione', `τ = 16 · T / (π · ${d}³)`, tau, 'MPa']],
          decisione: { domanda: 'L\'albero va bene?', opzioni: MARGINE, giusta: giustaMargine(tamm, tau) },
          giudizio: `${f(tau)} MPa contro ${tamm} ammessi. Il diametro conta al cubo: passare da Ø${d} a Ø${d + 5} riduce la tensione del ${f((1 - Math.pow(d / (d + 5), 3)) * 100)}%.`,
        };
      },
    },
    {
      id: 'flessione', blocco: 'b3', titolo: 'La barra si piega troppo?',
      genera(liv, R) {
        const amm = 157;
        if (liv === 3) {
          const L = R.da([800, 1000, 1200, 1500]), F = R.tra(2, 12, 0.5), b = R.da([20, 25, 30, 40]);
          const M = F * 1000 * L / 4;
          const h = Math.sqrt(6 * M / (b * amm));
          const sc = sceltaCatalogo([30, 40, 50, 60, 70, 80, 100, 120], h, 'mm');
          return {
            contesto: `Una barra piatta in S235, appoggiata agli estremi con luce ${L} mm, porta ${f(F)} kN in mezzeria. Lo spessore è ${b} mm e la metti di costa: devi scegliere l'altezza. σ ammissibile 157 MPa.`,
            richiesta: 'Altezza minima della sezione, in mm.',
            dati: [['L', L, 'mm'], ['F', F, 'kN'], ['b', b, 'mm'], ['σ amm', amm, 'MPa']],
            impostazione: ['Momento massimo in mezzeria: M = F · L / 4.', 'Rettangolo: W = b · h² / 6.', 'σ = M / W ≤ σ amm, quindi h = √(6M / (b σ amm)).'],
            risposta: { nome: 'h minima', valore: h, unita: 'mm' },
            passi: [['Momento massimo', `M = ${f(F * 1000)} · ${L} / 4`, M, 'N·mm'], ['Altezza minima', `h = √(6M / (${b} · 157))`, h, 'mm']],
            decisione: { domanda: 'Che piatto scegli?', opzioni: sc.opzioni.map((o) => `${b} × ${o}`), giusta: sc.giusta },
            giudizio: `Almeno ${f(h)} mm di altezza: si prende ${b} × ${sc.valore}. Di costa l'altezza conta al quadrato: la stessa barra messa di piatto reggerebbe ${f(sc.valore / b)} volte meno.`,
          };
        }
        const b = R.da([20, 30, 40, 50]), h = R.da([40, 50, 60, 80]);
        let M, passiM = [], testo;
        if (liv === 1) {
          M = R.tra(200, 3000, 50);
          testo = `Nella sezione più caricata c'è un momento flettente di ${f(M)} N·m.`;
        } else {
          const L = R.da([600, 800, 1000, 1200]), F = R.tra(2, 15, 0.5);
          M = F * 1000 * L / 4 / 1000;
          testo = `È appoggiata agli estremi con luce ${L} mm e porta ${f(F)} kN in mezzeria.`;
          passiM = [['Momento massimo in mezzeria', `M = ${f(F * 1000)} · ${L} / 4 / 1000`, M, 'N·m']];
        }
        const W = b * h * h / 6, s = M * 1000 / W;
        return {
          contesto: `Una barra rettangolare in S235, ${b} mm di spessore e ${h} mm di altezza, è messa di costa (altezza verticale). ${testo} σ ammissibile 157 MPa.`,
          richiesta: 'Tensione massima di flessione, in MPa.',
          dati: [['b', b, 'mm'], ['h', h, 'mm'], ...(liv === 1 ? [['M', M, 'N·m']] : [])],
          impostazione: [...(liv === 1 ? [] : ['Trave appoggiata con carico in mezzo: M max = F · L / 4.']), 'Modulo di resistenza del rettangolo: W = b · h² / 6.', 'σ = M / W, con M in N·mm.'],
          risposta: { nome: 'σ', valore: s, unita: 'MPa' },
          passi: [...passiM, ['Modulo di resistenza', `W = ${b} · ${h}² / 6`, W, 'mm³'], ['Tensione', `σ = ${f(M * 1000)} / W`, s, 'MPa']],
          decisione: { domanda: 'La barra va bene?', opzioni: MARGINE, giusta: giustaMargine(amm, s) },
          giudizio: `${f(s)} MPa contro 157. Girata di piatto avrebbe W = ${f(h * b * b / 6)} mm³ e la tensione salirebbe a ${f(M * 1000 / (h * b * b / 6))} MPa.`,
        };
      },
    },

    // ---------------- BLOCCO 5 ----------------
    {
      id: 'ingranaggi', blocco: 'b5', titolo: 'Che giri e che coppia escono dagli ingranaggi?',
      genera(liv, R) {
        const n1 = R.da([1400, 1450, 2850, 960]);
        if (liv === 3) {
          const P = R.da([0.75, 1.1, 1.5, 2.2, 3]), z1 = R.da([15, 17, 19]), z2 = R.da([51, 57, 63]), z3 = R.da([16, 18, 20]), z4 = R.da([60, 64, 72]), eta = 0.97;
          const n = n1 * (z1 / z2) * (z3 / z4);
          const w = 2 * PI * n / 60;
          const C = P * 1000 * eta * eta / w;
          return {
            contesto: `Un motore da ${f(P)} kW a ${n1} giri/min muove un riduttore a due stadi: primo stadio ${z1}/${z2} denti, secondo ${z3}/${z4}. Ogni coppia di ruote ha rendimento 0,97.`,
            richiesta: 'Coppia all\'albero di uscita, in N·m.',
            dati: [['P', P, 'kW'], ['n motore', n1, 'giri/min'], ['stadio 1', `${z1}/${z2}`, ''], ['stadio 2', `${z3}/${z4}`, ''], ['η per stadio', eta, '']],
            impostazione: ['Rapporto totale: il prodotto dei due rapporti.', 'n uscita = n motore · (z1/z2) · (z3/z4).', 'Potenza in uscita: P · η · η (due stadi).', 'C = P uscita / ω uscita.'],
            risposta: { nome: 'C uscita', valore: C, unita: 'N·m' },
            passi: [['Giri in uscita', `${n1} · ${z1}/${z2} · ${z3}/${z4}`, n, 'giri/min'], ['Velocità angolare', 'ω = 2π n / 60', w, 'rad/s'], ['Potenza in uscita', `${f(P * 1000)} · 0,97²`, P * 1000 * eta * eta, 'W'], ['Coppia in uscita', 'C = P / ω', C, 'N·m']],
            giudizio: `${f(C)} N·m a ${f(n)} giri/min. I rendimenti si moltiplicano: con 3–4 stadi le perdite non sono più trascurabili e il riduttore scalda.`,
          };
        }
        const z1 = R.da([14, 16, 18, 20, 22]), z2 = R.da([40, 45, 50, 56, 63, 71]);
        const n2 = n1 * z1 / z2;
        if (liv === 1) {
          return {
            contesto: `Un pignone da ${z1} denti, calettato su un motore a ${n1} giri/min, ingrana con una ruota da ${z2} denti.`,
            richiesta: 'Giri al minuto della ruota condotta.',
            dati: [['z1', z1, ''], ['z2', z2, ''], ['n1', n1, 'giri/min']],
            impostazione: ['Nel punto di contatto le due ruote hanno la stessa velocità: n1 · z1 = n2 · z2.', 'La ruota più grande gira più piano.'],
            risposta: { nome: 'n2', valore: n2, unita: 'giri/min' },
            passi: [['Rapporto di trasmissione', `i = ${z2} / ${z1}`, z2 / z1, ''], ['Giri della ruota', `n2 = ${n1} / i`, n2, 'giri/min']],
            giudizio: `${f(n2)} giri/min: riduzione ${f(z2 / z1)}. Quanto perdi in giri, lo guadagni in coppia (meno il rendimento).`,
          };
        }
        const C1 = R.tra(5, 60, 1), eta = 0.97;
        const C2 = C1 * (z2 / z1) * eta;
        return {
          contesto: `Un pignone da ${z1} denti riceve ${f(C1)} N·m e ingrana con una ruota da ${z2} denti. Rendimento della coppia di ruote 0,97.`,
          richiesta: 'Coppia sulla ruota condotta, in N·m.',
          dati: [['z1', z1, ''], ['z2', z2, ''], ['C1', C1, 'N·m'], ['η', eta, '']],
          impostazione: ['La forza sul dente è la stessa per le due ruote: la coppia cresce con il raggio, cioè con i denti.', 'C2 = C1 · (z2 / z1) · η.'],
          risposta: { nome: 'C2', valore: C2, unita: 'N·m' },
          passi: [['Rapporto', `i = ${z2} / ${z1}`, z2 / z1, ''], ['Coppia teorica', `C1 · i`, C1 * z2 / z1, 'N·m'], ['Coppia reale', '· 0,97', C2, 'N·m']],
          giudizio: `${f(C2)} N·m. Controllo di buon senso: potenza in uscita = potenza in ingresso · η. Se ti esce più potenza in uscita, c'è un errore.`,
        };
      },
    },
    {
      id: 'attrito', blocco: 'b5', titolo: 'Quanta forza serve per spingere la cassa?',
      genera(liv, R) {
        const m = R.tra(50, 400, 10), mu = R.da([0.15, 0.2, 0.25, 0.3, 0.4]);
        if (liv === 1) {
          const F = mu * m * G;
          return {
            contesto: `Una cassa di ${m} kg va spinta sul pavimento del magazzino. Il coefficiente d'attrito tra cassa e pavimento è ${f(mu)}.`,
            richiesta: 'Forza orizzontale per farla scorrere a velocità costante, in N.',
            dati: [['m', m, 'kg'], ['μ', mu, '']],
            impostazione: ['A velocità costante la spinta uguaglia l\'attrito.', 'Attrito = μ · N, e sul piano N = m · g.'],
            risposta: { nome: 'F', valore: F, unita: 'N' },
            passi: [['Forza normale', `N = ${m} · 9,81`, m * G, 'N'], ['Attrito', `F = ${f(mu)} · N`, F, 'N']],
            giudizio: `${f(F)} N. Una persona spinge in modo continuativo circa 200–250 N: ${F > 250 ? 'qui serve un transpallet o un carrello.' : 'ce la fa, ma per spostamenti frequenti meglio le ruote.'}`,
          };
        }
        const th = R.da([5, 8, 10, 12, 15, 20]);
        const t = th * PI / 180;
        if (liv === 2) {
          const F = m * G * (Math.sin(t) + mu * Math.cos(t));
          return {
            contesto: `Una cassa di ${m} kg va spinta su per una rampa inclinata di ${th}°, con una forza parallela alla rampa. Coefficiente d'attrito ${f(mu)}.`,
            richiesta: 'Forza per farla salire a velocità costante, in N.',
            dati: [['m', m, 'kg'], ['θ', th, '°'], ['μ', mu, '']],
            impostazione: ['Scomponi il peso: lungo la rampa m g sin θ, perpendicolare m g cos θ.', 'L\'attrito vale μ · m g cos θ e si oppone alla salita.', 'F = m g (sin θ + μ cos θ).'],
            risposta: { nome: 'F', valore: F, unita: 'N' },
            passi: [['Peso', `${m} · 9,81`, m * G, 'N'], ['Componente lungo la rampa', 'W · sin θ', m * G * Math.sin(t), 'N'], ['Attrito', 'μ · W · cos θ', mu * m * G * Math.cos(t), 'N'], ['Forza totale', 'somma', F, 'N']],
            giudizio: `${f(F)} N, contro ${f(mu * m * G)} N in piano. Anche pochi gradi pesano: è per questo che le rampe di carico stanno sotto il 10%.`,
          };
        }
        const muMin = Math.tan(t);
        return {
          contesto: `Una cassa di ${m} kg è appoggiata su un piano inclinato di ${th}° (uno scivolo di una linea). Vuoi che resti ferma da sola senza fermi, finché qualcuno non la spinge. Tra cassa e scivolo il coefficiente d'attrito è ${f(mu)}.`,
          richiesta: 'Coefficiente d\'attrito minimo perché la cassa resti ferma da sola.',
          dati: [['θ', th, '°'], ['μ disponibile', mu, '']],
          impostazione: ['Al limite: componente lungo il piano = attrito massimo.', 'm g sin θ = μ m g cos θ, la massa si semplifica.', 'μ min = tan θ.'],
          risposta: { nome: 'μ min', valore: muMin, unita: '' },
          passi: [['Condizione di aderenza', 'μ ≥ tan θ', muMin, '']],
          decisione: { domanda: `Con μ = ${f(mu)} la cassa resta ferma?`, opzioni: ['Sì, resta ferma', 'No, scivola'], giusta: mu >= muMin ? 0 : 1 },
          giudizio: `Serve μ ≥ ${f(muMin)}: con ${f(mu)} la cassa ${mu >= muMin ? 'resta ferma, ma basta un po\' d\'olio o vibrazioni per farla partire' : 'scivola: servono un fermo o un piano meno inclinato'}. La massa non conta: è lo stesso principio delle viti autobloccanti.`,
        };
      },
    },

    // ---------------- BLOCCO 6 ----------------
    {
      id: 'cuscinetto', blocco: 'b6', titolo: 'Quanto dura il cuscinetto?',
      genera(liv, R) {
        const P = R.tra(1, 8, 0.5), n = R.da([300, 750, 1000, 1450, 3000]);
        if (liv === 3) {
          const ore = R.da([10000, 20000, 30000, 40000]);
          const L = ore * 60 * n / 1e6;
          const C = P * Math.cbrt(L);
          return {
            contesto: `Devi scegliere un cuscinetto a sfere per un albero a ${n} giri/min con carico equivalente ${f(P)} kN. La macchina deve durare ${f(ore)} ore di lavoro.`,
            richiesta: 'Coefficiente di carico dinamico minimo C, in kN.',
            dati: [['P', P, 'kN'], ['n', n, 'giri/min'], ['durata', ore, 'ore']],
            impostazione: ['Durata in milioni di giri: L10 = ore · 60 · n / 10⁶.', 'Sfere: L10 = (C / P)³.', 'Quindi C = P · ∛L10.'],
            risposta: { nome: 'C minimo', valore: C, unita: 'kN' },
            passi: [['Durata in milioni di giri', `${f(ore)} · 60 · ${n} / 10⁶`, L, 'milioni di giri'], ['Carico dinamico minimo', `C = ${f(P)} · ∛L10`, C, 'kN']],
            giudizio: `Serve C ≥ ${f(C)} kN: sul catalogo cerchi un cuscinetto con quel C e il foro del tuo albero. Raddoppiare la durata chiede solo il 26% di C in più (radice cubica).`,
          };
        }
        const C = Math.round(P * R.da([4, 5, 6, 8, 10]) * 10) / 10;
        const L = Math.pow(C / P, 3);
        if (liv === 1) {
          return {
            contesto: `Un cuscinetto a sfere ha coefficiente di carico dinamico C = ${f(C)} kN e lavora con un carico equivalente P = ${f(P)} kN.`,
            richiesta: 'Durata base L10, in milioni di giri.',
            dati: [['C', C, 'kN'], ['P', P, 'kN']],
            impostazione: ['Per i cuscinetti a sfere: L10 = (C / P)³ milioni di giri.', 'L10 è la durata che raggiunge il 90% dei cuscinetti.'],
            risposta: { nome: 'L10', valore: L, unita: 'milioni di giri' },
            passi: [['Rapporto C / P', `${f(C)} / ${f(P)}`, C / P, ''], ['Durata', '(C / P)³', L, 'milioni di giri']],
            giudizio: `${f(L)} milioni di giri. Il carico conta al cubo: se P raddoppia, la durata diventa un ottavo.`,
          };
        }
        const h = L * 1e6 / (60 * n);
        const req = R.da([10000, 20000, 30000]);
        return {
          contesto: `Un cuscinetto a sfere con C = ${f(C)} kN lavora a ${n} giri/min con carico equivalente ${f(P)} kN. Il cliente vuole almeno ${f(req)} ore.`,
          richiesta: 'Durata in ore di lavoro.',
          dati: [['C', C, 'kN'], ['P', P, 'kN'], ['n', n, 'giri/min'], ['richiesta', req, 'ore']],
          impostazione: ['L10 = (C / P)³ in milioni di giri.', 'Ore = L10 · 10⁶ / (60 · n).'],
          risposta: { nome: 'L10h', valore: h, unita: 'ore' },
          passi: [['Durata in milioni di giri', `(${f(C)} / ${f(P)})³`, L, 'milioni di giri'], ['Durata in ore', `L10 · 10⁶ / (60 · ${n})`, h, 'ore']],
          decisione: { domanda: 'Il cuscinetto basta?', opzioni: MARGINE, giusta: giustaMargine(h, req) },
          giudizio: `${f(h)} ore contro ${f(req)} richieste. Lubrificazione e pulizia contano quanto il calcolo: la maggior parte dei cuscinetti muore per sporco o grasso sbagliato.`,
        };
      },
    },

    // ---------------- BLOCCO 7 ----------------
    {
      id: 'accoppiamento', blocco: 'b7', titolo: 'Che gioco c\'è tra albero e foro?',
      genera(liv, R) {
        const tab = [
          { D: 25, H7: [0, 21], g6: [-20, -7], h6: [-13, 0], k6: [2, 15], p6: [22, 35] },
          { D: 40, H7: [0, 25], g6: [-25, -9], h6: [-16, 0], k6: [2, 18], p6: [26, 42] },
          { D: 60, H7: [0, 30], g6: [-29, -10], h6: [-19, 0], k6: [2, 21], p6: [32, 51] },
        ];
        const t = R.da(tab);
        if (liv === 3) {
          const imax = t.p6[1] - t.H7[0];
          const extra = 20;
          const dT = (imax + extra) / 1000 / (12e-6 * t.D);
          return {
            contesto: `Devi montare a caldo un mozzo d'acciaio con foro Ø${t.D} H7 (${t.H7[0]}/+${t.H7[1]} µm) su un albero Ø${t.D} p6 (+${t.p6[0]}/+${t.p6[1]} µm). Per infilarlo a mano vuoi ${extra} µm di gioco anche nel caso peggiore. α acciaio 12·10⁻⁶ 1/°C.`,
            richiesta: 'Di quanti gradi devi scaldare il mozzo, in °C?',
            dati: [['D', t.D, 'mm'], ['foro H7', `${t.H7[0]}/+${t.H7[1]}`, 'µm'], ['albero p6', `+${t.p6[0]}/+${t.p6[1]}`, 'µm'], ['gioco di montaggio', extra, 'µm']],
            impostazione: ['Caso peggiore: albero al massimo, foro al minimo → interferenza massima.', 'Il foro deve crescere di: interferenza massima + gioco di montaggio.', 'ΔD = α · D · ΔT, quindi ΔT = ΔD / (α · D), con ΔD in mm.'],
            risposta: { nome: 'ΔT', valore: dT, unita: '°C' },
            passi: [['Interferenza massima', `${t.p6[1]} − ${t.H7[0]}`, imax, 'µm'], ['Crescita del foro necessaria', `${imax} + ${extra}`, imax + extra, 'µm'], ['Salto di temperatura', `ΔT = ${f((imax + extra) / 1000)} / (12·10⁻⁶ · ${t.D})`, dT, '°C']],
            giudizio: `Circa ${f(dT)} °C sopra l'ambiente. Sopra i 200–250 °C si rischia di rovinare il trattamento termico: in quel caso meglio raffreddare l'albero (azoto) o ridurre l'interferenza.`,
          };
        }
        const tipo = liv === 1 ? R.da(['g6', 'h6']) : R.da(['g6', 'k6', 'p6']);
        const a = t[tipo];
        const gmax = t.H7[1] - a[0];
        const gmin = t.H7[0] - a[1];
        const segna = (v) => (v > 0 ? '+' : '') + v;
        const base = {
          contesto: `Dal disegno: foro Ø${t.D} H7 (${t.H7[0]}/+${t.H7[1]} µm), albero Ø${t.D} ${tipo} (${segna(a[0])}/${segna(a[1])} µm).`,
          dati: [['D', t.D, 'mm'], ['foro H7', `${t.H7[0]}/+${t.H7[1]}`, 'µm'], [`albero ${tipo}`, `${segna(a[0])}/${segna(a[1])}`, 'µm']],
        };
        if (liv === 1) {
          return Object.assign(base, {
            richiesta: 'Gioco massimo, in µm.',
            impostazione: ['Gioco = foro − albero.', 'Il gioco massimo viene con il foro più grande e l\'albero più piccolo.', 'Gioco max = scostamento superiore del foro − scostamento inferiore dell\'albero.'],
            risposta: { nome: 'gioco max', valore: gmax, unita: 'µm' },
            passi: [['Foro più grande', `+${t.H7[1]}`, t.H7[1], 'µm'], ['Albero più piccolo', segna(a[0]), a[0], 'µm'], ['Gioco massimo', `${t.H7[1]} − (${a[0]})`, gmax, 'µm']],
            giudizio: `Gioco massimo ${gmax} µm, minimo ${gmin} µm. H7/${tipo} è ${tipo === 'g6' ? 'un accoppiamento con gioco: va bene per parti che devono scorrere o ruotare.' : 'il classico accoppiamento di posizionamento: si monta a mano ma senza giochi visibili.'}`,
          });
        }
        const tipoAcc = gmin > 0 ? 0 : gmax < 0 ? 2 : 1;
        return Object.assign(base, {
          richiesta: 'Gioco minimo, in µm (negativo se è interferenza).',
          impostazione: ['Gioco minimo: foro più piccolo, albero più grande.', 'Gioco min = scostamento inferiore del foro − scostamento superiore dell\'albero.', 'Se esce negativo è interferenza: l\'albero è più grosso del foro.'],
          risposta: { nome: 'gioco min', valore: gmin, unita: 'µm' },
          passi: [['Foro più piccolo', `${t.H7[0]}`, t.H7[0], 'µm'], ['Albero più grande', segna(a[1]), a[1], 'µm'], ['Gioco minimo', `${t.H7[0]} − (${segna(a[1])})`, gmin, 'µm'], ['Gioco massimo', `${t.H7[1]} − (${segna(a[0])})`, gmax, 'µm']],
          decisione: { domanda: 'Che accoppiamento è?', opzioni: ['Con gioco', 'Incerto', 'Con interferenza'], giusta: tipoAcc },
          giudizio: `Gioco da ${gmin} a ${gmax} µm: ${['sempre gioco, le parti scorrono.', 'a volte gioco, a volte interferenza: si monta con un colpo di mazzuolo o una pressa leggera.', 'sempre interferenza: si monta a pressa o a caldo e trasmette coppia da solo.'][tipoAcc]}`,
        });
      },
    },

    // ---------------- BLOCCO 8 ----------------
    {
      id: 'calore', blocco: 'b8', titolo: 'Quanto ci vuole a scaldare l\'acqua?',
      genera(liv, R) {
        const c = 4.186;
        if (liv === 3) {
          const P = R.da([5, 8, 12, 20, 30]), dT = R.da([4, 5, 6, 8, 10]);
          const mdot = P / (c * dT);
          const lmin = mdot * 60;
          return {
            contesto: `Uno stampo deve smaltire ${P} kW di calore con acqua di raffreddamento. L'acqua può scaldarsi al massimo di ${dT} °C tra ingresso e uscita.`,
            richiesta: 'Portata d\'acqua necessaria, in litri al minuto.',
            dati: [['P', P, 'kW'], ['ΔT acqua', dT, '°C'], ['c acqua', c, 'kJ/(kg·°C)']],
            impostazione: ['Il calore portato via: P = ṁ · c · ΔT.', 'ṁ = P / (c · ΔT): con P in kW e c in kJ/(kg·°C) esce kg/s.', 'Per l\'acqua 1 kg ≈ 1 litro: moltiplica per 60.'],
            risposta: { nome: 'portata', valore: lmin, unita: 'l/min' },
            passi: [['Portata in massa', `ṁ = ${P} / (4,186 · ${dT})`, mdot, 'kg/s'], ['In litri al minuto', 'ṁ · 60', lmin, 'l/min']],
            giudizio: `Circa ${f(lmin)} l/min. Se la pompa ne dà meno, l'acqua esce più calda e lo stampo si scalda: dimezzare la portata raddoppia il ΔT.`,
          };
        }
        const V = R.da([50, 80, 100, 150, 200, 300]), t1 = R.da([10, 12, 15]), t2 = R.da([45, 50, 55, 60]);
        const Q = V * c * (t2 - t1);
        if (liv === 1) {
          return {
            contesto: `Un serbatoio contiene ${V} litri d'acqua a ${t1} °C da portare a ${t2} °C per un lavaggio pezzi.`,
            richiesta: 'Energia necessaria, in kJ.',
            dati: [['V', V, 'litri'], ['t iniziale', t1, '°C'], ['t finale', t2, '°C'], ['c', c, 'kJ/(kg·°C)']],
            impostazione: ['Per l\'acqua 1 litro ≈ 1 kg.', 'Q = m · c · ΔT.'],
            risposta: { nome: 'Q', valore: Q, unita: 'kJ' },
            passi: [['Massa', `${V} litri ≈ ${V} kg`, V, 'kg'], ['Salto di temperatura', `${t2} − ${t1}`, t2 - t1, '°C'], ['Energia', `Q = ${V} · 4,186 · ${t2 - t1}`, Q, 'kJ'], ['In kWh', 'Q / 3600', Q / 3600, 'kWh']],
            giudizio: `${f(Q)} kJ, cioè ${f(Q / 3600)} kWh. Passare a kWh serve per capire quanto costa: moltiplica per il prezzo dell'energia.`,
          };
        }
        const P = R.da([2, 3, 4.5, 6, 9]), eta = 0.9;
        const tmin = Q / (P * eta) / 60;
        return {
          contesto: `Un serbatoio di ${V} litri d'acqua a ${t1} °C va portato a ${t2} °C con una resistenza da ${f(P)} kW. Tra dispersioni e serbatoio, solo il 90% del calore va all'acqua. Il turno parte tra un'ora.`,
          richiesta: 'Tempo di riscaldamento, in minuti.',
          dati: [['V', V, 'litri'], ['t1', t1, '°C'], ['t2', t2, '°C'], ['P', P, 'kW'], ['η', eta, '']],
          impostazione: ['Energia: Q = m · c · ΔT, in kJ.', 'kW = kJ/s: tempo = Q / (P · η) in secondi.', 'Dividi per 60.'],
          risposta: { nome: 't', valore: tmin, unita: 'min' },
          passi: [['Energia', `Q = ${V} · 4,186 · ${t2 - t1}`, Q, 'kJ'], ['Potenza utile', `${f(P)} · 0,9`, P * eta, 'kW'], ['Tempo in secondi', 'Q / P utile', Q / (P * eta), 's'], ['Tempo in minuti', '/ 60', tmin, 'min']],
          decisione: { domanda: 'È pronto per l\'inizio del turno, tra un\'ora?', opzioni: ['Sì', 'No'], giusta: tmin <= 60 ? 0 : 1 },
          giudizio: `${f(tmin)} minuti. ${tmin > 60 ? 'Non ce la fa: serve accenderlo prima con un timer, o una resistenza più potente.' : 'Ce la fa. Un timer che lo accende in automatico evita di tenerlo caldo tutta la notte.'}`,
        };
      },
    },
  ];

  const TEST = [
    { id: 't01', domanda: '6 bar quanti MPa sono?', risposta: 0.6, unita: 'MPa', tolleranza: 0.02 },
    { id: 't02', domanda: 'Area di un cerchio di diametro 50 mm, in mm²?', risposta: 1963.5, unita: 'mm²', tolleranza: 0.02 },
    { id: 't03', domanda: 'Peso di una massa di 500 kg, in N (g = 9,81 m/s²)?', risposta: 4905, unita: 'N', tolleranza: 0.02 },
    { id: 't04', domanda: 'cos 30° (con 3 decimali)?', risposta: 0.866, unita: '', tolleranza: 0.01 },
    { id: 't05', domanda: 'Un motore gira a 1450 giri/min. Velocità angolare in rad/s?', risposta: 151.8, unita: 'rad/s', tolleranza: 0.02 },
    { id: 't06', domanda: 'Forza di 200 N con braccio di 0,3 m: momento in N·m?', risposta: 60, unita: 'N·m', tolleranza: 0.02 },
    { id: 't07', domanda: 'Barra tonda Ø20 mm tirata con 31,4 kN: tensione normale in MPa?', risposta: 100, unita: 'MPa', tolleranza: 0.03 },
    { id: 't08', domanda: 'Potenza 3 kW, coppia 20 N·m: velocità angolare in rad/s?', risposta: 150, unita: 'rad/s', tolleranza: 0.02 },
    { id: 't09', domanda: 'Energia cinetica di 8 kg a 0,8 m/s, in J?', risposta: 2.56, unita: 'J', tolleranza: 0.02 },
    { id: 't10', domanda: 'Molla con k = 12 N/mm compressa di 25 mm: forza in N?', risposta: 300, unita: 'N', tolleranza: 0.02 },
    { id: 't11', domanda: 'Modulo elastico tipico dell\'acciaio, in GPa?', risposta: 210, unita: 'GPa', tolleranza: 0.05 },
    { id: 't12', domanda: 'Quanti mm³ ci sono in un litro?', risposta: 1000000, unita: 'mm³', tolleranza: 0.01 },
  ];

  window.MECCANICA = { versione: '2026-11-21', BLOCCHI, MODELLI, TEST, f };
})();
