// Aplicación cliente para el juego de casino online
(function() {
    // Variables globales
    const socket = io();
    let playerData = {};
    let gameState = {
      roomId: null,
      players: [],
      isCreator: false,
      currentTurn: 0,
      round: 1
    };
  
    // Elementos DOM
    const screens = {
      welcome: document.getElementById('welcome-screen'),
      joinRoom: document.getElementById('join-room-screen'),
      waitingRoom: document.getElementById('waiting-room-screen'),
      game: document.getElementById('game-screen')
    };
  
    // Botones y elementos interactivos
    const elements = {
      playerNameInput: document.getElementById('player-name'),
      createRoomBtn: document.getElementById('create-room-btn'),
      joinRoomBtn: document.getElementById('join-room-btn'),
      roomCodeInput: document.getElementById('room-code'),
      confirmJoinBtn: document.getElementById('confirm-join-btn'),
      backToWelcomeBtn: document.getElementById('back-to-welcome-btn'),
      roomCodeDisplay: document.getElementById('room-code-display'),
      playerList: document.getElementById('player-list'),
      creatorControls: document.getElementById('creator-controls'),
      startGameBtn: document.getElementById('start-game-btn'),
      leaveRoomBtn: document.getElementById('leave-room-btn'),
      roundCounter: document.getElementById('round-counter'),
      currentPlayerName: document.getElementById('current-player-name'),
      countersContainer: document.getElementById('counters-container'),
      gameControls: document.getElementById('game-controls'),
      decreaseBtn: document.getElementById('decrease-btn'),
      increaseBtn: document.getElementById('increase-btn'),
      bankruptBtn: document.getElementById('bankrupt-btn'),
      finishTurnBtn: document.getElementById('finish-turn-btn'),
      bankruptModal: document.getElementById('bankrupt-modal'),
      victoryModal: document.getElementById('victory-modal'),
      winnerName: document.getElementById('winner-name'),
      winnerScore: document.getElementById('winner-score'),
      newGameBtn: document.getElementById('new-game-btn'),
      notification: document.getElementById('notification')
    };
  
    // Inicializar la aplicación
    function init() {
      // Mostrar pantalla de bienvenida
      showScreen('welcome');
      
      // Eventos de UI
      setupEventListeners();
      
      // Conectar eventos del socket
      setupSocketListeners();
    }
  
    // Configurar listeners de eventos
    function setupEventListeners() {
      // Pantalla de bienvenida
      elements.createRoomBtn.addEventListener('click', createRoom);
      elements.joinRoomBtn.addEventListener('click', () => showScreen('joinRoom'));
      
      // Pantalla de unirse a sala
      elements.confirmJoinBtn.addEventListener('click', joinRoom);
      elements.backToWelcomeBtn.addEventListener('click', () => showScreen('welcome'));
      
      // Pantalla de sala de espera
      elements.startGameBtn.addEventListener('click', startGame);
      elements.leaveRoomBtn.addEventListener('click', leaveRoom);
      
      // Pantalla de juego
      elements.increaseBtn.addEventListener('click', increaseScore);
      elements.decreaseBtn.addEventListener('click', decreaseScore);
      elements.bankruptBtn.addEventListener('click', declareBankruptcy);
      elements.finishTurnBtn.addEventListener('click', finishTurn);
      
      // Cerrar modal de bancarrota
      document.querySelector('#bankrupt-modal .close-button').addEventListener('click', () => {
        elements.bankruptModal.style.display = 'none';
      });
      
      // Nueva partida
      elements.newGameBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  
    // Configurar listeners de socket
    function setupSocketListeners() {
      // Conexión y errores
      socket.on('connect', () => {
        console.log('Conectado al servidor');
      });
      
      socket.on('disconnect', () => {
        showNotification('Desconectado del servidor. Reconectando...', 'error');
      });
      
      socket.on('error', (data) => {
        showNotification(data.message, 'error');
      });
      
      // Eventos de sala
      socket.on('roomCreated', handleRoomCreated);
      socket.on('roomJoined', handleRoomJoined);
      socket.on('playerJoined', handlePlayerJoined);
      socket.on('playerLeft', handlePlayerLeft);
      
      // Eventos de juego
      socket.on('gameStarted', handleGameStarted);
      socket.on('turnChanged', handleTurnChanged);
      socket.on('scoreUpdated', handleScoreUpdated);
      socket.on('playerBankrupt', handlePlayerBankrupt);
      socket.on('gameWon', handleGameWon);
    }
  
    // Funciones de administración de pantallas
    function showScreen(screenName) {
      // Ocultar todas las pantallas
      Object.values(screens).forEach(screen => {
        screen.classList.add('hidden');
      });
      
      // Mostrar la pantalla solicitada
      screens[screenName].classList.remove('hidden');
    }
  
    // Funciones para interactuar con el servidor
    function createRoom() {
      const playerName = elements.playerNameInput.value.trim() || `Jugador${Math.floor(Math.random() * 1000)}`;
      
      socket.emit('createRoom', {
        playerName: playerName,
        maxPlayers: 8
      });
    }
  
    function joinRoom() {
      const playerName = elements.playerNameInput.value.trim() || `Jugador${Math.floor(Math.random() * 1000)}`;
      const roomCode = elements.roomCodeInput.value.trim().toUpperCase();
      
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
      showScreen('welcome');
    }
  
    function startGame() {
      socket.emit('startGame');
    }
  
    // Funciones de juego
    function increaseScore() {
      socket.emit('increaseScore');
    }
  
    function decreaseScore() {
      socket.emit('decreaseScore');
    }
  
    function declareBankruptcy() {
      socket.emit('bankrupt');
    }
  
    function finishTurn() {
      socket.emit('finishTurn');
    }
  
    // Manejadores de eventos del socket
    function handleRoomCreated(data) {
      gameState.roomId = data.roomId;
      gameState.isCreator = true;
      playerData = data.player;
      
      elements.roomCodeDisplay.textContent = data.roomId;
      updatePlayerList([data.player]);
      
      elements.creatorControls.classList.remove('hidden');
      showScreen('waitingRoom');
      showNotification('Sala creada con éxito', 'success');
    }
  
    function handleRoomJoined(data) {
      gameState.roomId = data.roomId;
      gameState.isCreator = data.isCreator;
      gameState.players = data.players;
      playerData = data.player;
      
      elements.roomCodeDisplay.textContent = data.roomId;
      updatePlayerList(data.players);
      
      if (data.isCreator) {
        elements.creatorControls.classList.remove('hidden');
      } else {
        elements.creatorControls.classList.add('hidden');
      }
      
      showScreen('waitingRoom');
      showNotification('Te has unido a la sala', 'success');
    }
  
    function handlePlayerJoined(data) {
      gameState.players = data.players;
      updatePlayerList(data.players);
      showNotification(`${data.player.name} se ha unido a la sala`, 'info');
    }
  
    function handlePlayerLeft(data) {
      gameState.players = data.players;
      updatePlayerList(data.players);
      
      // Si hay un nuevo creador y somos nosotros
      if (data.newCreator && data.newCreator === socket.id) {
        gameState.isCreator = true;
        elements.creatorControls.classList.remove('hidden');
        showNotification('Ahora eres el anfitrión de la sala', 'info');
      }
      
      showNotification('Un jugador ha abandonado la sala', 'info');
    }
  
    function handleGameStarted(data) {
      gameState.players = data.players;
      gameState.currentTurn = 0;
      gameState.round = data.round;
      
      elements.roundCounter.textContent = `Ronda: ${data.round}`;
      elements.currentPlayerName.textContent = data.currentPlayer.name;
      
      // Crear los contadores de los jugadores
      createPlayerCounters(data.players);
      
      // Mostrar controles si es nuestro turno
      if (data.currentPlayer.id === socket.id) {
        elements.gameControls.classList.remove('hidden');
      } else {
        elements.gameControls.classList.add('hidden');
      }
      
      showScreen('game');
      showNotification('¡El juego ha comenzado!', 'success');
    }
  
    function handleTurnChanged(data) {
      gameState.currentTurn = data.currentPlayerIndex;
      gameState.round = data.round;
      gameState.players = data.players;
      
      elements.roundCounter.textContent = `Ronda: ${data.round}`;
      elements.currentPlayerName.textContent = data.currentPlayer.name;
      
      // Actualizar visualización de los contadores
      updatePlayerCounters(data.players);
      
      // Mostrar controles si es nuestro turno
      if (data.currentPlayer.id === socket.id) {
        elements.gameControls.classList.remove('hidden');
        showNotification('¡Es tu turno!', 'info');
      } else {
        elements.gameControls.classList.add('hidden');
      }
    }
  
    function handleScoreUpdated(data) {
      gameState.players = data.players;
      
      // Actualizar la puntuación actual del jugador
      const playerCounter = document.getElementById(`player-${data.playerIndex}`);
      if (playerCounter) {
        const currentRoundScore = playerCounter.querySelector('.current-round-score');
        if (currentRoundScore) {
          currentRoundScore.textContent = `Esta ronda: ${data.currentRoundScore}`;
        }
      }
    }
  
    function handlePlayerBankrupt(data) {
      gameState.players = data.players;
      
      // Actualizar visualización de los contadores
      updatePlayerCounters(data.players);
      
      // Mostrar el modal de bancarrota si somos el jugador
      if (data.playerIndex === gameState.players.findIndex(p => p.id === socket.id)) {
        elements.bankruptModal.style.display = 'flex';
      }
      
      showNotification(`¡${gameState.players[data.playerIndex].name} ha caído en bancarrota!`, 'warning');
    }
  
    function handleGameWon(data) {
      // Mostrar modal de victoria
      elements.winnerName.textContent = data.winner.name;
      elements.winnerScore.textContent = data.winner.totalScore;
      elements.victoryModal.style.display = 'flex';
      
      // Ocultar controles de juego
      elements.gameControls.classList.add('hidden');
      
      // Si somos el ganador, añadir efectos especiales
      if (data.winner.id === socket.id) {
        document.body.classList.add('shimmer');
      }
    }
  
    // Funciones de UI
    function updatePlayerList(players) {
      elements.playerList.innerHTML = '';
      
      players.forEach((player, index) => {
        const li = document.createElement('li');
        
        const iconSpan = document.createElement('span');
        iconSpan.className = 'player-icon';
        iconSpan.innerHTML = '<i class="fas fa-user"></i>';
        li.appendChild(iconSpan);
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = player.name;
        li.appendChild(nameSpan);
        
        // Marcar el creador de la sala
        if (player.id === gameState.players.find(p => p.id === gameState.roomCreator)?.id) {
          const creatorBadge = document.createElement('span');
          creatorBadge.className = 'creator-badge';
          creatorBadge.textContent = 'Anfitrión';
          li.appendChild(creatorBadge);
        }
        
        elements.playerList.appendChild(li);
      });
    }
  
    function createPlayerCounters(players) {
      elements.countersContainer.innerHTML = '';
      
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
        
        elements.countersContainer.appendChild(counterDiv);
      });
    }
  
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
  
    function showNotification(message, type = 'info') {
      const notification = elements.notification;
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
  
    // Iniciar la aplicación
    init();
  })();