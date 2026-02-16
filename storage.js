// ============================================
// STORAGE MANAGER
// Gestisce il salvataggio e caricamento dei messaggi
// ============================================

// ============================================
// HELPER: localStorage sicuro con gestione quota
// ============================================
function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (
      e.code === 22 ||            // QuotaExceededError standard
      e.code === 1014 ||          // Firefox NS_ERROR_DOM_QUOTA_REACHED
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      if (typeof window.showToast === 'function') {
        window.showToast('storage full — delete some messages to continue', 'error');
      } else {
        console.error('[ENOC] localStorage quota exceeded');
      }
    } else {
      console.error('[ENOC] localStorage write error:', e);
    }
    return false;
  }
}

const StorageManager = {
  STORAGE_KEY: 'timeCapsuleMessages',

  /**
   * Salva un nuovo messaggio.
   * Se le stesse coordinate esistono già con version > message.version
   * lancia 'conflict' per evitare di sovrascrivere un edit concorrente.
   */
  saveMessage(message) {
    const messages = this.getAllMessages();

    // Conflict detection: stesse coordinate già presenti?
    const existingIdx = messages.findIndex(m => m.coords === message.coords);
    if (existingIdx !== -1) {
      const existing = messages[existingIdx];
      // Se il messaggio già salvato è più recente del nostro, è un conflitto
      if (existing.version && message.version && existing.version > message.version) {
        throw new Error('conflict');
      }
      // Aggiornamento: sostituisce il vecchio
      messages[existingIdx] = message;
    } else {
      messages.push(message);
    }

    const ok = safeLocalStorageSet(this.STORAGE_KEY, JSON.stringify(messages));
    if (!ok) throw new Error('storage-full');
    return messages.length;
  },

  /**
   * Ottiene tutti i messaggi
   */
  getAllMessages() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[ENOC] localStorage parse error:', e);
      return [];
    }
  },
  
  /**
   * Cerca un messaggio per coordinate
   */
  getMessageByCoords(coords) {
    const messages = this.getAllMessages();
    return messages.find(m => m.coords === coords);
  },
  
  /**
   * Conta i messaggi totali
   */
  getMessageCount() {
    return this.getAllMessages().length;
  },
  
  /**
   * Cancella tutti i messaggi (per debug)
   */
  clearAll() {
    localStorage.removeItem(this.STORAGE_KEY);
  },
  
  /**
   * Esporta tutti i messaggi come JSON
   */
  exportMessages() {
    return JSON.stringify(this.getAllMessages(), null, 2);
  }
};

// ============================================
// DAILY LIMITS MANAGER
// Traccia i limiti giornalieri via localStorage (anonimo)
// ============================================

const DailyLimits = {
  LIMITS_KEY: 'timeCapsuleDailyLimits',

  MAX_MESSAGES_PER_DAY: 10,
  MAX_PHOTO_BYTES_PER_DAY: 50 * 1024 * 1024, // 50MB

  _today() {
    return new Date().toISOString().split('T')[0];
  },

  _getUsage() {
    const data = localStorage.getItem(this.LIMITS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.date !== this._today()) {
        return this._resetUsage();
      }
      return parsed;
    }
    return this._resetUsage();
  },

  _resetUsage() {
    const usage = {
      date: this._today(),
      messageCount: 0,
      photoBytes: 0
    };
    safeLocalStorageSet(this.LIMITS_KEY, JSON.stringify(usage));
    return usage;
  },

  canSendMessage() {
    const usage = this._getUsage();
    return usage.messageCount < this.MAX_MESSAGES_PER_DAY;
  },

  canUploadPhoto(fileSize) {
    const usage = this._getUsage();
    return (usage.photoBytes + fileSize) <= this.MAX_PHOTO_BYTES_PER_DAY;
  },

  recordMessage() {
    const usage = this._getUsage();
    usage.messageCount++;
    safeLocalStorageSet(this.LIMITS_KEY, JSON.stringify(usage));
  },

  recordPhotoUpload(fileSize) {
    const usage = this._getUsage();
    usage.photoBytes += fileSize;
    safeLocalStorageSet(this.LIMITS_KEY, JSON.stringify(usage));
  },

  getRemainingLimits() {
    const usage = this._getUsage();
    return {
      messagesLeft: this.MAX_MESSAGES_PER_DAY - usage.messageCount,
      photoBytesLeft: this.MAX_PHOTO_BYTES_PER_DAY - usage.photoBytes,
      photoMBLeft: ((this.MAX_PHOTO_BYTES_PER_DAY - usage.photoBytes) / (1024 * 1024)).toFixed(1)
    };
  }
};

/**
 * Converte un file in base64
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Genera un file di testo con le coordinate
 */
function generateCoordinateFile(message) {
  const content = `TIME CAPSULE - COORDINATE FILE
===============================

Title: ${message.title}
Coordinates: ${message.coords}
Date: ${message.date}

Message:
${message.text}

---
To revisit this message, enter the coordinates in the search box:
${message.coords}
`;
  
  return content;
}

/**
 * Trigger download di un file
 */
function downloadFile(content, filename, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
