let currentTurn = 1;  // Turno actual
let round = 1;  // Contador de rondas
let totalPlayers = 0;  // Número total de jugadores

function createNameInputs() {
  totalPlayers = document.getElementById('playerCount').value;
  const nameInputsDiv = document.getElementById('nameInputs');
  nameInputsDiv.innerHTML = '';

  for (let i = 1; i <= totalPlayers; i++) {
    const inputLabel = document.createElement('label');
    
    //inputLabel.textContent = `Nombre del Jugador ${i}:`;

    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.id = `playerName${i}`;
    inputField.placeholder = `Nombre del Jugador ${i}`;

    nameInputsDiv.appendChild(inputLabel);
    nameInputsDiv.appendChild(inputField);
  }

  document.getElementById('generateButton').style.display = 'block';
}

function generateCounters() {
  const countersDiv = document.getElementById('counters');
  const nameInputsDiv = document.getElementById('nameInputs');
  const generateButton = document.getElementById('generateButton');

  nameInputsDiv.style.display = 'none';
  generateButton.style.display = 'none';
  countersDiv.innerHTML = '';

  // Crear los contadores para cada jugador
  for (let i = 1; i <= totalPlayers; i++) {
    const playerName = document.getElementById(`playerName${i}`).value || `Jugador ${i}`;
    const counterDiv = document.createElement('div');
    counterDiv.className = 'counter';
    counterDiv.id = `counter${i}`;  // Asignamos un ID único para cada contador

    const title = document.createElement('h3');
    title.textContent = playerName;
    counterDiv.appendChild(title);

    const countDisplay = document.createElement('p');
    countDisplay.textContent = '0';
    countDisplay.className = 'count';
    counterDiv.appendChild(countDisplay);

    const trashButton = document.createElement('button');
    trashButton.classList.add('trash-button');
    trashButton.textContent = '-';
    trashButton.onclick = () => {
      countDisplay.textContent = parseInt(countDisplay.textContent) - 50;
    };

    const incrementButton = document.createElement('button');
    incrementButton.textContent = '+';
    incrementButton.classList.add('plus-button');
    incrementButton.onclick = () => {
      countDisplay.textContent = parseInt(countDisplay.textContent) + 50;
    };

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.appendChild(trashButton);
    buttonContainer.appendChild(incrementButton);

    counterDiv.appendChild(buttonContainer);

    // Crear el botón "Siguiente Turno" solo en el contador del jugador cuyo turno es
    const nextTurnButton = document.createElement('button');
    nextTurnButton.className = 'next-turn-button';
    nextTurnButton.textContent = '→';
    nextTurnButton.onclick = () => {
      nextTurn(); // Llamamos a la función de siguiente turno
    };
    nextTurnButton.style.display = i === currentTurn ? 'block' : 'none';  // Mostrar solo en el turno actual
    counterDiv.appendChild(nextTurnButton);

    countersDiv.appendChild(counterDiv);
  }

  highlightCurrentTurn();
  disableAllButtonsExceptCurrent();
  document.getElementById('controls').style.display = 'none';
}

function nextTurn() {
  currentTurn++;
  if (currentTurn > totalPlayers) {
    currentTurn = 1;
    round++;
    document.getElementById('roundCounter').textContent = `Ronda: ${round}`;
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
      nextTurnButton.style.display = 'block';  // Mostrar el botón en el turno actual
    } else {
      counter.classList.remove('current-turn');
      nextTurnButton.style.display = 'none';  // Ocultar el botón en otros turnos
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
