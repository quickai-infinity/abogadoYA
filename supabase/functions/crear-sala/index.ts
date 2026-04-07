import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de seguridad CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obtenemos tu clave secreta de Daily desde la bóveda de Supabase
    // Usamos el nombre exacto que le pusiste en el panel
    const DAILY_KEY = Deno.env.get('crear-sala-daily')

    if (!DAILY_KEY) {
      throw new Error('API Key de Daily no configurada en Supabase')
    }

    // 1. Crear la sala en Daily.co con grabación en la nube
    const roomResp = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          enable_recording: "cloud",
          enable_chat: false,
          start_audio_off: false,
          start_video_off: false
        }
      })
    });

    if (!roomResp.ok) throw new Error('Error al crear sala en Daily');
    const room = await roomResp.json();

    // 2. Crear el token de acceso para que inicie la grabación automática
    const tokenResp = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          room_name: room.name,
          is_owner: true,
          start_cloud_recording: true
        }
      })
    });

    if (!tokenResp.ok) throw new Error('Error al crear token en Daily');
    const tokenData = await tokenResp.json();

    // 3. Devolver la URL y el Token a tu página web de forma segura
    return new Response(JSON.stringify({
      url: room.url,
      token: tokenData.token
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})