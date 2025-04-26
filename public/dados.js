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
  const dadoId = parseInt(id.replace('dado', '')) - 1; // Convertir 'dado1' a índice 0
  
  // Generar secuencia completa de valores para la animación
  const secuenciaAnimacion = [];
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * valores.length);
    secuenciaAnimacion.push(valores[randomIndex]);
  }
  
  // Enviar la secuencia completa al servidor para sincronización
  if (socket && socket.dadosRoomId) {
    socket.emit('dadosAnimacionSecuencia', {
      dadoId: dadoId,
      secuencia: secuenciaAnimacion
    });
  }
  
  // Ejecutar la animación localmente
  const interval = setInterval(() => {
    if (contador >= secuenciaAnimacion.length) {
      clearInterval(interval);
      callback();
      return;
    }
    
    const valorTemp = secuenciaAnimacion[contador];
    
    // Actualizar la visualización local
    dado.textContent = valorTemp;
    dado.style.backgroundImage = `url(images/dados/${valorTemp}.png)`;
    
    contador++;
  }, 50);
}

// Función para reiniciar puntuación
function reiniciarPuntuacion() {
  total = 0;
  actualizarPuntos();
}

// Función para actualizar los puntos mostrados
function actualizarPuntos() {
  document.getElementById('dados-puntos').textContent = `+ ${total} pts`;
  
  // Buscar mi índice de jugador
  const miIndice = dadosGameState.players.findIndex(p => p.id === socket.id);
  if (miIndice !== -1) {
    const jugador = dadosGameState.players[miIndice];
    document.getElementById('dados-puntos-guardados').textContent = `Total: ${jugador.totalScore || 0}`;
  }
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
  
  // Verificar si hay dados disponibles para tirar
  const dadosDisponibles = dadosBloqueados.filter(b => !b).length;
  
  if (dadosDisponibles === 0) {
    addLog("No hay dados disponibles para tirar. Desbloqueando todos los dados.", "mensaje-info");
    
    // Enviar evento de reinicio de dados a todos
    socket.emit('dadosReiniciar');
    
    reiniciarDados();
    tiradaEnProceso = false;
    document.getElementById('lanzar-dados').disabled = false;
    document.getElementById('plantarse-dados').disabled = false;
    return;
  }
  
  // Generar todas las secuencias de animación y los valores finales de antemano
  const secuenciasAnimacion = [];
  const valoresFinales = [];
  const dadosAnimados = [];
  
  // Preparar los datos para cada dado
  for (let i = 0; i < 4; i++) {
    if (!dadosBloqueados[i]) {
      // Generar secuencia de animación
      const secuencia = [];
      for (let j = 0; j < 12; j++) {
        const randomIndex = Math.floor(Math.random() * valores.length);
        secuencia.push(valores[randomIndex]);
      }
      
      // Generar valor final
      const randomIndex = Math.floor(Math.random() * valores.length);
      const valorFinal = valores[randomIndex];
      
      secuenciasAnimacion.push({ dadoId: i, secuencia });
      valoresFinales.push({ dadoId: i, valor: valorFinal });
      dadosAnimados.push(i);
    }
  }
  
  // Enviar toda la información de la tirada al servidor
  socket.emit('dadosTiradaCompleta', {
    secuencias: secuenciasAnimacion,
    valoresFinales: valoresFinales,
    dadosAnimados: dadosAnimados
  });
  
  // La lógica de evaluación se ha movido al servidor para garantizar
  // que todos los clientes vean exactamente los mismos resultados
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
  
  if (total <= 0) {
    showNotification('No tienes puntos que guardar', 'warning');
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

// Función mejorada para reiniciar dados
function reiniciarDados() {
  dadosBloqueados = [false, false, false, false];
  valoresDados = ['-', '-', '-', '-'];
  
  for (let i = 1; i <= 4; i++) {
    const dado = document.getElementById(`dado${i}`);
    if (dado) {
      dado.textContent = '';
      dado.style.backgroundImage = 'none';
      dado.classList.remove('bloqueado');
      dado.classList.remove('shake-animation');
      dado.classList.remove('highlight-animation');
    }
  }
  
  // Sincronizar con el servidor si estamos en un juego online
  if (socket && socket.dadosRoomId) {
    socket.emit('dadosReiniciar');
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
