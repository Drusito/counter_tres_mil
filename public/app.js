// Definición de variables globales
const socket = io();
let offlineMode = false;
let offlinePlayers = [];
let offlineCurrentTurn = 0;
let offlineRound = 1;

let gameState = {
  roomId: null,
  players: [],
  isCreator: false,
  currentTurn: 0,
  round: 1,
  roomCreator: null
};

// Función para cambiar entre pantallas
function showScreen(screenId) {
  console.log('Cambiando a pantalla:', screenId);
  
  // Ocultar todas las pantallas
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.add('hidden');
  });
  
  // Mostrar la pantalla solicitada
  const screenToShow = document.getElementById(screenId + '-screen');
  if (screenToShow) {
    screenToShow.classList.remove('hidden');
  }
}

// Función para crear inputs de jugadores en modo offline
function createOfflinePlayerInputs() {
  console.log('Creando inputs para jugadores offline...');
  const playerCount = parseInt(document.getElementById('offline-player-count').value);
  
  if (isNaN(playerCount) || playerCount < 1 || playerCount > 8) {
    showNotification('Por favor, introduce un número válido de jugadores (1-8)', 'error');
    return;
  }
  
  const offlinePlayerInputs = document.getElementById('offline-player-inputs');
  offlinePlayerInputs.innerHTML = '';
  offlinePlayerInputs.classList.remove('hidden');
  
  for (let i = 0; i < playerCount; i++) {
    const inputDiv = document.createElement('div');
    inputDiv.className = 'player-input';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `offline-player-${i}`;
    input.placeholder = `Nombre del Jugador ${i + 1}`;
    input.className = 'player-name-input';
    
    inputDiv.appendChild(input);
    offlinePlayerInputs.appendChild(inputDiv);
  }
  
  // Mostrar botón de iniciar juego
  document.getElementById('start-offline-game').classList.remove('hidden');
}

// Función para iniciar juego en modo offline
function startOfflineGame() {
  console.log('Iniciando juego offline...');
  const playerCount = parseInt(document.getElementById('offline-player-count').value);
  
  if (playerCount < 1) {
    showNotification('Debes tener al menos un jugador', 'error');
    return;
  }
  
  offlinePlayers = [];
  
  // Crear array de jugadores
  for (let i = 0; i < playerCount; i++) {
    const nameInput = document.getElementById(`offline-player-${i}`);
    if (!nameInput) continue;
    
    const playerName = nameInput.value.trim() || `Jugador ${i + 1}`;
    
    offlinePlayers.push({
      id: `offline-${i}`,
      name: playerName,
      scores: [],
      currentRoundScore: 0,
      totalScore: 0
    });
  }
  
  offlineMode = true;
  offlineCurrentTurn = 0;
  offlineRound = 1;
  
  // Configurar pantalla de juego
  document.getElementById('round-counter').textContent = `Ronda: ${offlineRound}`;
  document.getElementById('current-player-name').textContent = offlinePlayers[0].name;
  
  // Crear contadores
  createOfflinePlayerCounters();
  
  // Mostrar controles
  document.getElementById('game-controls').classList.remove('hidden');
  
  showScreen('game');
  showNotification('¡Juego local iniciado!', 'success');
}

// Función para crear contadores en modo offline
function createOfflinePlayerCounters() {
  const countersContainer = document.getElementById('counters-container');
  countersContainer.innerHTML = '';
  
  offlinePlayers.forEach((player, index) => {
    const counterDiv = document.createElement('div');
    counterDiv.className = 'player-counter';
    counterDiv.id = `player-${index}`;
    
    // Marcar el jugador activo
    if (index === offlineCurrentTurn) {
      counterDiv.classList.add('active-turn');
    }
    
    // Añadir contenido
    counterDiv.innerHTML = `
      <h3>${player.name}</h3>
      <div class="score-display">${player.totalScore}</div>
      <div class="current-round-score">Esta ronda: ${player.currentRoundScore}</div>
    `;
    
    countersContainer.appendChild(counterDiv);
  });
}

// Función para actualizar contadores en modo offline
function updateOfflinePlayerCounters() {
  offlinePlayers.forEach((player, index) => {
    const counterDiv = document.getElementById(`player-${index}`);
    
    if (counterDiv) {
      // Actualizar valores
      const scoreDisplay = counterDiv.querySelector('.score-display');
      const currentRoundScore = counterDiv.querySelector('.current-round-score');
      
      if (scoreDisplay) {
        scoreDisplay.textContent = player.totalScore;
      }
      
      if (currentRoundScore) {
        currentRoundScore.textContent = `Esta ronda: ${player.currentRoundScore}`;
      }
      
      // Marcar turno activo
      if (index === offlineCurrentTurn) {
        counterDiv.classList.add('active-turn');
      } else {
        counterDiv.classList.remove('active-turn');
      }
    }
  });
  
  // Actualizar información de turno en la pantalla
  document.getElementById('round-counter').textContent = `Ronda: ${offlineRound}`;
  document.getElementById('current-player-name').textContent = offlinePlayers[offlineCurrentTurn].name;
}

// Función para comprobar la victoria al final de la ronda en modo offline
function checkVictoryCondition() {
    // Buscar jugadores con más de 3000 puntos
    const winners = offlinePlayers.filter(player => player.totalScore >= 3000);
    
    // Si hay ganadores, determinar el ganador final (mayor puntuación)
    if (winners.length > 0) {
      // Si hay varios con más de 3000, el ganador es el que tenga mayor puntuación
      const winner = winners.reduce((highest, player) => 
        player.totalScore > highest.totalScore ? player : highest, winners[0]);
      
      // Mostrar modal de victoria
      document.getElementById('winner-name').textContent = winner.name;
      document.getElementById('winner-score').textContent = winner.totalScore;
      document.getElementById('victory-modal').style.display = 'flex';
      document.getElementById('game-controls').classList.add('hidden');
      
      return true; // Indicar que hay un ganador
    }
    
    return false; // Indicar que no hay ganador
  }

// Función para sincronizar el estado del juego con los datos recibidos del servidor
function syncGameState(data) {
  // Si tenemos un currentPlayerIndex en los datos, sincronizar el estado del juego
  if (data.currentPlayerIndex !== undefined) {
    gameState.currentTurn = data.currentPlayerIndex;
  }
  
  // Si tenemos un array de jugadores, actualizar nuestro array de jugadores
  if (data.players) {
    gameState.players = data.players;
  }
  
  // Si tenemos un número de ronda, actualizar nuestra ronda
  if (data.round) {
    gameState.round = data.round;
  }
  
  // Actualizar elementos UI
  document.getElementById('round-counter').textContent = `Ronda: ${gameState.round}`;
  if (data.currentPlayer) {
    document.getElementById('current-player-name').textContent = data.currentPlayer.name;
  }
  
  // Mostrar/ocultar controles según corresponda
  if (data.currentPlayer && data.currentPlayer.id === socket.id) {
    document.getElementById('game-controls').classList.remove('hidden');
  } else {
    document.getElementById('game-controls').classList.add('hidden');
  }
  
  // Actualizar contadores visuales
  updatePlayerCounters(gameState.players);
}

// Funciones para el juego
function increaseScore() {
  if (offlineMode) {
    offlinePlayers[offlineCurrentTurn].currentRoundScore += 50;
    updateOfflinePlayerCounters();
  } else {
    socket.emit('increaseScore');
  }
}

function decreaseScore() {
  if (offlineMode) {
    offlinePlayers[offlineCurrentTurn].currentRoundScore -= 50;
    updateOfflinePlayerCounters();
  } else {
    socket.emit('decreaseScore');
  }
}

function declareBankruptcy() {
  if (offlineMode) {
    offlinePlayers[offlineCurrentTurn].scores = [];
    offlinePlayers[offlineCurrentTurn].currentRoundScore = 0;
    offlinePlayers[offlineCurrentTurn].totalScore = 0;
    
    document.getElementById('bankrupt-modal').style.display = 'flex';
    
    setTimeout(() => {
      nextOfflineTurn();
    }, 1000);
    
    updateOfflinePlayerCounters();
  } else {
    socket.emit('bankrupt');
  }
}

function finishTurn() {
    if (offlineMode) {
      const currentPlayer = offlinePlayers[offlineCurrentTurn];
      
      // Guardar puntuación
      currentPlayer.scores.push(currentPlayer.currentRoundScore);
      currentPlayer.totalScore = currentPlayer.scores.reduce((a, b) => a + b, 0);
      currentPlayer.currentRoundScore = 0;
      
      // Incrementamos el turno
      offlineCurrentTurn++;
      
      // Si hemos completado una ronda
      if (offlineCurrentTurn >= offlinePlayers.length) {
        // Comprobar victoria al final de la ronda
        const hasWinner = checkVictoryCondition();
        
        // Reiniciar turno y aumentar ronda solo si no hay ganador
        if (!hasWinner) {
          offlineCurrentTurn = 0;
          offlineRound++;
          // Actualizar contadores
          updateOfflinePlayerCounters();
        }
      } else {
        // Si no hemos completado la ronda, actualizar contadores
        updateOfflinePlayerCounters();
      }
    } else {
      socket.emit('finishTurn');
    }
  }

function exitGame() {
  if (offlineMode) {
    offlineMode = false;
    showScreen('main-menu');
  } else {
    leaveRoom();
  }
}

// Funciones para modo online
function createRoom() {
  const playerName = document.getElementById('player-name').value.trim() || `Jugador${Math.floor(Math.random() * 1000)}`;
  
  socket.emit('createRoom', {
    playerName: playerName,
    maxPlayers: 8
  });
}

function joinRoom() {
  const playerName = document.getElementById('player-name').value.trim() || `Jugador${Math.floor(Math.random() * 1000)}`;
  const roomCode = document.getElementById('room-code').value.trim().toUpperCase();
  
  if (!roomCode) {
    showNotification('Introduce un código de sala válido', 'error');
    return;
  }
  
  socket.emit('joinRoom', {
    playerName: playerName,
    roomId: roomCode
  });
}

function leaveRoom() {
  socket.emit('leaveRoom');
  showScreen('online-menu');
}

function startGame() {
  socket.emit('startGame');
}

// Función para actualizar lista de jugadores
function updatePlayerList(players) {
  const playerList = document.getElementById('player-list');
  playerList.innerHTML = '';
  
  players.forEach((player) => {
    const li = document.createElement('li');
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'player-icon';
    iconSpan.innerHTML = '<i class="fas fa-user"></i>';
    li.appendChild(iconSpan);
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = player.name;
    li.appendChild(nameSpan);
    
    // Marcar el creador de la sala
    if (player.id === gameState.roomCreator) {
      const creatorBadge = document.createElement('span');
      creatorBadge.className = 'creator-badge';
      creatorBadge.textContent = 'Anfitrión';
      li.appendChild(creatorBadge);
    }
    
    playerList.appendChild(li);
  });
}

// Función para crear contadores en modo online
function createPlayerCounters(players) {
  const countersContainer = document.getElementById('counters-container');
  countersContainer.innerHTML = '';
  
  players.forEach((player, index) => {
    const counterDiv = document.createElement('div');
    counterDiv.className = 'player-counter';
    counterDiv.id = `player-${index}`;
    
    // Marcar el jugador activo
    if (index === gameState.currentTurn) {
      counterDiv.classList.add('active-turn');
    }
    
    // Añadir contenido
    counterDiv.innerHTML = `
      <h3>${player.name}</h3>
      <div class="score-display">${player.totalScore}</div>
      <div class="current-round-score">Esta ronda: ${player.currentRoundScore}</div>
    `;
    
    countersContainer.appendChild(counterDiv);
  });
}

// Función para actualizar contadores en modo online
function updatePlayerCounters(players) {
  players.forEach((player, index) => {
    const counterDiv = document.getElementById(`player-${index}`);
    
    if (counterDiv) {
      // Actualizar valores
      const scoreDisplay = counterDiv.querySelector('.score-display');
      const currentRoundScore = counterDiv.querySelector('.current-round-score');
      
      if (scoreDisplay) {
        scoreDisplay.textContent = player.totalScore;
      }
      
      if (currentRoundScore) {
        currentRoundScore.textContent = `Esta ronda: ${player.currentRoundScore}`;
      }
      
      // Marcar turno activo
      if (index === gameState.currentTurn) {
        counterDiv.classList.add('active-turn');
      } else {
        counterDiv.classList.remove('active-turn');
      }
    }
  });
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = 'notification';
  
  // Añadir clase según el tipo
  switch (type) {
    case 'error':
      notification.style.backgroundColor = 'var(--danger-color)';
      break;
    case 'success':
      notification.style.backgroundColor = 'var(--success-color)';
      break;
    case 'warning':
      notification.style.backgroundColor = 'var(--warning-color)';
      notification.style.color = 'var(--background-dark)';
      break;
    default:
      notification.style.backgroundColor = 'var(--secondary-color)';
  }
  
  // Mostrar notificación
  notification.classList.add('show');
  
  // Ocultar después de 3 segundos
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Eventos de socket
socket.on('roomCreated', function(data) {
  gameState.roomId = data.roomId;
  gameState.isCreator = true;
  gameState.roomCreator = socket.id;
  
  document.getElementById('room-code-display').textContent = data.roomId;
  updatePlayerList([data.player]);
  
  document.getElementById('creator-controls').classList.remove('hidden');
  showScreen('waiting-room');
  showNotification('Sala creada con éxito. Código: ' + data.roomId, 'success');
});

socket.on('roomJoined', function(data) {
  gameState.roomId = data.roomId;
  gameState.isCreator = data.isCreator;
  gameState.players = data.players;
  gameState.roomCreator = data.creatorId;
  
  document.getElementById('room-code-display').textContent = data.roomId;
  updatePlayerList(data.players);
  
  if (data.isCreator) {
    document.getElementById('creator-controls').classList.remove('hidden');
  } else {
    document.getElementById('creator-controls').classList.add('hidden');
  }
  
  showScreen('waiting-room');
  showNotification('Te has unido a la sala', 'success');
});

socket.on('playerJoined', function(data) {
  gameState.players = data.players;
  updatePlayerList(data.players);
  showNotification(`${data.player.name} se ha unido a la sala`, 'info');
});

socket.on('playerLeft', function(data) {
  gameState.players = data.players;
  updatePlayerList(data.players);
  
  if (data.newCreator && data.newCreator === socket.id) {
    gameState.isCreator = true;
    document.getElementById('creator-controls').classList.remove('hidden');
    showNotification('Ahora eres el anfitrión de la sala', 'info');
  }
  
  showNotification('Un jugador ha abandonado la sala', 'info');
});

socket.on('gameStarted', function(data) {
  syncGameState(data);
  
  // Crear contadores de jugadores si aún no se han creado
  createPlayerCounters(data.players);
  
  showScreen('game');
  showNotification('¡El juego ha comenzado!', 'success');
});

socket.on('turnChanged', function(data) {
  syncGameState(data);
  
  // Mostrar notificación solo si es nuestro turno
  if (data.currentPlayer && data.currentPlayer.id === socket.id) {
    showNotification('¡Es tu turno!', 'info');
  }
});

socket.on('scoreUpdated', function(data) {
  gameState.players = data.players;
  
  const playerCounter = document.getElementById(`player-${data.playerIndex}`);
  if (playerCounter) {
    const currentRoundScore = playerCounter.querySelector('.current-round-score');
    if (currentRoundScore) {
      currentRoundScore.textContent = `Esta ronda: ${data.currentRoundScore}`;
    }
  }
});

socket.on('playerBankrupt', function(data) {
  gameState.players = data.players;
  
  updatePlayerCounters(data.players);
  
  if (data.playerIndex === gameState.players.findIndex(p => p.id === socket.id)) {
    document.getElementById('bankrupt-modal').style.display = 'flex';
  }
  
  showNotification(`¡${gameState.players[data.playerIndex].name} ha caído en bancarrota!`, 'warning');
});

socket.on('gameWon', function(data) {
  document.getElementById('winner-name').textContent = data.winner.name;
  document.getElementById('winner-score').textContent = data.winner.totalScore;
  document.getElementById('victory-modal').style.display = 'flex';
  
  document.getElementById('game-controls').classList.add('hidden');
  
  if (data.winner.id === socket.id) {
    document.body.classList.add('shimmer');
  }
});

socket.on('error', function(data) {
  showNotification(data.message, 'error');
});

// Inicializar mostrando la pantalla principal al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM cargado, iniciando aplicación...');
  showScreen('main-menu');
});

