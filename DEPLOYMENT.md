# TIME CAPSULE - BACKEND SETUP & DEPLOYMENT

## 🎯 Modalità di Utilizzo

Il progetto può funzionare in **DUE modalità**:

### 1. MODALITÀ LOCALE (Default)
- I messaggi vengono salvati nel localStorage del browser
- Ogni utente vede solo i propri messaggi
- Nessun setup backend richiesto
- Perfetto per test e demo

### 2. MODALITÀ MULTI-UTENTE
- I messaggi vengono salvati su un database condiviso
- Tutti gli utenti vedono tutti i messaggi
- Richiede setup backend + database
- Ideale per produzione

---

## 🚀 SETUP BACKEND (Multi-utente)

### Prerequisiti
- Node.js (v16 o superiore)
- npm o yarn

### Installazione Locale

1. **Installa le dipendenze**
```bash
npm install
```

2. **Avvia il server**
```bash
npm start
```

Il server partirà su `http://localhost:3000`

3. **Abilita backend nel frontend**
Apri `backend-config.js` e cambia:
```javascript
const BACKEND_CONFIG = {
  USE_REMOTE: true,  // Cambia a true
  BACKEND_URL: 'http://localhost:3000/api'
};
```

4. **Apri il sito**
Apri `index.html` nel browser - ora i messaggi saranno condivisi!

---

## ☁️ DEPLOYMENT SU INTERNET

### Opzione 1: Vercel (Consigliato - GRATIS)

1. **Crea account su** [vercel.com](https://vercel.com)

2. **Installa Vercel CLI**
```bash
npm install -g vercel
```

3. **Crea `vercel.json`** (già incluso nella directory)

4. **Deploy**
```bash
vercel
```

5. **Aggiorna frontend**
Dopo il deploy, Vercel ti darà un URL (es: `https://timecapsule-abc123.vercel.app`)

Modifica `backend-config.js`:
```javascript
BACKEND_URL: 'https://timecapsule-abc123.vercel.app/api'
```

6. **Deploy frontend**
Puoi hostare i file HTML/CSS/JS su:
- GitHub Pages (gratis)
- Netlify (gratis)
- Vercel stesso

### Opzione 2: Railway (GRATIS con limiti)

1. Vai su [railway.app](https://railway.app)
2. Crea nuovo progetto
3. Collega il tuo repo GitHub
4. Railway deploierà automaticamente
5. Copia l'URL e aggiorna `backend-config.js`

### Opzione 3: Render (GRATIS)

1. Vai su [render.com](https://render.com)
2. Crea nuovo Web Service
3. Connetti repo GitHub
4. Render builderà e deploierà
5. Usa l'URL fornito in `backend-config.js`

---

## 🗄️ DATABASE

### Sviluppo Locale
- Usa SQLite (file `timecapsule.db`)
- Creato automaticamente al primo avvio
- Nessuna configurazione necessaria

### Produzione
Per deployment su Vercel/Railway/Render:

**Opzione A: SQLite** (semplice ma limitato)
- Funziona out-of-the-box
- ATTENZIONE: Su alcuni servizi il file viene cancellato al restart

**Opzione B: PostgreSQL** (raccomandato per produzione)
1. Usa un database PostgreSQL gratuito:
   - [Supabase](https://supabase.com) (gratis fino a 500MB)
   - [Neon](https://neon.tech) (gratis)
   - Railway Postgres (gratis con limiti)

2. Modifica `server.js` per usare PostgreSQL:
```javascript
// Invece di sqlite3, usa pg
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

3. Converti le query da SQLite a PostgreSQL

---

## 🔧 CONFIGURAZIONE AMBIENTE

### Variabili d'ambiente (opzionali)

Crea file `.env`:
```env
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
NODE_ENV=production
MAX_MESSAGE_SIZE=10485760  # 10MB
```

Carica con:
```bash
npm install dotenv
```

In `server.js`:
```javascript
require('dotenv').config();
```

---

## 📊 API ENDPOINTS

### GET /api/health
Check se il server funziona

### GET /api/messages
Ottieni tutti i messaggi
- Query param: `?category=love` (opzionale)

### GET /api/messages/count
Conta totale messaggi

### GET /api/messages/:coords
Ottieni messaggio per coordinate specifiche

### POST /api/messages
Salva nuovo messaggio
```json
{
  "title": "My Memory",
  "coords": "0.123, 0.456, 0.789",
  "text": "Message content",
  "category": "memory",
  "date": "2026-02-08",
  "photo": "base64...",
  "audio": "base64..."
}
```

### GET /api/categories/:category
Messaggi per categoria (memory, memorial, love, family, joy)

### GET /api/stats
Statistiche globali

---

## 🧪 TESTING

### Test locale
```bash
# Avvia server
npm start

# In altro terminale, test API
curl http://localhost:3000/api/health
curl http://localhost:3000/api/messages
```

### Test produzione
```bash
curl https://your-domain.com/api/health
```

---

## 🔒 SICUREZZA (Per Produzione)

### Rate Limiting
Installa express-rate-limit:
```bash
npm install express-rate-limit
```

In `server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100 // max 100 richieste per IP
});

app.use('/api/', limiter);
```

### Validazione Input
Installa express-validator:
```bash
npm install express-validator
```

### CORS Restrittivo
In produzione, limita CORS:
```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));
```

---

## 📈 MONITORING

### Logs
- Vercel: Automatico in dashboard
- Railway: Automatico in dashboard
- Render: Automatico in dashboard

### Database Size
SQLite:
```bash
ls -lh timecapsule.db
```

PostgreSQL:
```sql
SELECT pg_size_pretty(pg_database_size('your_db_name'));
```

---

## 🆘 TROUBLESHOOTING

### "Cannot connect to backend"
1. Verifica che il server sia attivo
2. Controlla BACKEND_URL in `backend-config.js`
3. Verifica CORS settings
4. Controlla firewall/network

### "Database locked"
SQLite issue - troppi accessi simultanei
Soluzione: passa a PostgreSQL

### "Message too large"
Riduci dimensione foto/audio o aumenta `body-parser` limit

### Frontend non si aggiorna
Svuota cache browser (Ctrl+Shift+R)

---

## 💡 TIPS

1. **Backup Database**
```bash
# SQLite
cp timecapsule.db timecapsule-backup.db

# PostgreSQL
pg_dump your_db_name > backup.sql
```

2. **Migrazioni**
Se cambi schema database, crea script di migrazione

3. **Performance**
Con 1000+ messaggi, considera:
- Paginazione API
- Caching (Redis)
- CDN per media

4. **Costi**
Setup base è GRATIS ma attenzione a:
- Storage media (foto/audio pesanti)
- Bandwidth
- Database size

Consiglio: usa Cloudinary/ImageKit per media esterni invece di base64

---

## 📞 SUPPORTO

Se hai problemi:
1. Controlla i logs del server
2. Verifica le API con curl/Postman
3. Ispeziona Network tab nel browser (F12)
4. Controlla documentazione dei servizi di hosting

---

🟢 Buon deployment!
