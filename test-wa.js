// Archivo: test-wa.js

const TOKEN = "EAAUsChGYyyQBSZCHEA7oxAaJN60GHoSROfNWO3BvUfF874Y54H8cVZCu8R2SHVZBlOZAY4mdLFhQOXBQpQRgteNJzI2gOwnOCgVR7Y26be4LDZAe9hbY1Y3ERZCqPDUC9nsAWFYAVc6jymzAcAeUIlEo7XxwH5reLrq84ReXAfSK6eTSyp0Dsb6QRtQbkTSrp2g4mROk5ZCrukIZCyu1F5a8MF05StZB5YqPPkhN14nFGOCAjrFszmRL8UdHU9hFpotzhFRtEzYQHuCT6KFrLrjZBMwUkZD";

// ⚠️ CORREGIDO: 1409350122262116 (Faltaba el 6 final)
const PHONE_ID = "1409350122262116"; 

// ⚠️ PON TU CELULAR AQUÍ (Sin el '+')
const DESTINO = "569XXXXXXXX"; 

async function probarSandboxMeta() {
  console.log("⏳ Disparando petición a Meta Cloud API...");
  
  try {
    const res = await fetch(`https://graph.facebook.com/v25.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: DESTINO,
        type: 'template',
        template: {
          name: 'hello_world', 
          language: { code: 'en_US' }
        }
      })
    });

    const data = await res.json();

    if (res.ok) {
      console.log("✅ ÉXITO: Mensaje 'Hello World' enviado.");
      console.log("ID de transacción:", data.messages[0].id);
      console.log("👉 Revisa tu celular ahora mismo.");
    } else {
      console.error("❌ META RECHAZÓ EL ENVÍO. Detalle técnico:");
      console.error(data.error.message);
    }
  } catch (err) {
    console.error("❌ Error de red local:", err);
  }
}

probarSandboxMeta();