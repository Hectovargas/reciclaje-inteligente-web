import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const randomHex = Math.random().toString(16).slice(2, 8);
  const codigo = `QR-PLASTICO-${Date.now()}-${randomHex}`;
  await prisma.qRToken.create({
    data: {
      codigo,
      categoria: 'Plástico',
      firma: '0x00',
      usado: false,
      expiresAt: new Date(Date.now() + 86400000) // 1 day
    }
  });
  console.log(`\n\n✅ QR GENERADO CON EXITO EN BASE DE DATOS`);
  console.log(`\n👉 TEXTO DEL QR: ${codigo}\n`);
  console.log(`Para probarlo:`);
  console.log(`1. Ve a http://localhost:3002/app`);
  console.log(`2. Clic en 'Escanear QR'`);
  console.log(`3. Si no quieres usar la cámara, haz clic en la caja de subir archivo y sube cualquier imagen QR válida (¡o simplemente usa el enlace abajo que genera la imagen para tí!)`);
  console.log(`\n📷 Imagen del QR lista para escanear/subir:`);
  console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${codigo}\n\n`);
}
main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
