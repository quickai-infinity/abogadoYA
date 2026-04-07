import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1. Conexión de administrador a Supabase (salta las reglas RLS)
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    // 2. Extraemos la información que nos manda la pasarela de pago
    const payload = await req.json()
    
    // Asumimos que la pasarela nos manda quién pagó y cuánto pagó
    const usuario_id = payload.usuario_id;
    const monto_pagado = payload.monto; 

    if (!usuario_id || !monto_pagado) {
      return new Response("Faltan datos", { status: 400 })
    }

    // 3. Llamamos a la función segura de SQL que creaste en el Paso 1
    const { error } = await supabase.rpc('sumar_saldo_usuario', {
      p_usuario_id: usuario_id,
      p_monto: monto_pagado
    })

    if (error) throw error

    // 4. Respondemos con éxito para que la pasarela deje de enviar el webhook
    return new Response(JSON.stringify({ mensaje: "Saldo actualizado automáticamente" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})