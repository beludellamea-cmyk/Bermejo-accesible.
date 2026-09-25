/** Cloudflare Worker. Secrets: GEMINI_API_KEY. Variable: ALLOWED_ORIGIN. */
const LENGUAS = Object.freeze({
  qom: 'qom l’aqtaqa (pueblo qom de Formosa)',
  wichi: 'wichí (variedad de Formosa por verificar)',
  pilaga: 'pilagá (pueblo pilagá de Formosa)',
  nivacle: 'nivaclé (pueblo nivaclé de Formosa)',
  guarani: 'guaraní (variedad local por verificar)'
});

function responder(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store',
      'Access-Control-Allow-Origin':origin,
      'Vary':'Origin',
      'X-Content-Type-Options':'nosniff'
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const permitido = String(env.ALLOWED_ORIGIN || '').replace(/\/$/, '');
    if (!permitido || origin !== permitido) return new Response('Origen no autorizado', {status:403});
    if (request.method === 'OPTIONS') return new Response(null, {status:204,headers:{
      'Access-Control-Allow-Origin':permitido,
      'Access-Control-Allow-Methods':'POST, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type',
      'Access-Control-Max-Age':'600',
      'Vary':'Origin'
    }});
    if (request.method !== 'POST') return responder({error:'Solo se aceptan mensajes POST.'},405,permitido);
    if (!env.GEMINI_API_KEY) return responder({error:'El servicio de IA todavía no está configurado.'},503,permitido);
    if (Number(request.headers.get('Content-Length') || 0) > 12000) return responder({error:'Mensaje demasiado largo.'},413,permitido);
    let data;
    try { data = JSON.parse(await request.text()); } catch (_) { return responder({error:'Mensaje inválido.'},400,permitido); }
    const {texto, rol, lengua} = data || {};
    if (typeof texto !== 'string' || !texto.trim() || texto.length > 500 || (rol !== 'docente' && rol !== 'estudiante') || !Object.hasOwn(LENGUAS,lengua)) return responder({error:'Revisá el texto, el rol y la lengua.'},400,permitido);
    const contexto = Array.isArray(data.contexto) ? data.contexto.slice(-6).filter(m =>
      m && (m.rol === 'docente'||m.rol === 'estudiante') &&
      typeof m.original === 'string' && m.original.length <= 500 &&
      typeof m.traduccion === 'string' && m.traduccion.length <= 1500 &&
      Object.hasOwn(LENGUAS,m.lengua)
    ) : [];
    const origen = rol === 'docente' ? 'español de Argentina' : LENGUAS[lengua];
    const destino = rol === 'docente' ? LENGUAS[lengua] : 'español de Argentina';
    const instruccion = [
      'Sos un traductor experimental para conversaciones presenciales en una escuela de Formosa, Argentina.',
      'Traducí solamente el mensaje nuevo de la lengua de origen a la de destino. Usá el contexto previo solo para resolver referencias; no contestes el contenido del mensaje ni inventes hechos.',
      'No confundas qom con Batak Toba, ni pilagá con qom, ni una variedad de guaraní con otra.',
      'Intentá traducir frases nuevas aunque no estén en un diccionario. Conservá el tono y el sentido, sin agregar consejos ni comentarios a la traducción.',
      'Si dudas de una palabra o variedad, hacé tu mejor propuesta y explicá la incertidumbre en nota. No inventes una certeza; si realmente no podés traducir, devolvé el original en traduccion y explicitá en nota que no hubo traducción.',
      'Respondé solo un JSON con campos traduccion (cadena) y nota (cadena breve en español). No incluyas formato Markdown.'
    ].join(' ');
    const mensaje = JSON.stringify({origen,destino,contexto,traducir: texto.trim()});
    const cuerpo = {
      systemInstruction:{parts:[{text:instruccion}]},
      contents:[{role:'user',parts:[{text:mensaje}]}],
      generationConfig:{responseMimeType:'application/json',temperature:0.2,maxOutputTokens:500}
    };
    try {
      const controller = new AbortController();
      const timer = setTimeout(()=>controller.abort(),20000);
      let result;
      try {
        result = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(env.GEMINI_MODEL || 'gemini-3.8-flash') + ':generateContent', {
          method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},body:JSON.stringify(cuerpo),signal:controller.signal
        });
      } finally {clearTimeout(timer);}
      if (!result.ok) return responder({error:result.status===429?'El servicio está ocupado; probá más tarde.':'La IA no respondió. Revisá el servicio o el modelo configurado.'},result.status===429?429:502,permitido);
      const salida = await result.json();
      const bruto = salida.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('') || '';
      let traduccion;
      try { traduccion = JSON.parse(bruto); } catch (_) { return responder({error:'La IA devolvió una respuesta que no se pudo leer. Reformulá el mensaje.'},502,permitido); }
      if (typeof traduccion.traduccion !== 'string' || !traduccion.traduccion.trim()) return responder({error:'No se obtuvo una propuesta de traducción. Probá con una frase más corta.'},502,permitido);
      return responder({traduccion:traduccion.traduccion.trim().slice(0,1500),nota:typeof traduccion.nota==='string'?traduccion.nota.slice(0,250):''},200,permitido);
    } catch (_) { return responder({error:'No se pudo contactar el servicio de IA. Intentá de nuevo.'},502,permitido); }
  }
};
