let currentTurn = 1;  // Turno actual
let round = 1;  // Contador de rondas
let totalPlayers = 0;  // Número total de jugadores
let playerScores = []; // Array para almacenar los arrays de puntuaciones de los jugadores
let currentRoundScores = []; // Array temporal para almacenar las puntuaciones acumuladas de la ronda

function createNameInputs() {
  totalPlayers = document.getElementById('playerCount').value;
  const nameInputsDiv = document.getElementById('nameInputs');
  nameInputsDiv.innerHTML = '';
  playerScores = []; // Reiniciar puntuaciones al crear nuevos jugadores
  currentRoundScores = []; // Reiniciar las puntuaciones de la ronda

  for (let i = 1; i <= totalPlayers; i++) {
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.id = `playerName${i}`;
    inputField.placeholder = `Nombre del Jugador ${i}`;
    nameInputsDiv.appendChild(inputField);

    // Inicializar las puntuaciones de los jugadores con un array vacío
    playerScores.push([]);
    currentRoundScores.push(0);  // Inicializar la puntuación de la ronda del jugador
  }

  document.getElementById('generateButton').style.display = 'block';
}

function generateCounters() {
  const countersDiv = document.getElementById('counters');
  const nameInputsDiv = document.getElementById('nameInputs');
  const generateButton = document.getElementById('generateButton');
  const controls = document.getElementById('controls');

  nameInputsDiv.style.display = 'none';
  generateButton.style.display = 'none';
  countersDiv.innerHTML = '';

  for (let i = 1; i <= totalPlayers; i++) {
    const playerName = document.getElementById(`playerName${i}`).value || `Jugador ${i}`;
    const counterDiv = document.createElement('div');
    counterDiv.className = 'counter';
    counterDiv.id = `counter${i}`;

    const title = document.createElement('h3');
    title.textContent = playerName;
    counterDiv.appendChild(title);

    const countDisplay = document.createElement('p');
    countDisplay.textContent = playerScores[i - 1].reduce((a, b) => a + b, 0); // Mostrar la suma de las puntuaciones
    countDisplay.className = 'count';
    counterDiv.appendChild(countDisplay);

    const trashButton = document.createElement('button');
    trashButton.classList.add('trash-button');
    trashButton.textContent = '-';
    trashButton.onclick = () => {
      currentRoundScores[i - 1] -= 50; // Restar 50 temporalmente
      countDisplay.textContent = currentRoundScores[i - 1]; // Mostrar puntuación temporal
    };

    const incrementButton = document.createElement('button');
    incrementButton.textContent = '+';
    incrementButton.classList.add('plus-button');
    incrementButton.onclick = () => {
      currentRoundScores[i - 1] += 50; // Sumar 50 temporalmente
      countDisplay.textContent = currentRoundScores[i - 1]; // Mostrar puntuación temporal
    };

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.appendChild(trashButton);
    buttonContainer.appendChild(incrementButton);

    counterDiv.appendChild(buttonContainer);

    // Crear el botón "Siguiente Turno" solo en el contador del jugador cuyo turno es
    const nextTurnButton = document.createElement('button');
nextTurnButton.className = 'next-turn-button';
nextTurnButton.textContent = '👍';
nextTurnButton.style.fontSize = '40px';
nextTurnButton.onclick = () => {
    nextTurn(countDisplay, i - 1); // Llamamos a la función de siguiente turno y pasamos el índice
};
nextTurnButton.style.display = i === currentTurn ? 'block' : 'none';

// Agregar el botón como el primer hijo de <main>
document.querySelector('main').appendChild(nextTurnButton);

countersDiv.insertAdjacentElement('afterend', nextTurnButton);

    // Crear el botón "X" para mostrar el modal de "BANKARROTA" con una imagen en vez de texto
    const bankruptButton = document.createElement('button');
    // bankruptButton.classList.add('no-style');
    bankruptButton.className = 'bankrupt-button';
    bankruptButton.textContent = '💀';
    bankruptButton.style.fontSize = '40px'; 
    

    bankruptButton.onclick = showBankruptPopup;

    bankruptButton.style.position = 'absolute';
    bankruptButton.style.top = '45%';
    bankruptButton.style.left = '5px';
    bankruptButton.style.transform = 'translateY(-50%) scale(0.6)';
    counterDiv.appendChild(bankruptButton);

    countersDiv.appendChild(counterDiv);
    controls.classList.add('hidden');
    disableAllButtonsExceptCurrent();
  }
}

function showBankruptPopup() {
  // Obtener el jugador cuyo turno es el actual
  const playerIndex = currentTurn - 1;

  // Obtener el contenedor de la puntuación
  const countDisplay = document.querySelector(`#counter${currentTurn} .count`);

  // Poner todas las puntuaciones del jugador a 0
  playerScores[playerIndex] = [];  // Resetear todas las puntuaciones del jugador

  // Actualizar la puntuación visual a 0
  countDisplay.textContent = 0;

  // Crear y mostrar el panel de bancarrota
  const modal = document.getElementById('modal');
  modal.style.display = 'flex';

  const closeButton = document.querySelector('.close-button');
  closeButton.onclick = () => {
    modal.style.display = 'none';
  };

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}


function nextTurn(countDisplay, playerIndex) {
  // Guardar la puntuación acumulada de la ronda
  playerScores[playerIndex].push(currentRoundScores[playerIndex]);

  // Mostrar el array del jugador actual después de añadir los puntos
  console.log(`Puntuaciones del Jugador ${playerIndex + 1}:`, playerScores[playerIndex]);

  // Actualizar el contador con la suma de las puntuaciones
  countDisplay.textContent = playerScores[playerIndex].reduce((a, b) => a + b, 0); 

  // Reiniciar la puntuación temporal para la siguiente ronda
  currentRoundScores[playerIndex] = 0;

  currentTurn++;
  if (currentTurn > totalPlayers) {
    currentTurn = 1;
    round++;
    document.getElementById('roundCounter').textContent = `Ronda: ${round}`;
  
    // Verificar si algún jugador ha superado los 3000 puntos
    const playersAbove3000 = [];

    playerScores.forEach((scores, index) => {
      const totalScore = scores.reduce((a, b) => a + b, 0); // Calcular la puntuación total del jugador
      if (totalScore >= 3000) {
        console.log(`El Jugador ${index + 1} ha superado los 3000 puntos con ${totalScore} puntos.`);
        playersAbove3000.push({ index, totalScore, name: document.getElementById(`playerName${index + 1}`).value || `Jugador ${index + 1}` });
      }
    });

    if (playersAbove3000.length > 0) {
      // Si hay más de un jugador con más de 3000 puntos, se determina el ganador
      const winner = playersAbove3000.reduce((max, player) => (player.totalScore > max.totalScore ? player : max));

      // Mostrar el panel de victoria
      showVictoryPanel(winner);
    }
  }
  
  highlightCurrentTurn();
  disableAllButtonsExceptCurrent();
}

function highlightCurrentTurn() {
  const allCounters = document.querySelectorAll('.counter');
  allCounters.forEach((counter, index) => {
    const nextTurnButton = counter.querySelector('.next-turn-button');
    if (index === currentTurn - 1) {
      counter.classList.add('current-turn');
      nextTurnButton.style.display = 'block';
    } else {
      counter.classList.remove('current-turn');
      nextTurnButton.style.display = 'none';
    }
  });
}

function disableAllButtonsExceptCurrent() {
  const allButtons = document.querySelectorAll('.counter button');
  allButtons.forEach(button => {
    button.disabled = true;
  });

  const currentCounterButtons = document.querySelectorAll(`#counter${currentTurn} button`);
  currentCounterButtons.forEach(button => {
    button.disabled = false;
  });
}

// Función para mostrar el panel de victoria
function showVictoryPanel(winner) {
  const victoryPanel = document.createElement('div');
  victoryPanel.classList.add('victory-panel');  // Agregar la clase para los estilos

  // Crear contenido dentro del panel
  const title = document.createElement('h1');
  title.textContent = '¡Victoria!';

  const message = document.createElement('p');
  message.classList.add('message');
  message.innerHTML = `¡TE HAS HECHO CON LA VICTORIA CABRONAZO!<br><br><br> <strong style="font-size: 50px;">${winner.name}</strong><br><br><br>Con ${winner.totalScore} miserables puntos.`;

  // Añadir todo al panel de victoria
  victoryPanel.appendChild(title);
  victoryPanel.appendChild(message);

  // Mostrar el panel
  document.body.appendChild(victoryPanel);
}


// Función para mostrar la tabla de puntuaciones
function showFinalScores() {
  const tableDiv = document.createElement('div');
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.marginTop = '20px';
  table.style.textAlign = 'center';

  const headerRow = document.createElement('tr');
  const playerHeader = document.createElement('th');
  playerHeader.textContent = 'Jugador';
  const scoreHeader = document.createElement('th');
  scoreHeader.textContent = 'Puntuación';
  headerRow.appendChild(playerHeader);
  headerRow.appendChild(scoreHeader);
  table.appendChild(headerRow);

  for (let i = 1; i <= totalPlayers; i++) {
    const row = document.createElement('tr');
    const playerCell = document.createElement('td');
    playerCell.textContent = document.getElementById(`playerName${i}`).value || `Jugador ${i}`;
    const scoreCell = document.createElement('td');
    scoreCell.textContent = playerScores[i - 1].reduce((a, b) => a + b, 0); // Sumar las puntuaciones de todas las rondas
    row.appendChild(playerCell);
    row.appendChild(scoreCell);
    table.appendChild(row);
  }

  tableDiv.appendChild(table);
  document.body.appendChild(tableDiv);
}