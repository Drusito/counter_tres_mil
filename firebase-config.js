// Configuración de Firebase
const admin = require('firebase-admin');

// Credenciales de Firebase
const serviceAccount = require('/etc/secrets/firebase-credentials.json');

let db;

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://tresmill-default-rtdb.europe-west1.firebasedatabase.app"
  });

  db = admin.database();
  console.log('Conexión a Firebase establecida correctamente.');
} catch (error) {
  console.error('Error al inicializar Firebase:', error);
  db = {
    ref: () => ({
      push: async () => ({ key: 'offline-' + Date.now() }),
      child: () => ({
        once: async () => ({ exists: () => false, val: () => null }),
        set: async () => null
      }),
      orderByChild: () => ({
        limitToLast: () => ({
          once: async () => ({
            forEach: () => null,
            val: () => null
          })
        }),
        once: async () => ({
          forEach: () => null,
          val: () => null
        })
      })
    })
  };
}

async function registerGame(gameData) {
  try {
    if (!db) return null;

    const gamesRef = db.ref('games');
    const newGameRef = await gamesRef.push(gameData);

    // Añadir ID al gameData antes de actualizar estadísticas
    gameData.id = newGameRef.key;

    console.log('Partida registrada con ID:', newGameRef.key);

    await updatePlayerStats(gameData);

    return newGameRef.key;
  } catch (error) {
    console.error('Error al registrar partida:', error);
    return null;
  }
}

async function updatePlayerStats(gameData) {
  try {
    if (!db) return;

    const playersRef = db.ref('players');

    for (const player of gameData.players) {
      if (!player.name) continue;

      const playerName = player.name;
      const isWinner = player.id === gameData.winner.id;
      const score = player.totalScore;

      const playerRef = playersRef.child(encodePlayerName(playerName));
      const snapshot = await playerRef.once('value');

      const playerData = snapshot.exists() ? snapshot.val() : {
        name: playerName,
        totalGames: 0,
        wins: 0,
        totalScore: 0,
        highestScore: 0,
        lowestScore: score > 0 ? score : 0,
        gamesPlayed: []
      };

      playerData.totalGames += 1;
      if (isWinner) playerData.wins += 1;
      playerData.totalScore += score;
      playerData.highestScore = Math.max(playerData.highestScore, score);

      if (score > 0) {
        if (playerData.lowestScore === 0 || score < playerData.lowestScore) {
          playerData.lowestScore = score;
        }
      }

      if (!playerData.gamesPlayed) playerData.gamesPlayed = [];
      playerData.gamesPlayed.push(gameData.id);

      await playerRef.set(playerData);
    }
  } catch (error) {
    console.error('Error al actualizar estadísticas de jugador:', error);
  }
}

async function getGameHistory(limit = 10) {
  try {
    if (!db) return [];

    const gamesRef = db.ref('games');
    const snapshot = await gamesRef.orderByChild('timestamp').limitToLast(limit).once('value');
    const games = [];

    snapshot.forEach(childSnapshot => {
      games.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    return games.reverse();
  } catch (error) {
    console.error('Error al obtener historial de partidas:', error);
    return [];
  }
}

async function getPlayerStats() {
  try {
    if (!db) return [];

    const playersRef = db.ref('players');
    const snapshot = await playersRef.orderByChild('wins').once('value');
    const players = [];

    snapshot.forEach(childSnapshot => {
      players.push(childSnapshot.val());
    });

    return players.sort((a, b) => b.wins - a.wins);
  } catch (error) {
    console.error('Error al obtener estadísticas de jugadores:', error);
    return [];
  }
}

function encodePlayerName(name) {
  return name.replace(/[.#$/[\]]/g, '_');
}

module.exports = {
  db,
  registerGame,
  getGameHistory,
  getPlayerStats
};
