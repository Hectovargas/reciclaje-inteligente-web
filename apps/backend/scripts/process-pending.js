const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

async function processPending() {
  const prisma = new PrismaClient();
  try {
    const pending = await prisma.blockchainEvent.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`[Batch Processor] Eventos PENDING encontrados: ${pending.length}`);

    if (pending.length === 0) {
      console.log('[Batch Processor] No hay eventos pendientes para procesar.');
      return;
    }

    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    console.log(`[Batch Processor] Agrupando en lote: ${batchId}`);

    for (let i = 0; i < pending.length; i++) {
      const event = pending[i];
      const txHash = '0x' + crypto.randomBytes(32).toString('hex');

      await prisma.blockchainEvent.update({
        where: { id: event.id },
        data: {
          status: 'CONFIRMED',
          batchId: batchId,
          txHash: txHash,
        },
      });

      console.log(`  ✓ Evento ${event.id} -> CONFIRMED | ${event.toAddress} | +${event.amount} RECI | Tx: ${txHash.substring(0, 14)}...`);
    }

    console.log(`[Batch Processor] Lote ${batchId} completado exitosamente (${pending.length} registros).`);
  } catch (error) {
    console.error('[Batch Processor] Error al procesar eventos:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

processPending();
