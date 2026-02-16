// ============================================
// STORAGE MANAGER
// Gestisce il salvataggio e caricamento dei messaggi
// ============================================

const StorageManager = {
  STORAGE_KEY: 'timeCapsuleMessages',
  
  /**
   * Salva un nuovo messaggio
   */
  saveMessage(message) {
    const messages = this.getAllMessages();
    messages.push(message);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages));
    return messages.length;
  },
  
  /**
   * Ottiene tutti i messaggi
   */
  getAllMessages() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
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
