/* Script para el juego Tresmil con 4 Dados */

// Variables del juego
let totalPuntosDados = 0;
let dadosBlocked = [false, false, false, false];
let valoresDadosv = ['', '', '', ''];
let tiradaEnProcesov = false;

// Valores posibles de los dados
const valoresPosibles = ['A', 'K', 'Q', 'J', 'R', 'N'];

// Imágenes para los dados
const imagenesDados = {
  'A': 'images/dados/A.png',
  'K': 'images/dados/K.png',
  'Q': 'images/dados/Q.png',
  'J': 'images/dados/J.png',
  'R': 'images/dados/R.png',
  'N': 'images/dados/N.png'
};

// Función para añadir mensajes al log
function addLog(mensaje, tipo = '') {
  const log = document.getElementById('log');
  if (log) {
    log.innerHTML += `<div class="${tipo}">${mensaje}</div>`;
    log.scrollTop = log.scrollHeight;
  }
}

// Función para limpiar el log
function limpiarLog() {
  const log = document.getElementById('log');
  if (log) {
    log.innerHTML = '';
  }
}

// Función para lanzar un dado de manera animada
function tirarDadoAnimado(id, callback) {
  const dado = document.getElementById(id);
  if (!dado) return;

  let contador = 0;
  const interval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * valores.length);
    const valorTemp = valores[randomIndex];
    dado.style.backgroundImage = `url(${imagenesDados[valorTemp]})`;
    contador++;
    if (contador > 10) {
      clearInterval(interval);
      callback();
    }
  }, 50);
}

// Función principal para lanzar los dados
function lanzarDados() {
  // Evitar múltiples tiradas simultáneas
  if (tiradaEnProceso) return;
  
  // Verificar si es nuestro turno
  const miIndice = dadosGameState.players.findIndex(p => p.id === socket.id);
  if (miIndice !== dadosGameState.currentTurn) {
    showNotification('No es tu turno', 'error');
    return;
  }
  
  tiradaEnProceso = true;
  
  // Desactivar botones durante la tirada
  document.getElementById('lanzar-dados').disabled = true;
  document.getElementById('plantarse-dados').disabled = true;
  
  // Array para almacenar los dados tirados en esta ronda
  let dadosTirados = [];
  let promesasTiradas = [];
  
  // Verificar si hay dados disponibles para tirar
  const dadosDisponibles = dadosBloqueados.filter(b => !b).length;
  addLog(`Dados disponibles para tirar: ${dadosDisponibles}`);
  
  if (dadosDisponibles === 0) {
    addLog("No hay dados disponibles para tirar. Desbloqueando todos los dados.", "mensaje-error");
    reiniciarDados();
    tiradaEnProceso = false;
    document.getElementById('lanzar-dados').disabled = false;
    document.getElementById('plantarse-dados').disabled = false;
    return;
  }
  
  // Tirar los dados no bloqueados
  for (let i = 0; i < 4; i++) {
    if (!dadosBloqueados[i]) {
      const index = i;
      promesasTiradas.push(new Promise(resolve => {
        tirarDadoAnimado(`dado${index + 1}`, () => {
          // Seleccionar un valor aleatorio
          const randomIndex = Math.floor(Math.random() * valores.length);
          const valor = valores[randomIndex];
          
          // Actualizar el valor y la visualización del dado
          valoresDados[index] = valor;
          document.getElementById(`dado${index + 1}`).style.backgroundImage = `url(${imagenesDados[valor]})`;
          
          // Registrar el dado tirado
          dadosTirados.push({ index, valor });
          resolve();
        });
      }));
    }
  }
  
  // Cuando todos los dados se hayan tirado
  Promise.all(promesasTiradas).then(() => {
    let puntos = 0;
    let puntuaron = false;
    
    // Mostrar los dados tirados
    addLog(`Dados tirados: ${dadosTirados.map(d => `Dado ${d.index + 1}: ${d.valor}`).join(', ')}`);
    
    // 1. Evaluar 3 Negras (pierdes todo)
    const negras = dadosTirados.filter(d => d.valor === 'N').length;
    if (negras === 3) {
      total = 0;
      actualizarPuntos();
      addLog('¡BANKARROTA! Que pringao!!', 'mensaje-error');
      
      // Efecto visual
      dadosTirados.forEach(d => {
        if (d.valor === 'N') {
          const dadoElement = document.getElementById(`dado${d.index + 1}`);
          dadoElement.classList.add('shake-animation');
          setTimeout(() => {
            dadoElement.classList.remove('shake-animation');
          }, 500);
        }
      });
      
      // Actualizar en el servidor
      socket.emit('updateDadosScore', { score: 0 });
      
      setTimeout(() => {
        document.getElementById('bankrupt-modal').style.display = 'flex';
        reiniciarPuntuacion();
        reiniciarDados();
        // Informar al servidor de la bancarrota
        socket.emit('dadosBankrupt');
      }, 1000);
      
      tiradaEnProceso = false;
      document.getElementById('lanzar-dados').disabled = false;
      document.getElementById('plantarse-dados').disabled = false;
      return;
    }
    
    // 2. Evaluar combinaciones de 3 iguales
    const combinaciones = {
      'A': 1000, // 3 Ases = 1000 puntos
      'K': 500,  // 3 Kayes = 500 puntos
      'Q': 400,  // 3 Qus = 400 puntos
      'J': 300,  // 3 Jotas = 300 puntos
      'R': 200   // 3 Rojos = 200 puntos
    };
    
    // Contar la frecuencia de cada valor en la tirada actual
    const conteo = {};
    dadosTirados.forEach(d => {
      conteo[d.valor] = (conteo[d.valor] || 0) + 1;
    });
    
    // Revisar si hay 3 de algún valor
    for (const [valor, pts] of Object.entries(combinaciones)) {
      if (conteo[valor] && conteo[valor] === 3) {
        puntos += pts;
        puntuaron = true;
        addLog(`¡3 ${valor}! Suman ${pts} puntos`, 'mensaje-exito');
        
        // Bloquear los dados con ese valor y añadir efecto visual
        dadosTirados.forEach(d => {
          if (d.valor === valor) {
            dadosBloqueados[d.index] = true;
            const dadoElement = document.getElementById(`dado${d.index + 1}`);
            dadoElement.classList.add('bloqueado');
            dadoElement.classList.add('highlight-animation');
            setTimeout(() => {
              dadoElement.classList.remove('highlight-animation');
            }, 1000);
            addLog(`Bloqueando dado ${d.index + 1}`);
          }
        });
        break; // Solo puede haber una combinación de 3 iguales en una tirada
      }
    }
    
    // 3. Evaluar A y K individuales (siempre y cuando no formen parte de un trío)
    for (const d of dadosTirados) {
      // Verificar que este dado no haya sido bloqueado por una combinación previa
      if (!dadosBloqueados[d.index]) {
        if (d.valor === 'A') {
          puntos += 100;
          puntuaron = true;
          dadosBloqueados[d.index] = true;
          const dadoElement = document.getElementById(`dado${d.index + 1}`);
          dadoElement.classList.add('bloqueado');
          dadoElement.classList.add('highlight-animation');
          setTimeout(() => {
            dadoElement.classList.remove('highlight-animation');
          }, 1000);
          addLog(`A individual en dado ${d.index + 1}: +100 puntos`, 'mensaje-exito');
        } else if (d.valor === 'K') {
          puntos += 50;
          puntuaron = true;
          dadosBloqueados[d.index] = true;
          const dadoElement = document.getElementById(`dado${d.index + 1}`);
          dadoElement.classList.add('bloqueado');
          dadoElement.classList.add('highlight-animation');
          setTimeout(() => {
            dadoElement.classList.remove('highlight-animation');
          }, 1000);
          addLog(`K individual en dado ${d.index + 1}: +50 puntos`, 'mensaje-exito');
        }
      }
    }
    
    // 4. Evaluar resultado de la tirada
    if (!puntuaron) {
      // Tirada sin puntuación - se pierden los puntos acumulados
      addLog('Tirada sin puntos. Pierdes los puntos no guardados.', 'mensaje-error');
      total = 0;
      
      // Efecto visual para todos los dados
      for (let i = 0; i < 4; i++) {
        const dadoElement = document.getElementById(`dado${i + 1}`);
        dadoElement.classList.add('shake-animation');
        setTimeout(() => {
          dadoElement.classList.remove('shake-animation');
        }, 500);
      }
      
      // Actualizar en el servidor
      socket.emit('updateDadosScore', { score: 0 });
      
      setTimeout(() => {
        reiniciarDados();
        // document.getElementById('bankrupt-modal').style.display = 'flex';
        // Avanzar turnox
        socket.emit('dadosFinishTurn');
      }, 1000);
      
    } else {
      // Tirada con puntuación - se suman los puntos
      total += puntos;
      addLog(`Total de puntos en esta tirada: +${puntos} (Acumulado: ${total})`, 'mensaje-exito');
      
      // Actualizar en el servidor
      socket.emit('updateDadosScore', { score: total });
      
      // Si todos los dados están bloqueados, desbloqueamos todos
      if (dadosBloqueados.every(b => b)) {
        setTimeout(() => {
          reiniciarDados();
          addLog('¡Todos los dados puntuaron! Desbloqueando para la siguiente tirada.', 'mensaje-exito');
          showNotification('¡Todos los dados puntuaron! Puedes seguir tirando o plantarte.', 'success');
        }, 1000);
      }
    }
    
    // Actualizar visualización de puntos
    actualizarPuntos();
    
    // Reactivar botones
    tiradaEnProceso = false;
    document.getElementById('lanzar-dados').disabled = false;
    document.getElementById('plantarse-dados').disabled = false;
  });
}


// Función para plantarse y guardar los puntos
function plantarseDados() {
  if (tiradaEnProceso) return;
  
  // Verificar si es nuestro turno
  const miIndice = dadosGameState.players.findIndex(p => p.id === socket.id);
  if (miIndice !== dadosGameState.currentTurn) {
    showNotification('No es tu turno', 'error');
    return;
  }
  
  addLog(`Te plantas y guardas ${total} puntos`, 'mensaje-exito');
  
  // Enviar evento al servidor para finalizar turno
  socket.emit('dadosFinishTurn');
  
  // Reiniciar variables para el siguiente jugador
  total = 0;
  reiniciarDados();
  actualizarPuntos();
}

// Función para actualizar los marcadores de puntos
function actualizarPuntos() {
  document.getElementById('dados-puntos').textContent = `+ ${total} pts`;
  
  // Buscar mi índice de jugador
  const miIndice = dadosGameState.players.findIndex(p => p.id === socket.id);
  if (miIndice !== -1) {
    const jugador = dadosGameState.players[miIndice];
    document.getElementById('dados-puntos-guardados').textContent = `Total: ${jugador.totalScore}`;
  }
}

// Función para reiniciar los dados
function reiniciarDados() {
  dadosBloqueados = [false, false, false, false];
  for (let i = 1; i <= 4; i++) {
    const dado = document.getElementById(`dado${i}`);
    if (dado) {
      dado.classList.remove('bloqueado');
      dado.classList.remove('shake-animation');
      dado.classList.remove('highlight-animation');
    }
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Evento para lanzar dados
  const btnLanzar = document.getElementById('lanzar-dados');
  if (btnLanzar) {
    btnLanzar.addEventListener('click', lanzarDados);
  }
  
  // Evento para plantarse
  const btnPlantarse = document.getElementById('plantarse-dados');
  if (btnPlantarse) {
    btnPlantarse.addEventListener('click', plantarseDados);
  }
});
