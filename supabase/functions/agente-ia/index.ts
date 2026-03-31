import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { mensajeUsuario } = await req.json()
    const openAiKey = Deno.env.get('OPENAI_API_KEY') 

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Eres el 'Agente Legal 24/7', un abogado penalista venezolano experto en defensa ciudadana. 
            Tu objetivo es dar respuestas cortas, directas y urgentes a ciudadanos en alcabalas.
            1. GRABACIONES: Resolución Conjunta 109. Derecho a grabar procedimientos.
            2. REVISIÓN: COPP Art. 191 y 193. Solo con motivos fundados y 2 testigos.
            3. DOCUMENTOS: Tránsito. No pueden retener documentos sin flagrancia.
            Responde en máximo 3 o 4 líneas, citando la ley y con tono protector.`
          },
          { role: "user", content: mensajeUsuario }
        ],
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