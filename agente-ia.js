(function() {
  'use strict';

  // ── CONFIGURACIÓN ──
  const N8N_WEBHOOK_URL = 'https://panel1.quickai.agency/webhook/abogadoya-agente';
  const IS_ABOGADO = window.location.pathname.includes('panel-abogado');

  // ── BASE DE LEYES OFFLINE (Resumen para emergencias sin internet) ──
  const LEYES = [
    { k: ["grabar","video","celular"], t: "⚖️ Art. 57 CRBV: Tienes derecho a grabar procedimientos policiales. Grabar NO es delito." },
    { k: ["detener","arrestar"], t: "⚖️ Art. 44 CRBV: Solo con orden judicial o flagrancia. Presentación en 48h." },
    { k: ["revisar","carro","maleta"], t: "⚖️ Art. 191 COPP: Requiere motivos fundados y DOS testigos civiles. Sin testigos es ilegal." },
    { k: ["cedula","documentos"], t: "⚖️ Art. 45 CRBV: Pueden verificar, pero NO retener tus documentos." },
    { k: ["alcabala","reten"], t: "⚖️ Gaceta 42.458: Deben estar identificados y permitir grabaciones." },
    { k: ["hola","ayuda"], t: "🛡️ Soy tu Agente Legal. Cuéntame qué pasa. Si es una emergencia real, usa el botón SOS." }
  ];

  function searchOffline(text) {
    const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let match = LEYES.find(l => l.k.some(p => normalized.includes(p)));
    if (match) return match.t;
    return '⚠️ <b>Modo Offline:</b> No encontré la ley exacta, pero recuerda: Graba todo, pide identificación y no firmes nada sin un abogado.';
  }

  // ── FUNCIÓN PRINCIPAL DE ENVÍO ──
  window.sendMessage = async function() {
    const input = document.getElementById('chat-input');
    const container = document.getElementById('chat-messages');
    const text = input.value.trim();
    if (!text) return;

    // 1. Mostrar mensaje usuario
    const userDiv = document.createElement('div');
    userDiv.className = 'msg user';
    userDiv.innerText = text;
    container.appendChild(userDiv);
    input.value = '';

    // 2. Burbuja de espera
    const botDiv = document.createElement('div');
    botDiv.className = 'msg bot';
    botDiv.innerHTML = "Consultando central legal... ⚖️";
    container.appendChild(botDiv);
    container.scrollTop = container.scrollHeight;

    try {
      // 3. Intento de conexión con el Cerebro (n8n)
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mensaje: text,
          origen: IS_ABOGADO ? 'panel-abogado' : 'app-ciudadano'
        })
      });

      if (!response.ok) throw new Error('n8n_offline');

      const data = await response.json();
      botDiv.innerText = data.output || data.respuesta || "Cerebro sin respuesta.";

    } catch (err) {
      // 4. FALLBACK: Si n8n falla, usamos el motor offline
      console.warn("⚠️ n8n falló, activando leyes locales.");
      const offlineResp = searchOffline(text);
      botDiv.innerHTML = `<small style="opacity:0.7;">(Modo local)</small><br>${offlineResp}`;
    }
    
    container.scrollTop = container.scrollHeight;
  };

  // Escuchar tecla Enter
  document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement.id === 'chat-input') {
      window.sendMessage();
    }
  });

  console.log('✅ Agente Legal IA (' + (IS_ABOGADO ? 'Abogado' : 'Ciudadano') + ') conectado a n8n.');
})();