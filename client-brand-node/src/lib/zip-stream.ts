import fs from 'fs';

// Tabela CRC32 pré-computada para empacotamento ZIP em streaming sem dependências externas
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32Update(crc: number, chunk: Buffer): number {
  let c = (crc ^ 0xffffffff) >>> 0;
  for (let i = 0; i < chunk.length; i++) {
    c = CRC_TABLE[(c ^ chunk[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function toDosTimeDate(date: Date): { dosTime: number; dosDate: number } {
  const year = Math.max(1980, date.getFullYear());
  const dosTime =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((date.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((year - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f);
  return { dosTime, dosDate };
}

export interface ZipEntryInput {
  archivePath: string;
  diskPath?: string;
  buffer?: Buffer;
}

interface CentralEntryMeta {
  nameBuf: Buffer;
  crc32: number;
  size: number;
  dosTime: number;
  dosDate: number;
  localHeaderOffset: number;
}

/**
 * Gera um stream ReadableStream<Uint8Array> de arquivo .zip em modo STORE (zip -0).
 * Nenhuma compressão de CPU e zero arquivos temporários em disco: ideal para
 * kits de marca pesados (vídeos 500MB–5GB) em VPS com 4GB RAM / 50GB NVMe.
 */
export function createStoreModeZipStream(
  entries: ZipEntryInput[]
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const centralRecords: CentralEntryMeta[] = [];
      let offset = 0;
      const now = new Date();
      const { dosTime, dosDate } = toDosTimeDate(now);

      const enqueue = (buf: Buffer) => {
        controller.enqueue(new Uint8Array(buf));
        offset += buf.length;
      };

      try {
        for (const entry of entries) {
          const cleanName = entry.archivePath.replace(/^\/+/, '');
          const nameBuf = Buffer.from(cleanName, 'utf8');

          let contentBuf: Buffer | null = entry.buffer ?? null;
          let size = 0;
          let crc = 0;

          if (contentBuf) {
            size = contentBuf.length;
            crc = crc32Update(0, contentBuf);
          } else if (entry.diskPath && fs.existsSync(entry.diskPath)) {
            const stat = fs.statSync(entry.diskPath);
            size = stat.size;
            // Calcula CRC32 em streaming sem carregar arquivos gigantes na RAM
            crc = await new Promise<number>((resolve, reject) => {
              let runningCrc = 0;
              const rs = fs.createReadStream(entry.diskPath!, {
                highWaterMark: 1024 * 1024,
              });
              rs.on('data', (chunk: string | Buffer) => {
                const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
                runningCrc = crc32Update(runningCrc, buf);
              });
              rs.on('end', () => resolve(runningCrc));
              rs.on('error', reject);
            });
          } else {
            continue;
          }

          const localHeaderOffset = offset;
          const localHeader = Buffer.alloc(30);
          localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
          localHeader.writeUInt16LE(20, 4); // Version needed to extract (2.0)
          localHeader.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
          localHeader.writeUInt16LE(0, 8); // Compression method: 0 = STORE (zip -0)
          localHeader.writeUInt16LE(dosTime, 10);
          localHeader.writeUInt16LE(dosDate, 12);
          localHeader.writeUInt32LE(crc >>> 0, 14);
          localHeader.writeUInt32LE(size >>> 0, 18);
          localHeader.writeUInt32LE(size >>> 0, 22);
          localHeader.writeUInt16LE(nameBuf.length, 26);
          localHeader.writeUInt16LE(0, 28); // Extra field length

          enqueue(localHeader);
          enqueue(nameBuf);

          if (contentBuf) {
            enqueue(contentBuf);
          } else if (entry.diskPath) {
            await new Promise<void>((resolve, reject) => {
              const rs = fs.createReadStream(entry.diskPath!, {
                highWaterMark: 512 * 1024,
              });
              rs.on('data', (chunk: string | Buffer) => {
                const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
                enqueue(buf);
              });
              rs.on('end', () => resolve());
              rs.on('error', reject);
            });
          }

          centralRecords.push({
            nameBuf,
            crc32: crc >>> 0,
            size: size >>> 0,
            dosTime,
            dosDate,
            localHeaderOffset,
          });
        }

        const centralDirStart = offset;
        let centralDirSize = 0;

        for (const rec of centralRecords) {
          const cdHeader = Buffer.alloc(46);
          cdHeader.writeUInt32LE(0x02014b50, 0); // Central directory signature
          cdHeader.writeUInt16LE(20, 4); // Version made by
          cdHeader.writeUInt16LE(20, 6); // Version needed
          cdHeader.writeUInt16LE(0x0800, 8); // UTF-8 flag
          cdHeader.writeUInt16LE(0, 10); // Compression method: 0 = STORE
          cdHeader.writeUInt16LE(rec.dosTime, 12);
          cdHeader.writeUInt16LE(rec.dosDate, 14);
          cdHeader.writeUInt32LE(rec.crc32, 16);
          cdHeader.writeUInt32LE(rec.size, 20);
          cdHeader.writeUInt32LE(rec.size, 24);
          cdHeader.writeUInt16LE(rec.nameBuf.length, 28);
          cdHeader.writeUInt16LE(0, 30);
          cdHeader.writeUInt16LE(0, 32);
          cdHeader.writeUInt16LE(0, 34);
          cdHeader.writeUInt16LE(0, 36);
          cdHeader.writeUInt32LE(0, 38);
          cdHeader.writeUInt32LE(rec.localHeaderOffset >>> 0, 42);

          enqueue(cdHeader);
          enqueue(rec.nameBuf);
          centralDirSize += 46 + rec.nameBuf.length;
        }

        const eocd = Buffer.alloc(22);
        eocd.writeUInt32LE(0x06054b50, 0); // End of central directory signature
        eocd.writeUInt16LE(0, 4);
        eocd.writeUInt16LE(0, 6);
        eocd.writeUInt16LE(centralRecords.length, 8);
        eocd.writeUInt16LE(centralRecords.length, 10);
        eocd.writeUInt32LE(centralDirSize >>> 0, 12);
        eocd.writeUInt32LE(centralDirStart >>> 0, 16);
        eocd.writeUInt16LE(0, 20);

        enqueue(eocd);
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
