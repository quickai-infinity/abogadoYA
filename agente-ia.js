// ══════════════════════════════════════════════════════════════
// AGENTE LEGAL IA — AbogadoYA
// Este archivo mejora el chat IA existente sin modificar nada más.
// Uso: <script src="agente-ia.js"></script> antes del </body>
// ══════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // ── CONFIGURACIÓN SEGURA ──
  // Las llaves ahora viven en Supabase para evitar el robo de saldo.

  // ── DETECTAR TIPO DE USUARIO ──
  const IS_ABOGADO = window.location.pathname.includes('panel-abogado');

  // ── LÍMITE DE MENSAJES (solo ciudadanos) ──
  const MSG_LIMIT_FREE = 10;

  function getMsgCount() {
    try {
      const stored = JSON.parse(localStorage.getItem('aya_msg_count') || '{}');
      const today = new Date().toISOString().slice(0, 10);
      if (stored.date !== today) return { date: today, count: 0 };
      return stored;
    } catch(e) { return { date: new Date().toISOString().slice(0,10), count: 0 }; }
  }

  function incrementMsg() {
    const data = getMsgCount();
    data.count++;
    localStorage.setItem('aya_msg_count', JSON.stringify(data));
    return data.count;
  }

  // ── HISTORIAL DE CONVERSACIÓN ──
  let chatHistory = [];

  // ── BASE DE LEYES OFFLINE EXPANDIDA (30+) ──
  const LEYES = [
    // DERECHOS CONSTITUCIONALES (CRBV)
    { k: ["grabar","video","telefono","celular","filmar","camara"], t: "⚖️ CRBV Art. 57 + Res. 109 CICPC: Tienes derecho constitucional a grabar cualquier procedimiento policial. Grabar NO es delito. Ningún funcionario puede quitarte el teléfono ni obligarte a borrar videos." },
    { k: ["detener","detenido","arrestar","preso","calabozo","comisaria"], t: "⚖️ CRBV Art. 44: Solo puedes ser detenido con ORDEN JUDICIAL o en flagrancia. Derecho a llamar abogado y familiar. Presentación ante juez en máx 48 horas." },
    { k: ["revisar","maleta","carro","vehiculo","requisa","registrar","bolso","mochila"], t: "⚖️ COPP Art. 191-193: La revisión personal o de vehículo requiere: 1) Motivos fundados. 2) DOS testigos civiles (NO policías). 3) Respeto a tu dignidad. Sin testigos = ILEGAL." },
    { k: ["cedula","licencia","documentos","papeles","identificacion"], t: "⚖️ CRBV Art. 45: Funcionarios pueden VERIFICAR tus documentos pero NO retenerlos. Retener documentos es abuso de autoridad (Art. 176 Ley Orgánica de Policía)." },
    { k: ["alcabala","punto de control","reten","barrera","checkpoint"], t: "⚖️ Gaceta 42.458 + LOSPCPNB Art. 65: En alcabalas DEBEN: 1) Estar uniformados e identificados. 2) Zona iluminada. 3) Permitir grabación. 4) No retener documentos sin orden." },
    { k: ["dolar","dolares","divisa","efectivo","cash","euros","moneda"], t: "⚖️ Gaceta 6.405 (2018) + Ley BCV: Es LEGAL portar divisas. Ningún funcionario puede decomisarlas. Si lo hacen = HURTO por abuso de funciones (Art. 200 CP)." },
    { k: ["abogado","defensor","defensa","asistencia juridica"], t: "⚖️ CRBV Art. 49.1: Derecho a DEFENSA en todo estado del proceso. Si no tienes abogado, el Estado debe asignar Defensor Público. Nunca declares sin abogado." },
    { k: ["silencio","declarar","testimonio","confesion"], t: "⚖️ CRBV Art. 49.5: Derecho a NO declarar contra ti mismo. El silencio NO es prueba de culpabilidad. No firmes nada sin leer y sin abogado." },
    { k: ["tortura","golpe","maltrato","agresion","abuso","violencia policial"], t: "⚖️ CRBV Art. 46 + Ley contra Tortura (2013): PROHIBIDA toda tortura. 15-25 años de prisión para funcionarios. Documenta lesiones con fotos y testigos." },
    { k: ["menor","niño","adolescente","hijo","niña"], t: "⚖️ LOPNNA Art. 8: Menores con protección REFORZADA. No detención con adultos. Notificación inmediata a padres. Requiere Fiscal de Protección de NNA." },
    { k: ["mujer","genero","acoso","violencia de genero"], t: "⚖️ Ley Orgánica Derecho Mujeres: 21 formas de violencia tipificadas. Denuncia en CICPC, Fiscalía o llama 0800-MUJERES." },
    { k: ["casa","hogar","domicilio","allanamiento","entrada"], t: "⚖️ CRBV Art. 47: Hogar INVIOLABLE. Solo pueden entrar con: 1) Orden judicial. 2) Delito en curso. 3) Orden sanitaria. Sin orden, puedes negarte y grabar." },
    { k: ["comunicacion","telefono intervenido","privacidad","espiar"], t: "⚖️ CRBV Art. 48: Comunicaciones privadas INVIOLABLES. Solo un juez puede autorizar intervenciones. Interceptar sin orden = delito." },

    // TRÁNSITO
    { k: ["transito","multa","infraccion","boleta","ticket"], t: "⚖️ LTT Art. 169-180: Multas deben ser por escrito con número de boleta. Funcionarios identificados. 15 días hábiles para apelar." },
    { k: ["licencia vencida","renovar licencia"], t: "⚖️ LTT Art. 92: Licencia vencida NO autoriza retención del vehículo si tienes demás documentos en regla." },
    { k: ["grua","remolcar","llevarse el carro","retencion vehiculo"], t: "⚖️ LTT Art. 184: Remolque solo si: 1) Obstaculiza tránsito. 2) Hecho punible. 3) Faltan documentos obligatorios. Deben darte acta." },
    { k: ["seguro","poliza","rcv","responsabilidad civil"], t: "⚖️ LTT Art. 76: Seguro RCV es OBLIGATORIO. Sin seguro vigente = multa." },
    { k: ["accidente","choque","colision","siniestro"], t: "⚖️ LTT Art. 193: NO muevas vehículos. Llama tránsito. Fotos + testigos. Reporta a seguro en 5 días." },
    { k: ["alcohol","borracho","alcoholemia","prueba de alcohol"], t: "⚖️ LTT Art. 169.11: Conducir ebrio = multa + retención licencia 1-3 años + retención vehículo. Con heridos = delito penal." },
    { k: ["velocidad","radar","exceso"], t: "⚖️ LTT Art. 253: Urbana 40km/h, avenidas 60km/h, autopistas 90-120km/h." },
    { k: ["cinturon","seguridad"], t: "⚖️ LTT Art. 169.4: Cinturón OBLIGATORIO. Menores de 10 años en asiento trasero con retención." },
    { k: ["moto","motocicleta","casco"], t: "⚖️ LTT Art. 169.8: Casco obligatorio. Prohibido zigzag. Menores de 7 no pueden ser pasajeros." },

    // PROCEDIMIENTOS
    { k: ["denuncia","denunciar","fiscalia","ministerio publico"], t: "⚖️ COPP Art. 267-269: Denuncia en CICPC, Fiscalía o cualquier policía. GRATUITA, oral o escrita, sin abogado." },
    { k: ["habeas corpus","amparo","recurso"], t: "⚖️ CRBV Art. 27: Amparo y Habeas Corpus GRATUITOS, sin abogado, resolución en 96 horas." },
    { k: ["soborno","coima","plata","mordida"], t: "⚖️ CP Art. 197-200: Pedir y dar soborno = DELITO. No pagues, pide identificación, graba, denuncia." },
    { k: ["protesta","manifestacion","marcha"], t: "⚖️ CRBV Art. 68: Manifestar pacíficamente es constitucional. NO requiere permiso, solo notificación." },
    { k: ["propiedad","decomiso","confiscar","quitar pertenencias"], t: "⚖️ CRBV Art. 115: Propiedad INVIOLABLE. Solo decomiso por sentencia judicial. Policía NO puede quitar bienes sin orden." },
    { k: ["defensoria","defensor del pueblo","derechos humanos"], t: "⚖️ CRBV Art. 280-283: Defensoría del Pueblo recibe denuncias DDHH. GRATUITA. 0800-DEFENSOR." },
    { k: ["hola","buenos dias","buenas tardes","buenas noches","ayuda","que hago"], t: "🛡️ Soy tu Agente Legal IA. Cuéntame qué pasa y te oriento con las leyes que te protegen. Si es emergencia, usa el botón SOS." }
  ];

  // ── BUSCAR EN BASE OFFLINE ──
  function searchOffline(text) {
    const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let matches = LEYES.filter(l => l.k.some(p => normalized.includes(p)));
    if (matches.length > 0) {
      return matches.slice(0, 2).map(m => m.t).join('<br><br>');
    }
    return '⚠️ <b>Modo Offline:</b> No encontré ley específica. Recuerda:<br><br>' +
      '1. 📹 <b>Graba todo</b> (Art. 57 CRBV)<br>' +
      '2. 🪪 <b>Pide identificación</b> al funcionario<br>' +
      '3. 👥 <b>Exige testigos</b> civiles<br>' +
      '4. ✋ <b>No firmes nada</b> sin abogado<br>' +
      '5. 🔴 <b>Usa el botón SOS</b> para conectar con un abogado';
  }

  // ── REEMPLAZAR sendMessage ORIGINAL ──
  window.sendMessage = async function() {
    const input = document.getElementById('chat-input');
    const container = document.getElementById('chat-messages');
    const text = input.value.trim();
    if (!text) return;

    // Verificar límite (solo ciudadanos)
    if (!IS_ABOGADO) {
      const msgData = getMsgCount();
      if (msgData.count >= MSG_LIMIT_FREE) {
        if (window.showToast) window.showToast('⚠️ Límite diario alcanzado (10/10). Vuelve mañana o hazte Premium.', 'error');
        return;
      }
      incrementMsg();
    }

    // Mostrar mensaje del usuario
    const userDiv = document.createElement('div');
    userDiv.className = 'msg user';
    userDiv.innerText = text;
    container.appendChild(userDiv);
    input.value = '';

    // Mostrar "pensando"
    const botDiv = document.createElement('div');
    botDiv.className = 'msg bot';
    botDiv.innerHTML = '⚖️ Analizando tu caso... ⏳';
    container.appendChild(botDiv);
    container.scrollTop = container.scrollHeight;

    // Historial para contexto
    chatHistory.push({ role: 'user', content: text });
    if (chatHistory.length > 6) chatHistory = chatHistory.slice(-6);

    // Intentar IA de forma SEGURA a través de Supabase
    try {
      const supabaseClient = window.dbApp || window.dbClient; 
      if (!supabaseClient) throw new Error("Supabase no inicializado");

      const { data, error } = await supabaseClient.functions.invoke('agente-ia', {
        body: { 
          chatHistory: chatHistory,
          isAbogado: IS_ABOGADO
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const reply = data.choices[0].message.content;

      botDiv.innerHTML = reply.replace(/\n/g, '<br>');
      botDiv.style.borderLeft = '3px solid #22C55E';
      chatHistory.push({ role: 'assistant', content: reply });

    } catch (err) {
      // Fallback offline
      console.log('IA offline, base local:', err.message);
      botDiv.innerHTML = searchOffline(text);
      botDiv.style.borderLeft = '3px solid #F59E0B';
    }

    container.scrollTop = container.scrollHeight;
  };

  console.log('✅ Agente Legal IA cargado — ' + (IS_ABOGADO ? 'Modo Abogado' : 'Modo Ciudadano'));
})();