// ============================================
// CONFIGURAZIONE
// ============================================
const config = {
  baseRadius: 50,           // Raggio minimo iniziale
  maxRadius: 300,           // Raggio massimo
  particlesPerMessage: 15,  // Particelle aggiunte per messaggio
  rotationSpeed: 0.001,
  autoRotateSpeed: 0.0005,  // Rotazione automatica quando non si draggga
  minParticles: 50,         // Particelle minime iniziali
  zoomMin: 0.5,             // Zoom minimo
  zoomMax: 3,               // Zoom massimo
  zoomSpeed: 0.1,           // Velocità zoom
  
  // Colori categorie
  categoryColors: {
    memory: { r: 255, g: 255, b: 255 },    // Bianco
    memorial: { r: 68, g: 170, b: 255 },   // Blu
    love: { r: 255, g: 68, b: 68 },        // Rosso
    family: { r: 255, g: 255, b: 0 },      // Giallo
    joy: { r: 255, g: 136, b: 0 }          // Arancione
  },
  
  // Colore particelle vuote
  emptyColor: { r: 255, g: 140, b: 0 }      // Arancione Pip-Boy
};

// ============================================
// STATO GLOBALE
// ============================================
let state = {
  greetingVisible: true,
  mouseX: 0,
  mouseY: 0,
  rotationX: 0,
  rotationY: 0,
  targetRotationX: 0,
  targetRotationY: 0,
  particles: [],
  selectedPoint: null,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  autoRotate: true,
  zoom: 1,                  // Livello zoom corrente
  targetZoom: 1,            // Zoom target per smooth transition
  currentFilter: null,      // Categoria filtro attivo (null = mostra tutto)
  explosionParticles: [],   // Particelle effetto esplosione
  hoveredParticle: null,    // Particella sotto il mouse
  currentMessage: null,     // Messaggio corrente visualizzato
  
  // Media temporanei per nuovo messaggio
  tempPhoto: null,
  tempAudio: null
};

// ============================================
// SETUP CANVAS
// ============================================
const canvas = document.getElementById('sphere');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ============================================
// CREAZIONE PARTICELLE DINAMICA
// ============================================
async function createParticles() {
  const messages = await BackendAPI.getAllMessages();
  const messageCount = messages.length;
  
  // Calcola il raggio in base ai messaggi
  const progress = Math.min(messageCount / 100, 1);
  const currentRadius = config.baseRadius + (config.maxRadius - config.baseRadius) * progress;
  
  state.particles = [];
  
  // 1. Crea particelle VUOTE di riempimento
  const emptyParticles = config.minParticles + (messageCount * (config.particlesPerMessage - 1));
  for (let i = 0; i < emptyParticles; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = currentRadius * (0.9 + Math.random() * 0.2);
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    
    state.particles.push({
      x, y, z,
      originalX: x,
      originalY: y,
      originalZ: z,
      size: Math.random() * 1.5 + 0.5,
      brightness: Math.random() * 0.5 + 0.5,
      angle: Math.random() * Math.PI * 2,
      category: null,
      hasMessage: false,
      message: null,
      color: config.emptyColor,
      screenX: 0,
      screenY: 0
    });
  }
  
  // 2. Crea UNA particella DEDICATA per ogni messaggio
  messages.forEach(msg => {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = currentRadius;
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    
    const color = config.categoryColors[msg.category];
    
    state.particles.push({
      x, y, z,
      originalX: x,
      originalY: y,
      originalZ: z,
      size: Math.random() * 2 + 2,  // Più grande
      brightness: 1,
      angle: Math.random() * Math.PI * 2,
      category: msg.category,
      hasMessage: true,
      message: msg,  // Messaggio completo salvato nella particella!
      color: color,
      screenX: 0,
      screenY: 0
    });
  });
  
  // Aggiorna contatore
  document.getElementById('count').textContent = messageCount;
  document.getElementById('particles').textContent = state.particles.length;
}

// ============================================
// ANIMAZIONE
// ============================================
function animate() {
  // Sfondo nero con dissolvenza
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Centro della sfera
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Rotazione automatica se non si sta draggando
  if (state.autoRotate && !state.isDragging) {
    state.targetRotationY += config.autoRotateSpeed;
  }
  
  // Smooth rotation
  state.rotationX += (state.targetRotationX - state.rotationX) * 0.1;
  state.rotationY += (state.targetRotationY - state.rotationY) * 0.1;
  
  // Smooth zoom
  state.zoom += (state.targetZoom - state.zoom) * 0.1;
  
  // Filtra particelle se necessario
  let visibleParticles = state.particles;
  if (state.currentFilter) {
    visibleParticles = state.particles.filter(p => 
      p.category === state.currentFilter || !p.hasMessage
    );
  }
  
  // Ordina particelle per profondità (z-sorting)
  const sortedParticles = [...visibleParticles].sort((a, b) => {
    const cosX = Math.cos(state.rotationX);
    const sinX = Math.sin(state.rotationX);
    const cosY = Math.cos(state.rotationY);
    const sinY = Math.sin(state.rotationY);
    
    const y1a = a.y * cosX - a.z * sinX;
    const z1a = a.y * sinX + a.z * cosX;
    const z2a = -a.x * sinY + z1a * cosY;
    
    const y1b = b.y * cosX - b.z * sinX;
    const z1b = b.y * sinX + b.z * cosX;
    const z2b = -b.x * sinY + z1b * cosY;
    
    return z2a - z2b;
  });
  
  // Trova particella sotto il mouse (per hover)
  let hoveredParticle = null;
  let minDistance = 30; // Raggio di detection in pixel
  
  // Disegna particelle
  sortedParticles.forEach(p => {
    // Rotazione X
    const cosX = Math.cos(state.rotationX);
    const sinX = Math.sin(state.rotationX);
    const y1 = p.y * cosX - p.z * sinX;
    const z1 = p.y * sinX + p.z * cosX;
    
    // Rotazione Y
    const cosY = Math.cos(state.rotationY);
    const sinY = Math.sin(state.rotationY);
    const x1 = p.x * cosY + z1 * sinY;
    const z2 = -p.x * sinY + z1 * cosY;
    
    // Proiezione prospettica con zoom
    const perspective = 600;
    const scale = (perspective / (z2 + perspective + 200)) * state.zoom;
    const px = centerX + x1 * scale;
    const py = centerY + y1 * scale;
    
    // Salva coordinate schermo nella particella
    p.screenX = px;
    p.screenY = py;
    p.screenScale = scale;
    
    // Calcola opacità in base alla profondità
    const opacity = Math.min(1, Math.max(0.1, scale * 1.5));
    
    // Check hover solo per particelle con messaggi
    if (p.hasMessage && z2 > -perspective) {
      const dx = state.mouseX - px;
      const dy = state.mouseY - py;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        hoveredParticle = p;
      }
    }
    
    // Usa il colore della categoria
    const color = p.color;
    
    // Aumenta dimensione se hover
    const isHovered = (hoveredParticle === p);
    const finalSize = p.size * scale * (isHovered ? 1.5 : 1);
    
    // Disegna particella
    ctx.beginPath();
    ctx.arc(px, py, finalSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * p.brightness})`;
    ctx.fill();
    
    // Glow per particelle con messaggi
    if (p.hasMessage) {
      ctx.shadowBlur = isHovered ? 20 * scale : 10 * scale;
      ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    // Piccola animazione fluttuante
    p.angle += 0.02;
    p.x = p.originalX + Math.sin(p.angle) * 2;
    p.y = p.originalY + Math.cos(p.angle * 0.7) * 2;
    p.z = p.originalZ + Math.sin(p.angle * 0.5) * 2;
  });
  
  // Salva particella in hover nello state
  state.hoveredParticle = hoveredParticle;
  
  // Disegna tooltip se hover
  if (hoveredParticle && hoveredParticle.message) {
    const tooltipX = hoveredParticle.screenX + 15;
    const tooltipY = hoveredParticle.screenY - 10;
    
    // Emoji categoria
    const categoryEmojis = {
      memory: '⚪',
      memorial: '🔵',
      love: '🔴',
      family: '🟡',
      joy: '🟠'
    };
    
    const text = `${categoryEmojis[hoveredParticle.category]} ${hoveredParticle.message.title}`;
    
    // Calcola dimensioni tooltip
    ctx.font = '14px "Courier New", monospace';
    const textWidth = ctx.measureText(text).width;
    const padding = 8;
    
    // Background tooltip
    ctx.fillStyle = 'rgba(30, 15, 0, 0.95)';
    ctx.fillRect(tooltipX - padding, tooltipY - 18, textWidth + padding * 2, 24);
    
    // Border tooltip
    ctx.strokeStyle = '#ff8c00';
    ctx.lineWidth = 1;
    ctx.strokeRect(tooltipX - padding, tooltipY - 18, textWidth + padding * 2, 24);
    
    // Testo tooltip
    ctx.fillStyle = '#ff8c00';
    ctx.fillText(text, tooltipX, tooltipY);
  }
  
  // Disegna particelle esplosione
  for (let i = state.explosionParticles.length - 1; i >= 0; i--) {
    const ep = state.explosionParticles[i];
    
    ep.life -= 0.02;
    if (ep.life <= 0) {
      state.explosionParticles.splice(i, 1);
      continue;
    }
    
    ep.x += ep.vx;
    ep.y += ep.vy;
    ep.vx *= 0.98;
    ep.vy *= 0.98;
    
    ctx.beginPath();
    ctx.arc(ep.x, ep.y, ep.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${ep.color.r}, ${ep.color.g}, ${ep.color.b}, ${ep.life})`;
    ctx.fill();
  }
  
  // Cambia cursore se hover su particella
  canvas.style.cursor = hoveredParticle ? 'pointer' : 'grab';
  if (state.isDragging) {
    canvas.style.cursor = 'grabbing';
  }
  
  requestAnimationFrame(animate);
}

// ============================================
// EVENTI MOUSE - DRAG TO ROTATE
// ============================================
canvas.addEventListener('mousedown', (e) => {
  state.isDragging = true;
  state.dragStartX = e.clientX;
  state.dragStartY = e.clientY;
  state.autoRotate = false;
  canvas.classList.add('dragging');
});

canvas.addEventListener('mousemove', (e) => {
  state.mouseX = e.clientX;
  state.mouseY = e.clientY;
  
  if (state.isDragging) {
    // Calcola rotazione basata sul movimento del mouse
    const deltaX = e.clientX - state.dragStartX;
    const deltaY = e.clientY - state.dragStartY;
    
    state.targetRotationY += deltaX * 0.005;
    state.targetRotationX += deltaY * 0.005;
    
    state.dragStartX = e.clientX;
    state.dragStartY = e.clientY;
  }
  
  // Aggiorna coordinate
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const dx = (e.clientX - centerX) / centerX;
  const dy = (e.clientY - centerY) / centerY;
  
  document.getElementById('coords').textContent = 
    `coords: ${dx.toFixed(3)}, ${dy.toFixed(3)}, 0.000`;
});

canvas.addEventListener('mouseup', () => {
  state.isDragging = false;
  canvas.classList.remove('dragging');
  // Riattiva auto-rotate dopo 2 secondi
  setTimeout(() => {
    state.autoRotate = true;
  }, 2000);
});

canvas.addEventListener('mouseleave', () => {
  state.isDragging = false;
  canvas.classList.remove('dragging');
});

// Zoom con rotella del mouse
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  
  const zoomDelta = e.deltaY > 0 ? -config.zoomSpeed : config.zoomSpeed;
  state.targetZoom = Math.max(config.zoomMin, Math.min(config.zoomMax, state.targetZoom + zoomDelta));
});

canvas.addEventListener('click', (e) => {
  // Non aprire se stava draggando
  if (state.isDragging) return;
  
  // Se c'è una particella in hover, aprila
  if (state.hoveredParticle && state.hoveredParticle.message) {
    showMessagePanel(state.hoveredParticle.message);
  } else {
    // Altrimenti crea nuovo messaggio alle coordinate del click
    state.selectedPoint = {
      x: e.clientX,
      y: e.clientY,
      coords: `${((e.clientX - canvas.width/2)/canvas.width).toFixed(3)}, ${((e.clientY - canvas.height/2)/canvas.height).toFixed(3)}, 0.000`
    };
    showMessagePanel(null);
  }
});

// ============================================
// GESTIONE SEARCH BOX
// ============================================
document.getElementById('search').addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    const searchTerm = e.target.value.trim().toLowerCase();
    
    if (!searchTerm) return;
    
    // Cerca nei messaggi per titolo
    const messages = await BackendAPI.getAllMessages();
    const found = messages.find(m => 
      m.title.toLowerCase().includes(searchTerm) ||
      m.coords === searchTerm
    );
    
    if (found) {
      showMessagePanel(found);
      e.target.value = '';
    } else {
      alert('no message found with that title or coordinates.');
    }
  }
});

// ============================================
// PANEL MESSAGGI
// ============================================
async function showMessagePanel(existingMessage) {
  const panel = document.getElementById('message-panel');
  const viewSection = document.getElementById('message-view');
  const formSection = document.getElementById('message-form');
  
  if (existingMessage) {
    // Mostra messaggio esistente
    viewSection.classList.remove('hidden');
    formSection.classList.add('hidden');
    
    // Emoji categoria
    const categoryEmojis = {
      memory: '⚪',
      memorial: '🔵',
      love: '🔴',
      family: '🟡',
      joy: '🟠'
    };
    
    const categoryNames = {
      memory: 'memories',
      memorial: 'memorials',
      love: 'love stories',
      family: 'family moments',
      joy: 'happy moments'
    };
    
    document.getElementById('view-title').textContent = 
      `${categoryEmojis[existingMessage.category]} ${existingMessage.title}`;
    document.getElementById('view-coords').textContent = 
      `coordinates: ${existingMessage.coords} | category: ${categoryNames[existingMessage.category]}`;
    document.getElementById('message-content').textContent = existingMessage.text;
    document.getElementById('message-date').textContent = `saved on ${existingMessage.date}`;
    
    // Salva messaggio corrente nello state per download
    state.currentMessage = existingMessage;
    
    // Gestisci media
    const mediaContainer = document.getElementById('media-container');
    const imageEl = document.getElementById('message-image');
    const audioEl = document.getElementById('message-audio');
    
    if (existingMessage.photo || existingMessage.audio) {
      mediaContainer.classList.remove('hidden');
      
      if (existingMessage.photo) {
        imageEl.src = existingMessage.photo;
        imageEl.classList.remove('hidden');
      } else {
        imageEl.classList.add('hidden');
      }
      
      if (existingMessage.audio) {
        audioEl.src = existingMessage.audio;
        audioEl.classList.remove('hidden');
      } else {
        audioEl.classList.add('hidden');
      }
    } else {
      mediaContainer.classList.add('hidden');
    }
    
  } else {
    // Mostra form nuovo messaggio
    viewSection.classList.add('hidden');
    formSection.classList.remove('hidden');
    
    // Reset form
    document.getElementById('message-title').value = '';
    document.getElementById('new-message').value = '';
    document.getElementById('message-category').value = 'memory';
    resetMediaUploads();
  }
  
  panel.classList.add('visible');
}

function closeMessage() {
  document.getElementById('message-panel').classList.remove('visible');
  resetMediaUploads();
}

// ============================================
// SALVATAGGIO MESSAGGIO
// ============================================
async function saveMessage() {
  // Controllo limite giornaliero
  if (!DailyLimits.canSendMessage()) {
    alert('daily limit reached: you can send up to 10 messages per day.\ntry again tomorrow.');
    return;
  }

  const title = document.getElementById('message-title').value.trim();
  const text = document.getElementById('new-message').value.trim();
  const category = document.getElementById('message-category').value;

  if (!title) {
    alert('please enter a title for your message.');
    return;
  }

  if (!text) {
    alert('please enter a message.');
    return;
  }
  
  // Genera coordinate univoche random
  const coords = `${(Math.random() * 2 - 1).toFixed(3)}, ${(Math.random() * 2 - 1).toFixed(3)}, ${(Math.random() * 2 - 1).toFixed(3)}`;
  
  const message = {
    title,
    coords,
    text,
    category,
    date: new Date().toISOString().split('T')[0],
    photo: state.tempPhoto,
    audio: state.tempAudio
  };
  
  await BackendAPI.saveMessage(message);
  DailyLimits.recordMessage();
  updateDailyStats();

  // Effetto esplosione di particelle al centro schermo
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  createExplosion(centerX, centerY, category);
  
  // Rigenera particelle con il nuovo messaggio
  await createParticles();
  
  // Feedback
  alert(`message "${title}" saved.\nthank you for contributing to the time capsule.`);
  
  closeMessage();
}

// ============================================
// DOWNLOAD COORDINATE
// ============================================
function downloadCoordinates() {
  const message = state.currentMessage;
  if (!message) return;
  
  const content = generateCoordinateFile(message);
  const filename = `${message.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_coordinates.txt`;
  
  downloadFile(content, filename);
}

// ============================================
// EFFETTO ESPLOSIONE
// ============================================
function createExplosion(x, y, category) {
  const color = config.categoryColors[category];
  const particleCount = 30;
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount;
    const speed = 2 + Math.random() * 3;
    
    state.explosionParticles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      life: 1,
      color: color
    });
  }
}

// ============================================
// FILTRO CATEGORIE
// ============================================
function toggleFilter() {
  const filterBtn = document.getElementById('filter-toggle');
  const legendItems = document.querySelectorAll('.legend-item');
  
  if (state.currentFilter) {
    // Rimuovi filtro
    state.currentFilter = null;
    filterBtn.textContent = 'show all';
    legendItems.forEach(item => item.classList.remove('active'));
  }
}

// Gestione click sulle categorie nella legenda
document.addEventListener('DOMContentLoaded', () => {
  const legendItems = document.querySelectorAll('.legend-item');
  const filterBtn = document.getElementById('filter-toggle');
  
  legendItems.forEach(item => {
    item.addEventListener('click', () => {
      const category = item.dataset.category;
      
      if (state.currentFilter === category) {
        // Deseleziona
        state.currentFilter = null;
        filterBtn.textContent = 'show all';
        item.classList.remove('active');
      } else {
        // Seleziona nuova categoria
        state.currentFilter = category;
        filterBtn.textContent = `showing: ${category}`;
        
        legendItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });
});

// ============================================
// GESTIONE UPLOAD MEDIA
// ============================================
async function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Verifica dimensione (max 2MB per localStorage)
  if (file.size > 2 * 1024 * 1024) {
    alert('photo too large. please use an image under 2MB.');
    event.target.value = '';
    return;
  }

  // Controllo limite giornaliero cumulativo (50MB/giorno)
  if (!DailyLimits.canUploadPhoto(file.size)) {
    const limits = DailyLimits.getRemainingLimits();
    alert(`daily photo limit reached.\nremaining today: ${limits.photoMBLeft}MB of 50MB.\ntry again tomorrow.`);
    event.target.value = '';
    return;
  }

  try {
    state.tempPhoto = await fileToBase64(file);
    DailyLimits.recordPhotoUpload(file.size);
    
    // Mostra preview
    document.getElementById('upload-preview').classList.remove('hidden');
    document.getElementById('photo-preview').classList.remove('hidden');
    document.getElementById('preview-image').src = state.tempPhoto;
  } catch (error) {
    alert('error loading photo. please try again.');
    console.error(error);
  }
}

async function handleAudioUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Verifica dimensione (max 3MB per localStorage)
  if (file.size > 3 * 1024 * 1024) {
    alert('audio file too large. please use a file under 3MB.');
    event.target.value = '';
    return;
  }
  
  try {
    state.tempAudio = await fileToBase64(file);
    
    // Mostra preview
    document.getElementById('upload-preview').classList.remove('hidden');
    document.getElementById('audio-preview').classList.remove('hidden');
    document.getElementById('preview-audio').src = state.tempAudio;
  } catch (error) {
    alert('error loading audio. please try again.');
    console.error(error);
  }
}

function removePhoto() {
  state.tempPhoto = null;
  document.getElementById('photo-preview').classList.add('hidden');
  document.getElementById('photo-upload').value = '';
  checkUploadPreview();
}

function removeAudio() {
  state.tempAudio = null;
  document.getElementById('audio-preview').classList.add('hidden');
  document.getElementById('audio-upload').value = '';
  checkUploadPreview();
}

function checkUploadPreview() {
  if (!state.tempPhoto && !state.tempAudio) {
    document.getElementById('upload-preview').classList.add('hidden');
  }
}

function resetMediaUploads() {
  state.tempPhoto = null;
  state.tempAudio = null;
  document.getElementById('photo-upload').value = '';
  document.getElementById('audio-upload').value = '';
  document.getElementById('upload-preview').classList.add('hidden');
  document.getElementById('photo-preview').classList.add('hidden');
  document.getElementById('audio-preview').classList.add('hidden');
}

// ============================================
// BOOT-UP TYPEWRITER
// ============================================
function typewriterGreeting(text) {
  const el = document.getElementById('greeting');
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.textContent = '_';
  el.textContent = '';
  el.appendChild(cursor);

  let i = 0;
  const interval = setInterval(() => {
    el.textContent = text.substring(0, i + 1);
    el.appendChild(cursor);
    i++;
    if (i >= text.length) {
      clearInterval(interval);
      setTimeout(() => cursor.remove(), 1000);
    }
  }, 80);
}

// ============================================
// AGGIORNAMENTO STATS GIORNALIERE
// ============================================
function updateDailyStats() {
  const limits = DailyLimits.getRemainingLimits();
  const el = document.getElementById('daily-msg-count');
  if (el) el.textContent = DailyLimits.MAX_MESSAGES_PER_DAY - limits.messagesLeft;
}

// ============================================
// INIZIALIZZAZIONE
// ============================================
async function init() {
  // Boot-up typewriter
  typewriterGreeting('hello human.');

  // Carica messaggi salvati
  await createParticles();
  updateDailyStats();
  
  // Avvia animazione
  animate();
  
  // Nascondi greeting dopo 3 secondi
  setTimeout(async () => {
    document.getElementById('greeting').classList.add('hidden');
    document.getElementById('interface').classList.add('visible');
    document.getElementById('stats').classList.add('visible');
    document.getElementById('legend').classList.add('visible');
    
    // Mostra istruzioni se è la prima volta
    const messageCount = await BackendAPI.getMessageCount();
    if (messageCount === 0) {
      const instructions = document.getElementById('instructions');
      if (instructions) {
        instructions.classList.remove('hidden');
        instructions.classList.add('visible');
        
        setTimeout(() => {
          instructions.style.opacity = '0';
        }, 5000);
      }
    }
  }, 3000);
}

// ============================================
// RESIZE
// ============================================
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// ============================================
// START
// ============================================
window.addEventListener('DOMContentLoaded', init);
