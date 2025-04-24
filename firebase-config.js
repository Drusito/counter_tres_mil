// Configuración de Firebase
const admin = require('firebase-admin');

// Credenciales de Firebase
const serviceAccount = {
  "type": "service_account",
  "project_id": "tresmill",
  "private_key_id": "e6af28ed6a76f7d95cc4387b9a111e878e55cb21",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDs2BF4AWj38gvx\nCGH7xzN7yNK8ifWYrtacd4umaczz/QcLOuZvFxzP4JfCcnDkOJeiupWyzps7Pro9\n4ZV77NwlldW8Nc2Muol1SLU5JyPTUtE4jnejfHLd6GBVvL0umNwTYbcL9y02ltOr\nz/xtN94h9N0qEww9cRgN0j8WyXLXQBOchpRRsabuvZt7WBR878L6EwhDqT8nwhp0\nWsLCco8bCDdbSrH97xkWkkqd3e2sMZ9VJMBzuMN6EllmIJRRvzZK4ZJ8ITcRmXqt\nQApawUnliik4kpZc+I6MIFrevr0c/N15PVz2wiH82rCNWKCPnvdei2AYgP+LF+tz\n2uU4lCmrAgMBAAECggEAJFLC4xe8RIJ/qFizxkx3rd1PzJCP9Pmjel2vMjd5slW0\n9djzrEfsKEl2nOC2RZoUT2W0PbcIAZ8OKx1kspvR64W+QN4zhwi4uh8LhBdnnCpQ\nYg8fdBhK+ZOA6sVGclYJMoPC8ffXnE6naes8+Hcf/y8xmBlRwD6PBNegy1rb3Pzw\nO2CrcbStsa+H3coEOotWW7ENs+E2lq60+UbI3b8+xd80SY3L632CywEbAXU2PskP\ncvIXqIaM6ZLI3TL7btORqYFLw/P1EI9HaW+xjEi0Z5pQCjM8/tcdR4+tJj2uKo66\nXKMKIc9dAcC89GZTPqjGFbXnz/SmuV8NyY0yNrEggQKBgQD6IW669YQxpkzXHu7q\nDPAdaySZ/m1/tq/mL3APPuD4WuD7XhPDT0lzOn3MSgpo37heNF+KD3e23vzzor9R\nFlygvPhB4e2caFihv2u8wFU63tm4911LxnkuWyS8uWMz+wIBSQ3sRstTeMTrMXZ3\nN8TdfEXrz+osScsQXlteze03wQKBgQDyZtJLdOFk7AD29kDSF8f/POG2DAEUB9I0\n4YNdie7y8wsI7X9U7/eG7QUviLjb7piGlbccs7crHaaq90Q16n3zvas8wTqVHvel\no7VohpMPtLvOqMm54+X94o/CXdRA6z9TZ4wOLD7dxQPL5ra+eJSgDEwWrzjMOYmZ\nE1VnS4TcawKBgQCT6d9UOcmxnpkEAWvhBkOb8fcUBYv1ITBFm7nVmiZpVzyCCTEA\np0tVE7q+au5a9ClPtALnXpw5jQXigVRHfETMXNMmCpd7jY0UIWFxnf8IsC3qHoWS\nQMz6Z7WC0NJkM8QMxImyNm8YbmtsdbSLbXRCUbH7b9kX1Y96n4HCv13PQQKBgCnc\no/iwCLTbJReBU5R00u87XmeIDy+cYisLvxoKVh/S5Vb3XQQYJRFCIaEh5Xrl66Vi\neasVRk7F4iCobzk4c+QCH25wmGNkY7RRX2TbyM3vkneQIrZdqzx7QgR5G8zSU69d\ntIxGC91UxuERyQF/5Xr2ZLWOMSrjzOWItzkNi7ZdAoGBAJ/Bwn8QABsF1RH8Mh5C\nnaFIg3+UT7xd+Dc7Y0bphTqj28A2m3BG2Uyw0rUTX+Dyv4/nmKyH5XNlr+dOmVn9\nmUKTtFOjevcf5JsYmckTL/MywDHW2roz3C2I45uEpmUM2m1hWxef7qOPW6KRNEpK\nKzDlzpVTc/aOkampGcIz/RFd\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@tresmill.iam.gserviceaccount.com",
  "client_id": "103040785828052573527",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40tresmill.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

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
