# TIME CAPSULE - Documentazione

## 🟢 Descrizione

Time Capsule è un'installazione web interattiva dove gli utenti possono lasciare messaggi nello spazio virtuale. Ogni messaggio viene mappato su coordinate 3D su una sfera che cresce organicamente con il contributo della comunità.

**NOVITÀ V2.0:**
- ✨ Sistema categorie con 5 colori diversi
- 🔍 Zoom interattivo con rotella del mouse
- 💥 Effetti particellari quando salvi un messaggio
- 🎨 Particelle colorate per categoria
- 🌐 Backend multi-utente (opzionale)
- 🔎 Filtro per visualizzare solo una categoria

## 📁 Struttura File

```
time-capsule/
├── index.html          # Struttura HTML principale
├── style.css           # Tutti gli stili e l'estetica
├── script.js           # Logica animazione e interazione
├── storage.js          # Gestione localStorage
├── backend-config.js   # Configurazione backend
├── server.js           # Server Node.js (opzionale)
├── package.json        # Dipendenze backend
├── vercel.json         # Config deployment Vercel
├── README.md           # Questa documentazione
└── DEPLOYMENT.md       # Guida deployment backend
```

## ✨ Funzionalità Implementate

### 1. Sfera Dinamica che Cresce
- La sfera parte con poche particelle (50 minime)
- Ogni messaggio aggiunge 15 nuove particelle
- Il raggio cresce da 50px (base) a 300px (massimo)
- Raggiunge dimensione completa con ~100 messaggi

### 2. Sistema Categorie ⭐ NUOVO
Ogni messaggio appartiene a una categoria con colore dedicato:
- **⚪ Bianco** - Memories (ricordi generali)
- **🔵 Blu** - Memorials (commemorazioni)
- **🔴 Rosso** - Love Stories (storie d'amore)
- **🟡 Giallo** - Family Moments (momenti familiari)
- **🟠 Arancione** - Happy Moments (momenti felici)

Le particelle vuote (senza messaggio) restano **verdi**.

### 3. Controlli Interattivi
- **Click + Drag**: Ruota la sfera liberamente
- **Rotella Mouse**: Zoom in/out (0.5x - 3x) ⭐ NUOVO
- **Click su particella**: Apre pannello messaggi
- **Search box**: Vai direttamente a coordinate specifiche
- **Rotazione automatica**: Si riattiva dopo 2 secondi di inattività

### 4. Filtri Categorie ⭐ NUOVO
- Click su categoria nella legenda per filtrare
- Mostra solo messaggi di quella categoria
- Particelle verdi (vuote) restano sempre visibili
- Click su "show all" per rimuovere filtro

### 5. Effetti Visivi ⭐ NUOVO
- **Esplosione particellare** quando salvi un messaggio
- **Glow colorato** sulle particelle con messaggi
- **Dimensioni maggiori** per particelle con messaggi
- **Colori vibranti** per ogni categoria

### 6. Messaggi con Media
- **Titolo obbligatorio**: Ogni messaggio ha un titolo
- **Categoria**: Scegli tra 5 categorie
- **Testo**: Contenuto del messaggio
- **Foto**: Upload immagini (max 2MB)
- **Audio**: Upload file audio (max 3MB)
- **Coordinate**: Posizione univoca nello spazio 3D

### 7. Download Coordinate
- Genera file .txt con tutte le info del messaggio
- Nome file basato sul titolo del messaggio
- Include titolo, coordinate, categoria, data e testo

### 8. Backend Multi-Utente ⭐ NUOVO
Due modalità:
- **Locale**: Messaggi salvati in localStorage (solo tu)
- **Remoto**: Messaggi condivisi con tutti (database comune)

Cambia facilmente in `backend-config.js`:
```javascript
USE_REMOTE: false  // false = locale, true = condiviso
```

## 🎮 Come Usare

1. **Primo Avvio**
   - Apri `index.html` nel browser
   - Vedrai il saluto "hello human."
   - Dopo 3 secondi appare l'interfaccia con la legenda

2. **Aggiungere un Messaggio**
   - Clicca su un punto della sfera
   - Inserisci titolo e messaggio
   - Scegli categoria
   - (Opzionale) Aggiungi foto o audio
   - Clicca "save message"
   - 💥 Goditi l'effetto esplosione!

3. **Navigare la Sfera**
   - **Ruota**: Click + drag
   - **Zoom**: Rotella del mouse
   - **Filtro**: Click su categoria nella legenda
   - Le particelle colorate hanno messaggi, quelle verdi sono vuote

4. **Visualizzare Messaggi**
   - Clicca su una particella colorata
   - Oppure inserisci le coordinate nel search box
   - Clicca "download coordinates" per salvare

## 🎨 Personalizzazioni Possibili

### Modificare Crescita Sfera
In `script.js`, modifica `config`:
```javascript
const config = {
  baseRadius: 50,           // Raggio iniziale
  maxRadius: 300,           // Raggio massimo
  particlesPerMessage: 15,  // Particelle per messaggio
  minParticles: 50,         // Particelle minime iniziali
  zoomMin: 0.5,             // Zoom minimo
  zoomMax: 3,               // Zoom massimo
};
```

### Cambiare Colori Categorie
In `script.js`:
```javascript
categoryColors: {
  memory: { r: 255, g: 255, b: 255 },    // Bianco
  memorial: { r: 68, g: 170, b: 255 },   // Blu
  love: { r: 255, g: 68, b: 68 },        // Rosso
  family: { r: 255, g: 255, b: 0 },      // Giallo
  joy: { r: 255, g: 136, b: 0 }          // Arancione
}
```

### Velocità Zoom
```javascript
zoomSpeed: 0.1  // Aumenta per zoom più veloce
```

## 🌐 Setup Backend Multi-Utente

Vedi **DEPLOYMENT.md** per guida completa.

**Quick Start:**
```bash
npm install
npm start
```

Poi in `backend-config.js`:
```javascript
USE_REMOTE: true
```

## ⚠️ Limitazioni Tecniche

### localStorage (Modalità Locale)
- Limite browser: ~5-10MB totali
- Foto: max 2MB ciascuna
- Audio: max 3MB ciascuno
- Con media pesanti, ~50-100 messaggi massimo

### Backend (Modalità Remoto)
- Dipende da hosting scelto
- Database SQLite: ~100MB gratis
- PostgreSQL: illimitato (dipende da piano)

### Performance
- Testato fino a 3000 particelle
- Oltre 5000 particelle potrebbero causare lag
- Consigliato max 200-300 messaggi con media

## 🔧 Debug & Manutenzione

### Pulire LocalStorage
Apri console browser (F12) e digita:
```javascript
StorageManager.clearAll()
location.reload()
```

### Esportare Tutti i Messaggi
```javascript
console.log(StorageManager.exportMessages())
```

### Testare Backend
```javascript
// Controlla se backend è attivo
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(console.log)
```

## 🚀 Prossimi Sviluppi Possibili

- [ ] Touch controls migliorati per mobile
- [ ] Modalità VR/360°
- [ ] Timeline messaggi per data
- [ ] Ricerca full-text
- [ ] Notifiche quando qualcuno aggiunge un messaggio
- [ ] Reazioni/like ai messaggi
- [ ] Modalità presentazione (slideshow)
- [ ] Esportazione PDF grafica
- [ ] Easter eggs nascosti

## 📱 Compatibilità

- ✅ Chrome/Edge (consigliato)
- ✅ Firefox
- ✅ Safari (iOS/macOS)
- ⚠️ Mobile (funziona ma zoom touch da migliorare)

## 🎯 Concept Marketing

### Idee per Viralità
1. **Coordinate Challenge**: "Trova il messaggio nascosto a X,Y,Z"
2. **Categorie Challenge**: "Riempi tutte e 5 le categorie"
3. **Time Capsule per il futuro**: "Messaggio per il tuo io del 2030"
4. **Collaborazioni**: Creator/artisti lasciano messaggi esclusivi
5. **Caccia al tesoro**: Coordinate sparse sui social

### Hashtag Suggeriti
- #timecapsule
- #digitalmemories
- #webartinstallation
- #interactiveart
- #3dmemories

### Demo Reel Ideas
- Zoom lento su sfera rotante
- "Scopri i messaggi nascosti alle coordinate..."
- Mostra esplosione di colori quando salvi
- "Quale categoria ti rappresenta di più?"

---

**Versione**: 2.0  
**Data**: Febbraio 2026  
**Stack**: Vanilla JS + HTML5 Canvas + Node.js + SQLite

🟢 Enjoy the journey through time and space.
