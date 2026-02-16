// ============================================
// BACKEND CONFIGURATION
// ============================================

const BACKEND_CONFIG = {
  // Cambia questo a true per usare il backend remoto
  USE_REMOTE: true,
  
  // URL del backend (modifica con il tuo URL quando deploi)
  BACKEND_URL: 'http://localhost:3000/api',
  
  // Fallback a localStorage se backend non disponibile
  AUTO_FALLBACK: true,
  
  // Timeout richieste (ms)
  REQUEST_TIMEOUT: 5000
};

// ============================================
// BACKEND API CLIENT
// ============================================

const BackendAPI = {
  /**
   * Salva un messaggio
   */
  async saveMessage(message) {
    if (!BACKEND_CONFIG.USE_REMOTE) {
      return StorageManager.saveMessage(message);
    }
    
    try {
      const response = await fetch(`${BACKEND_CONFIG.BACKEND_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(BACKEND_CONFIG.REQUEST_TIMEOUT)
      });
      
      if (!response.ok) throw new Error('Failed to save message');
      
      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error('Backend error:', error);
      
      if (BACKEND_CONFIG.AUTO_FALLBACK) {
        console.log('Falling back to localStorage');
        return StorageManager.saveMessage(message);
      }
      
      throw error;
    }
  },
  
  /**
   * Ottiene tutti i messaggi
   */
  async getAllMessages() {
    if (!BACKEND_CONFIG.USE_REMOTE) {
      return StorageManager.getAllMessages();
    }
    
    try {
      const response = await fetch(`${BACKEND_CONFIG.BACKEND_URL}/messages`, {
        signal: AbortSignal.timeout(BACKEND_CONFIG.REQUEST_TIMEOUT)
      });
      
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      return data.messages;
    } catch (error) {
      console.error('Backend error:', error);
      
      if (BACKEND_CONFIG.AUTO_FALLBACK) {
        console.log('Falling back to localStorage');
        return StorageManager.getAllMessages();
      }
      
      throw error;
    }
  },
  
  /**
   * Cerca messaggio per coordinate
   */
  async getMessageByCoords(coords) {
    if (!BACKEND_CONFIG.USE_REMOTE) {
      return StorageManager.getMessageByCoords(coords);
    }
    
    try {
      const encoded = encodeURIComponent(coords);
      const response = await fetch(`${BACKEND_CONFIG.BACKEND_URL}/messages/${encoded}`, {
        signal: AbortSignal.timeout(BACKEND_CONFIG.REQUEST_TIMEOUT)
      });
      
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch message');
      
      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Backend error:', error);
      
      if (BACKEND_CONFIG.AUTO_FALLBACK) {
        console.log('Falling back to localStorage');
        return StorageManager.getMessageByCoords(coords);
      }
      
      throw error;
    }
  },
  
  /**
   * Conta messaggi
   */
  async getMessageCount() {
    if (!BACKEND_CONFIG.USE_REMOTE) {
      return StorageManager.getMessageCount();
    }
    
    try {
      const response = await fetch(`${BACKEND_CONFIG.BACKEND_URL}/messages/count`, {
        signal: AbortSignal.timeout(BACKEND_CONFIG.REQUEST_TIMEOUT)
      });
      
      if (!response.ok) throw new Error('Failed to fetch count');
      
      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error('Backend error:', error);
      
      if (BACKEND_CONFIG.AUTO_FALLBACK) {
        console.log('Falling back to localStorage');
        return StorageManager.getMessageCount();
      }
      
      throw error;
    }
  }
};
