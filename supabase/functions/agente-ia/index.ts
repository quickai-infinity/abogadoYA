import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROMPT_CIUDADANO = `Eres el 'Agente Legal 24/7', un abogado penalista venezolano experto en defensa ciudadana. 
Tu objetivo es dar respuestas cortas, directas y urgentes a ciudadanos en alcabalas.
1. GRABACIONES: Resolución Conjunta 109. Derecho a grabar procedimientos.
2. REVISIÓN: COPP Art. 191 y 193. Solo con motivos fundados y 2 testigos.
3. DOCUMENTOS: Tránsito. No pueden retener documentos sin flagrancia.
Responde en máximo 3 o 4 líneas, citando la ley y con tono protector.`;

const PROMPT_ABOGADO = `Eres el Asistente Legal IA de AbogadoYA para ABOGADOS profesionales de Venezuela.
Responde con español técnico-jurídico, conciso.
Cita artículos con precisión: CRBV, COPP, CP, LTT, LOPNNA.
Orienta sobre estrategias de defensa y líneas argumentales.
NUNCA inventes artículos.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Recibimos el historial y el tipo de usuario desde tu frontend
    const { chatHistory, isAbogado } = await req.json()
    const openAiKey = Deno.env.get('OPENAI_API_KEY') 
    
    if (!openAiKey) throw new Error('API Key de OpenAI no configurada')

    const systemPrompt = isAbogado ? PROMPT_ABOGADO : PROMPT_CIUDADANO;

    // Construimos los mensajes con la memoria de la conversación
    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer $`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.3
      })
    })

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})