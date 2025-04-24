// Servidor Socket.io para el juego de casino

const { getGameHistory, getPlayerStats, registerGame } = require('./firebase-config');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Estructura para almacenar información de salas de juego
const gameRooms = {};

// Manejo de conexiones de Socket.io
io.on('connection', (socket) => {
  console.log(`Nuevo jugador conectado: ${socket.id}`);

  // Evento para crear una nueva sala
  socket.on('createRoom', (data) => {
    const roomId = generateRoomId();
    const playerName = data.playerName || `Jugador ${socket.id.substr(0, 4)}`;
    
    // Crear nueva sala
    gameRooms[roomId] = {
      id: roomId,
      creator: socket.id,
      players: [{
        id: socket.id,
        name: playerName,
        scores: [],
        currentRoundScore: 0,
        totalScore: 0
      }],
      currentTurn: 0,
      round: 1,
      gameStarted: false,
      maxPlayers: data.maxPlayers || 8
    };

    // Unir al creador a la sala
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerIndex = 0;

    // Notificar al creador
    socket.emit('roomCreated', {
      roomId: roomId,
      player: gameRooms[roomId].players[0],
      isCreator: true
    });

    console.log(`Sala creada: ${roomId} por jugador ${playerName}`);
  });

  // Evento para unirse a una sala existente
  socket.on('joinRoom', (data) => {
    const roomId = data.roomId;
    const playerName = data.playerName || `Jugador ${socket.id.substr(0, 4)}`;

    // Verificar si la sala existe
    if (!gameRooms[roomId]) {
      socket.emit('error', { message: 'La sala no existe' });
      return;
    }

    // Verificar si el juego ya comenzó
    if (gameRooms[roomId].gameStarted) {
      socket.emit('error', { message: 'El juego ya ha comenzado' });
      return;
    }

    // Verificar si la sala está llena
    if (gameRooms[roomId].players.length >= gameRooms[roomId].maxPlayers) {
      socket.emit('error', { message: 'La sala está llena' });
      return;
    }

    // Añadir jugador a la sala
    const playerIndex = gameRooms[roomId].players.length;
    gameRooms[roomId].players.push({
      id: socket.id,
      name: playerName,
      scores: [],
      currentRoundScore: 0,
      totalScore: 0
    });

    // Unir al jugador a la sala
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerIndex = playerIndex;

    // Notificar al jugador
    socket.emit('roomJoined', {
      roomId: roomId,
      player: gameRooms[roomId].players[playerIndex],
      isCreator: false,
      players: gameRooms[roomId].players,
      creatorId: gameRooms[roomId].creator
    });

    // Notificar a todos los jugadores en la sala
    io.to(roomId).emit('playerJoined', {
      player: gameRooms[roomId].players[playerIndex],
      players: gameRooms[roomId].players
    });

    console.log(`Jugador ${playerName} se unió a la sala ${roomId}`);
  });

  // Evento para iniciar el juego
  socket.on('startGame', () => {
    const roomId = socket.roomId;
    
    if (!roomId || !gameRooms[roomId]) {
      socket.emit('error', { message: 'No estás en una sala válida' });
      return;
    }

    // Verificar si el jugador es el creador
    if (socket.id !== gameRooms[roomId].creator) {
      socket.emit('error', { message: 'Solo el creador puede iniciar el juego' });
      return;
    }

    // Iniciar juego
    gameRooms[roomId].gameStarted = true;
    gameRooms[roomId].currentTurn = 0; // El primer jugador comienza
    
    // Notificar a todos los jugadores que el juego ha comenzado
    io.to(roomId).emit('gameStarted', {
      currentPlayer: gameRooms[roomId].players[0],
      players: gameRooms[roomId].players,
      round: gameRooms[roomId].round
    });

    console.log(`Juego iniciado en sala ${roomId}`);
  });

  // Evento para incrementar puntuación
  socket.on('increaseScore', () => {
    const roomId = socket.roomId;
    const playerIndex = socket.playerIndex;
    
    if (!roomId || !gameRooms[roomId] || playerIndex === undefined) {
      socket.emit('error', { message: 'No estás en una sala válida' });
      return;
    }

    // Verificar si es el turno del jugador
    if (gameRooms[roomId].currentTurn !== playerIndex) {
      socket.emit('error', { message: 'No es tu turno' });
      return;
    }

    // Incrementar puntuación temporal
    gameRooms[roomId].players[playerIndex].currentRoundScore += 50;
    
    // Notificar a todos los jugadores
    io.to(roomId).emit('scoreUpdated', {
      playerIndex: playerIndex,
      currentRoundScore: gameRooms[roomId].players[playerIndex].currentRoundScore,
      players: gameRooms[roomId].players
    });
  });

  // Evento para decrementar puntuación
  socket.on('decreaseScore', () => {
    const roomId = socket.roomId;
    const playerIndex = socket.playerIndex;
    
    if (!roomId || !gameRooms[roomId] || playerIndex === undefined) {
      socket.emit('error', { message: 'No estás en una sala válida' });
      return;
    }

    // Verificar si es el turno del jugador
    if (gameRooms[roomId].currentTurn !== playerIndex) {
      socket.emit('error', { message: 'No es tu turno' });
      return;
    }

    // Decrementar puntuación temporal
    gameRooms[roomId].players[playerIndex].currentRoundScore -= 50;
    
    // Notificar a todos los jugadores
    io.to(roomId).emit('scoreUpdated', {
      playerIndex: playerIndex,
      currentRoundScore: gameRooms[roomId].players[playerIndex].currentRoundScore,
      players: gameRooms[roomId].players
    });
  });

  // Evento para bancarrota
  socket.on('bankrupt', () => {
    const roomId = socket.roomId;
    const playerIndex = socket.playerIndex;
    
    if (!roomId || !gameRooms[roomId] || playerIndex === undefined) {
      socket.emit('error', { message: 'No estás en una sala válida' });
      return;
    }

    // Verificar si es el turno del jugador
    if (gameRooms[roomId].currentTurn !== playerIndex) {
      socket.emit('error', { message: 'No es tu turno' });
      return;
    }

    // Reiniciar puntuaciones del jugador
    gameRooms[roomId].players[playerIndex].scores = [];
    gameRooms[roomId].players[playerIndex].currentRoundScore = 0;
    gameRooms[roomId].players[playerIndex].totalScore = 0;
    
    // Notificar a todos los jugadores
    io.to(roomId).emit('playerBankrupt', {
      playerIndex: playerIndex,
      players: gameRooms[roomId].players
    });

    // Avanzar turno
    nextTurn(roomId);
  });

  // Evento para finalizar turno
  socket.on('finishTurn', () => {
    const roomId = socket.roomId;
    const playerIndex = socket.playerIndex;
    
    if (!roomId || !gameRooms[roomId] || playerIndex === undefined) {
      socket.emit('error', { message: 'No estás en una sala válida' });
      return;
    }

    // Verificar si es el turno del jugador
    if (gameRooms[roomId].currentTurn !== playerIndex) {
      socket.emit('error', { message: 'No es tu turno' });
      return;
    }

    const player = gameRooms[roomId].players[playerIndex];
    
    // Guardar puntuación de la ronda
    player.scores.push(player.currentRoundScore);
    player.totalScore = player.scores.reduce((a, b) => a + b, 0);
    player.currentRoundScore = 0;
    
    // Avanzar turno
    gameRooms[roomId].currentTurn = (gameRooms[roomId].currentTurn + 1) % gameRooms[roomId].players.length;
    
    // Si hemos completado una ronda (el turno vuelve al primer jugador)
    if (gameRooms[roomId].currentTurn === 0) {
      // Comprobar victoria al final de la ronda
      const winnerResult = checkVictoryCondition(roomId);
      
      // Solo avanzar a la siguiente ronda si no hubo ganador
      if (!winnerResult) {
        gameRooms[roomId].round++;
        
        // Notificar a todos los jugadores el cambio de turno
        io.to(roomId).emit('turnChanged', {
          currentPlayerIndex: gameRooms[roomId].currentTurn,
          currentPlayer: gameRooms[roomId].players[gameRooms[roomId].currentTurn],
          round: gameRooms[roomId].round,
          players: gameRooms[roomId].players
        });
      }
    } else {
      // Notificar a todos los jugadores el cambio de turno
      io.to(roomId).emit('turnChanged', {
        currentPlayerIndex: gameRooms[roomId].currentTurn,
        currentPlayer: gameRooms[roomId].players[gameRooms[roomId].currentTurn],
        round: gameRooms[roomId].round,
        players: gameRooms[roomId].players
      });
    }
  });

  // Evento para obtener historial de partidas
socket.on('getGameHistory', async () => {
  try {
    console.log(`Solicitando historial de partidas para ${socket.id}`);
    const gameHistory = await getGameHistory(20); // Obtener últimas 20 partidas
    socket.emit('gameHistoryData', gameHistory);
  } catch (error) {
    console.error('Error al obtener historial de partidas:', error);
    socket.emit('gameHistoryData', []);
  }
});

// Evento para obtener estadísticas de jugadores
socket.on('getPlayerStats', async () => {
  try {
    console.log(`Solicitando estadísticas de jugadores para ${socket.id}`);
    const playerStats = await getPlayerStats();
    socket.emit('playerStatsData', playerStats);
  } catch (error) {
    console.error('Error al obtener estadísticas de jugadores:', error);
    socket.emit('playerStatsData', []);
  }
});

  // Evento para abandonar sala/desconexión
  socket.on('disconnect', () => {
    handlePlayerDisconnect(socket);
  });

  socket.on('leaveRoom', () => {
    handlePlayerDisconnect(socket);
    socket.emit('leftRoom');
  });
});

function checkVictoryCondition(roomId) {
  if (!gameRooms[roomId]) return false;
  
  // Buscar jugadores con más de 3000 puntos
  const winners = gameRooms[roomId].players.filter(player => player.totalScore >= 3000);
  
  // Si hay ganadores, determinar el ganador final (mayor puntuación)
  if (winners.length > 0) {
    // Si hay varios con más de 3000, el ganador es el que tenga mayor puntuación
    const winner = winners.reduce((highest, player) => 
      player.totalScore > highest.totalScore ? player : highest, winners[0]);
    
    // Guardar la partida en Firebase
    const gameData = {
      id: roomId,
      players: gameRooms[roomId].players,
      winner: winner,
      rounds: gameRooms[roomId].round,
      timestamp: Date.now()
    };
    
    // Registrar la partida (función asíncrona, no es necesario esperar)
    registerGame(gameData)
      .then(id => console.log(`Partida guardada con ID: ${id}`))
      .catch(error => console.error('Error al guardar partida:', error));
    
    // Notificar a todos los jugadores
    io.to(roomId).emit('gameWon', {
      winner: winner,
      players: gameRooms[roomId].players
    });
    
    // Reiniciar sala para nueva partida después de 10 segundos
    setTimeout(() => {
      delete gameRooms[roomId];
    }, 10000);
    
    return true; // Indicar que hay un ganador
  }
  
  return false; // Indicar que no hay ganador
}

// Función para avanzar al siguiente turno
function nextTurn(roomId) {
  if (!gameRooms[roomId]) return;
  
  gameRooms[roomId].currentTurn = (gameRooms[roomId].currentTurn + 1) % gameRooms[roomId].players.length;
  
  // Si hemos completado una ronda
  if (gameRooms[roomId].currentTurn === 0) {
    gameRooms[roomId].round++;
  }
  
  // Notificar a todos los jugadores
  io.to(roomId).emit('turnChanged', {
    currentPlayerIndex: gameRooms[roomId].currentTurn,
    currentPlayer: gameRooms[roomId].players[gameRooms[roomId].currentTurn],
    round: gameRooms[roomId].round,
    players: gameRooms[roomId].players
  });
}

// Función para manejar la desconexión de un jugador
function handlePlayerDisconnect(socket) {
  const roomId = socket.roomId;
  const playerIndex = socket.playerIndex;
  
  if (!roomId || !gameRooms[roomId]) return;
  
  console.log(`Jugador ${socket.id} desconectado de la sala ${roomId}`);
  
  const isCreator = socket.id === gameRooms[roomId].creator;
  
  // Eliminar jugador de la sala
  gameRooms[roomId].players = gameRooms[roomId].players.filter(player => player.id !== socket.id);
  
  // Actualizar índices de jugadores
  for (let i = 0; i < gameRooms[roomId].players.length; i++) {
    const player = gameRooms[roomId].players[i];
    const playerSocket = io.sockets.sockets.get(player.id);
    if (playerSocket) {
      playerSocket.playerIndex = i;
    }
  }
  
  // Si era el creador, asignar un nuevo creador si hay jugadores
  if (isCreator && gameRooms[roomId].players.length > 0) {
    gameRooms[roomId].creator = gameRooms[roomId].players[0].id;
  }
  
  // Si no hay más jugadores, eliminar la sala
  if (gameRooms[roomId].players.length === 0) {
    delete gameRooms[roomId];
    return;
  }
  
  // Notificar a todos los jugadores
  io.to(roomId).emit('playerLeft', {
    playerId: socket.id,
    players: gameRooms[roomId].players,
    newCreator: isCreator ? gameRooms[roomId].creator : null
  });
  
  // Si el juego ya comenzó y era el turno del jugador que se fue
  if (gameRooms[roomId].gameStarted && gameRooms[roomId].currentTurn >= gameRooms[roomId].players.length) {
    gameRooms[roomId].currentTurn = 0;
    
    // Notificar cambio de turno
    io.to(roomId).emit('turnChanged', {
      currentPlayerIndex: gameRooms[roomId].currentTurn,
      currentPlayer: gameRooms[roomId].players[gameRooms[roomId].currentTurn],
      round: gameRooms[roomId].round,
      players: gameRooms[roomId].players
    });
  }
}

// Generar ID único para sala
function generateRoomId() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor del juego de casino corriendo en puerto ${PORT}`);
});