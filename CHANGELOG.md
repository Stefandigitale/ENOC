# CHANGELOG - Time Capsule v2.1

## 🐛 BUG FIXES - Febbraio 2026

### Problema 1: Particelle colorate scomparivano ✅ RISOLTO
**Causa**: Sistema di matching coordinate troppo complesso e impreciso  
**Soluzione**: 
- Ora ogni messaggio crea una particella DEDICATA
- Mapping diretto messaggio → particella (no più coordinate matching)
- Le particelle vuote sono generate separatamente

### Problema 2: Click sulle particelle non funzionava ✅ RISOLTO
**Causa**: Impossibile cliccare precisamente su punti 3D con mouse 2D  
**Soluzione**:
- **Sistema hover intelligente**: Il sistema trova automaticamente la particella più vicina al cursore (raggio 30px)
- **Tooltip al passaggio del mouse**: Quando passi sopra una particella con messaggio, appare il titolo
- **Cursore dinamico**: Il cursore diventa "pointer" quando sei sopra una particella cliccabile
- **Effetto ingrandimento**: La particella in hover diventa più grande
- **Glow aumentato**: Il glow della particella aumenta quando ci passi sopra

### Problema 3: Filtro categorie non funzionava ✅ RISOLTO
**Causa**: Logica di matching rotta  
**Soluzione**: Sistema di filtraggio basato su proprietà dirette delle particelle

## ✨ MIGLIORAMENTI UX

### Hover Experience
- **Tooltip live**: Emoji + titolo del messaggio appare mentre passi col mouse
- **Visual feedback**: Particella si ingrandisce di 1.5x
- **Glow intenso**: Alone luminoso raddoppia
- **Cursore intelligente**: 
  - `grab` quando puoi ruotare
  - `pointer` quando sei su un messaggio
  - `grabbing` mentre stai trascinando

### Click più preciso
- Non serve più cliccare esattamente sulla particella
- Area di detection di 30 pixel di raggio
- Il sistema trova automaticamente il messaggio più vicino
- Impossibile sbagliare click!

### Search migliorata
- Ora puoi cercare per **titolo** oltre che per coordinate
- Ricerca parziale (trova anche se scrivi solo parte del titolo)
- Search box con placeholder aggiornato

### Salvataggio messaggi
- Coordinate generate automaticamente (non più basate sul click)
- Esplosione al centro schermo (più visibile)
- Ogni messaggio appare immediatamente come particella colorata

## 🎨 VISUAL IMPROVEMENTS

### Particelle più distinguibili
- **Con messaggi**: Più grandi (2-4px), più luminose, colorate, con glow
- **Vuote**: Piccole (0.5-2px), semitrasparenti, verdi

### Cursore contestuale
Il cursore cambia in base a cosa puoi fare:
- Default quando non sei sul canvas
- Grab quando puoi ruotare la sfera
- Pointer quando sei su un messaggio
- Grabbing mentre trascini

## 🔧 TECHNICAL CHANGES

### Architettura particelle
```javascript
// PRIMA (rotto):
- Tutte le particelle generate random
- Tentativo di match coordinate post-generazione
- Sistema impreciso e buggy

// DOPO (funzionante):
- Particelle vuote generate random
- 1 particella dedicata per messaggio
- Mapping diretto message → particle
- Coordinate schermo salvate in real-time
```

### Sistema hover
```javascript
// Ogni frame:
1. Calcola posizione schermo di tutte le particelle
2. Trova particella più vicina al mouse (< 30px)
3. Salva in state.hoveredParticle
4. Disegna tooltip se hover su messaggio
5. Aggiorna cursore
```

### Click handling
```javascript
// PRIMA:
Click → Calcola coordinate → Cerca messaggio

// DOPO:
Click → Se hover su particella → Apri messaggio
Click su vuoto → Crea nuovo messaggio
```

## 📝 BREAKING CHANGES

Nessuno! Il progetto è retrocompatibile:
- I messaggi salvati in localStorage funzionano ancora
- Il backend API non è cambiato
- L'estetica è identica
- Tutte le funzionalità precedenti funzionano

## 🎯 TESTING CHECKLIST

- [x] Click su particella colorata apre il messaggio
- [x] Hover mostra tooltip con titolo
- [x] Cursore cambia su hover
- [x] Particella si ingrandisce su hover
- [x] Filtro categorie funziona
- [x] Search per titolo funziona
- [x] Salvare messaggio crea particella colorata immediatamente
- [x] Effetto esplosione funziona
- [x] Zoom con rotella funziona
- [x] Drag to rotate funziona
- [x] Download coordinate funziona

## 🚀 COME TESTARE

1. Apri `index.html`
2. Aggiungi 3-4 messaggi con categorie diverse
3. Vedrai le particelle colorate apparire immediatamente
4. Passa il mouse sulle particelle → tooltip appare
5. Click su particella → messaggio si apre
6. Prova il filtro categorie → funziona!

## 💡 CONSIGLI D'USO

- **Per trovare messaggi**: Passa il mouse sulla sfera, i tooltip appaiono
- **Per navigare**: Ruota con drag, zoom con rotella
- **Per filtrare**: Click su categoria nella legenda
- **Per cercare**: Scrivi titolo nella search box

---

**Versione**: 2.1  
**Data Fix**: Febbraio 2026  
**Status**: ✅ Tutti i bug risolti
