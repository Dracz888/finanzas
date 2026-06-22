// ============================================================
//  Exportación de datos: copia de seguridad (JSON) y Excel (.xlsx)
// ============================================================
//  El .xlsx se genera con un escritor ZIP propio (método "store",
//  sin compresión) para no añadir dependencias externas. Produce un
//  archivo Excel nativo que abre sin advertencias de formato.

import { TYPES, METHODS, todayISO } from './finance.js';

// --- Descarga de un Blob como archivo -------------------------------------
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Liberar la URL en el siguiente ciclo para no cortar la descarga
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================================================
//  Copia de seguridad en JSON (para migrar a otra app)
// ============================================================
export function exportJSON(records, categories) {
  const payload = {
    app: 'Finanzas',
    schema: 'finanzas.backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    counts: { records: records.length, categories: categories.length },
    categories,
    records,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  downloadBlob(blob, `finanzas-copia-${todayISO()}.json`);
}

// ============================================================
//  Exportación a Excel (.xlsx)
// ============================================================

const COLUMNS = [
  { header: 'Fecha',          key: 'date',         kind: 'text',   width: 12 },
  { header: 'Categoría',      key: 'categoryName', kind: 'text',   width: 20 },
  { header: 'Tipo',           key: 'type',         kind: 'text',   width: 12 },
  { header: 'Método de pago', key: 'method',       kind: 'text',   width: 16 },
  { header: 'Monto',          key: 'monto',        kind: 'number', width: 14 },
  { header: 'Tasa',           key: 'tasa',         kind: 'number', width: 14 },
  { header: 'Monto USD',      key: 'montoUSD',     kind: 'number', width: 14 },
];

// Convierte un registro en una fila de valores listos para la hoja
function rowFromRecord(r) {
  return {
    date: r.date || '',
    categoryName: r.categoryName || 'Sin categoría',
    type: TYPES[r.type]?.label || r.type || '',
    method: METHODS[r.method]?.label || r.method || '',
    monto: Number(r.monto) || 0,
    tasa: Number(r.tasa) || 0,
    montoUSD: Math.round((Number(r.montoUSD) || 0) * 100) / 100,
  };
}

const xmlEscape = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const colLetter = (i) => String.fromCharCode(65 + i); // 0->A (bastan 7 columnas)

function cellXml(col, rowNum, value, kind) {
  const ref = `${col}${rowNum}`;
  if (kind === 'number') {
    return `<c r="${ref}"><v>${Number(value) || 0}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
}

function sheetXml(records) {
  const rows = [];

  // Encabezado
  const headerCells = COLUMNS.map((c, i) =>
    cellXml(colLetter(i), 1, c.header, 'text')
  ).join('');
  rows.push(`<row r="1">${headerCells}</row>`);

  // Datos
  records.forEach((r, idx) => {
    const rowNum = idx + 2;
    const data = rowFromRecord(r);
    const cells = COLUMNS.map((c, i) =>
      cellXml(colLetter(i), rowNum, data[c.key], c.kind)
    ).join('');
    rows.push(`<row r="${rowNum}">${cells}</row>`);
  });

  const cols = COLUMNS.map(
    (c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width}" customWidth="1"/>`
  ).join('');

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<cols>${cols}</cols>` +
    `<sheetData>${rows.join('')}</sheetData>` +
    `</worksheet>`
  );
}

const FILE_CONTENT_TYPES =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
  `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
  `<Default Extension="xml" ContentType="application/xml"/>` +
  `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
  `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
  `</Types>`;

const FILE_RELS =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
  `</Relationships>`;

const FILE_WORKBOOK =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
  `<sheets><sheet name="Registros" sheetId="1" r:id="rId1"/></sheets>` +
  `</workbook>`;

const FILE_WORKBOOK_RELS =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
  `</Relationships>`;

// --- Escritor ZIP mínimo (método "store", sin compresión) -----------------
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(files) {
  const encoder = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = encoder.encode(f.name);
    const data = encoder.encode(f.content);
    const crc = crc32(data);
    const size = data.length;

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // versión necesaria
    lv.setUint16(6, 0, true); // flags
    lv.setUint16(8, 0, true); // método: store
    lv.setUint16(10, 0, true); // hora
    lv.setUint16(12, 0x21, true); // fecha (1980-01-01)
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true); // comprimido
    lv.setUint32(22, size, true); // sin comprimir
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // extra
    local.set(nameBytes, 30);

    parts.push(local, data);

    const cdir = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cdir.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true); // versión creada por
    cv.setUint16(6, 20, true); // versión necesaria
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x21, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    cdir.set(nameBytes, 46);
    central.push(cdir);

    offset += local.length + data.length;
  }

  const centralSize = central.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  return new Blob([...parts, ...central, end], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function exportXLSX(records) {
  const files = [
    { name: '[Content_Types].xml', content: FILE_CONTENT_TYPES },
    { name: '_rels/.rels', content: FILE_RELS },
    { name: 'xl/workbook.xml', content: FILE_WORKBOOK },
    { name: 'xl/_rels/workbook.xml.rels', content: FILE_WORKBOOK_RELS },
    { name: 'xl/worksheets/sheet1.xml', content: sheetXml(records) },
  ];
  const blob = zipStore(files);
  downloadBlob(blob, `finanzas-registros-${todayISO()}.xlsx`);
}
