// ════════════════════════════════════════════════════════════
//  TPA DIGITAL — Google Apps Script Backend
//  Paste seluruh kode ini ke: script.google.com
//  Lalu klik Deploy > New Deployment > Web App
// ════════════════════════════════════════════════════════════

// ⚠️ GANTI dengan ID Google Sheets Anda
const SHEET_ID = '1ua6BgV7Fbjs9y261W4dy-fcFdOA-Fu9tAY_ZMH2KlMg';

// Nama-nama sheet (jangan diubah kecuali Anda tahu apa yang dilakukan)
const SHEET_SANTRI   = 'Master_Santri';
const SHEET_LOG      = 'Log_Ngaji';
const SHEET_REDEEM   = 'Log_Redeem';

// ════════════════════════════════════════════════════════════
//  MAIN HANDLER — Terima semua request GET dari HTML
// ════════════════════════════════════════════════════════════
function doGet(e) {
  const action = e.parameter.action;
  let result;

  try {
    if      (action === 'getSantri')    result = getSantri();
    else if (action === 'getLog')       result = getLog(e.parameter.id);
    else if (action === 'saveLog')      result = saveLog(e.parameter);
    else if (action === 'redeemHadiah') result = redeemHadiah(e.parameter);
    else if (action === 'getLogHariIni') result = getLogHariIni(e.parameter.tanggal);
    else result = { success: false, error: 'Unknown action: ' + action };
  } catch (err) {
    result = { success: false, error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════════════════════════════
//  GET SANTRI — Kembalikan semua data santri
// ════════════════════════════════════════════════════════════
function getSantri() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_SANTRI);
  const data  = sheet.getDataRange().getValues();

  // Baris pertama = header, skip
  const santri = data.slice(1).map(row => ({
    id    : row[0],
    nama  : row[1],
    foto  : row[2] || '',
    kelas : row[3],
    saldo : Number(row[4]) || 0,
    total : Number(row[5]) || 0,
  })).filter(s => s.id); // filter baris kosong

  return { success: true, santri };
}

// ════════════════════════════════════════════════════════════
//  GET LOG — Riwayat mengaji untuk satu santri
// ════════════════════════════════════════════════════════════
function getLog(santriId) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_LOG);
  const data  = sheet.getDataRange().getValues();

  // Kolom: Timestamp | Tanggal | ID_Santri | Nama | Kategori | Level | Hal | Surah | Ayat | Nilai | Pengajar | Keterangan
  const log = data.slice(1)
    .filter(row => String(row[2]) === String(santriId))
    .reverse() // terbaru di atas
    .slice(0, 30) // max 30 entri
    .map(row => ({
      tanggal   : row[1] ? Utilities.formatDate(new Date(row[1]), 'Asia/Jakarta', 'dd MMM yyyy') : '',
      kategori  : row[4],
      level     : row[5],
      halaman   : row[6],
      surah     : row[7],
      ayat_dari : row[8],
      ayat_sampai: row[8], // Anda bisa pisah jika kolom berbeda
      nilai     : row[9],
      pengajar  : row[10],
      keterangan: row[11],
      detail    : buildDetail(row),
    }));

  return { success: true, log };
}

function getLogHariIni(tanggal) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_LOG);
  const data  = sheet.getDataRange().getValues();
  const count = data.slice(1).filter(row => {
    if (!row[1]) return false;
    const tgl = Utilities.formatDate(new Date(row[1]), 'Asia/Jakarta', 'yyyy-MM-dd');
    return tgl === tanggal;
  }).length;
  return { success: true, count };
}

function buildDetail(row) {
  const kat = row[4];
  if (kat === 'Al-Quran') return `${row[7]} ayat ${row[8]}`;
  if (kat === 'Iqra' || kat === 'Tilawati') return `${kat} ${row[5]} Hal. ${row[6]}`;
  return '';
}

// ════════════════════════════════════════════════════════════
//  SAVE LOG — Simpan catatan mengaji harian
// ════════════════════════════════════════════════════════════
function saveLog(p) {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  const now = new Date();

  // 1. Tambah baris di Log_Ngaji
  const logSheet = ss.getSheetByName(SHEET_LOG);
  logSheet.appendRow([
    now,                  // Timestamp
    Utilities.formatDate(now, 'Asia/Jakarta', 'yyyy-MM-dd'), // Tanggal
    p.id,                 // ID_Santri
    p.nama,               // Nama_Santri
    p.kategori,           // Kategori
    p.level  || '',       // Level_Iqra
    p.halaman || '',      // Hal_Iqra
    p.surah  || '',       // Surah
    (p.ayat_dari && p.ayat_sampai) ? p.ayat_dari + '-' + p.ayat_sampai : (p.ayat_dari || ''), // Ayat
    p.nilai,              // Nilai
    p.pengajar,           // Pengajar
    p.keterangan || '',   // Keterangan
  ]);

  // 2. Jika nilai A+, tambah saldo bintang santri
  if (p.tambah_bintang === '1') {
    updateBintang(ss, p.id, 1);
  }

  return { success: true };
}

// ════════════════════════════════════════════════════════════
//  REDEEM HADIAH — Tukar bintang dengan hadiah
// ════════════════════════════════════════════════════════════
function redeemHadiah(p) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const poin  = Number(p.poin) || 0;

  // Cek saldo dulu
  const santriSheet = ss.getSheetByName(SHEET_SANTRI);
  const data = santriSheet.getDataRange().getValues();
  const rowIdx = data.findIndex((row, i) => i > 0 && String(row[0]) === String(p.id));

  if (rowIdx === -1) throw new Error('Santri tidak ditemukan');

  const currentSaldo = Number(data[rowIdx][4]) || 0;
  if (currentSaldo < poin) throw new Error(`Saldo tidak cukup (${currentSaldo} < ${poin})`);

  // Kurangi saldo (TIDAK mengurangi total akumulasi)
  santriSheet.getRange(rowIdx + 1, 5).setValue(currentSaldo - poin);

  // Catat di Log_Redeem
  const redeemSheet = ss.getSheetByName(SHEET_REDEEM);
  redeemSheet.appendRow([
    new Date(),   // Timestamp
    p.id,         // ID_Santri
    p.nama,       // Nama_Santri
    p.hadiah,     // Hadiah_Diambil
    poin,         // Poin_Dipotong
  ]);

  return { success: true, saldo_baru: currentSaldo - poin };
}

// ════════════════════════════════════════════════════════════
//  HELPER — Update saldo & total bintang santri
// ════════════════════════════════════════════════════════════
function updateBintang(ss, santriId, jumlah) {
  const sheet = ss.getSheetByName(SHEET_SANTRI);
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(santriId)) {
      const saldo = Number(data[i][4]) || 0;
      const total = Number(data[i][5]) || 0;
      sheet.getRange(i + 1, 5).setValue(saldo + jumlah); // kolom E: Saldo_Bintang
      sheet.getRange(i + 1, 6).setValue(total + jumlah); // kolom F: Total_Akumulasi
      break;
    }
  }
}

// ════════════════════════════════════════════════════════════
//  SETUP — Jalankan sekali untuk membuat sheet template
//  Buka Apps Script > Run > setupSheets
// ════════════════════════════════════════════════════════════
function setupSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  // Master_Santri
  let s1 = ss.getSheetByName(SHEET_SANTRI) || ss.insertSheet(SHEET_SANTRI);
  if (s1.getLastRow() === 0) {
    s1.appendRow(['ID_Santri','Nama_Santri','Foto','Kelas','Saldo_Bintang','Total_Akumulasi_Bintang']);
    s1.getRange('1:1').setFontWeight('bold').setBackground('#137a4f').setFontColor('#ffffff');
    // Contoh data santri
    const contoh = [
      ['S001','Ahmad Fauzi','','SD',0,0],
      ['S002','Siti Aisyah','','TK',0,0],
      ['S003','Muhammad Rizky','','SD',0,0],
    ];
    contoh.forEach(row => s1.appendRow(row));
  }

  // Log_Ngaji
  let s2 = ss.getSheetByName(SHEET_LOG) || ss.insertSheet(SHEET_LOG);
  if (s2.getLastRow() === 0) {
    s2.appendRow(['Timestamp','Tanggal','ID_Santri','Nama_Santri','Kategori','Level_Iqra','Hal_Iqra','Surah','Ayat','Nilai','Pengajar','Keterangan']);
    s2.getRange('1:1').setFontWeight('bold').setBackground('#137a4f').setFontColor('#ffffff');
  }

  // Log_Redeem
  let s3 = ss.getSheetByName(SHEET_REDEEM) || ss.insertSheet(SHEET_REDEEM);
  if (s3.getLastRow() === 0) {
    s3.appendRow(['Timestamp','ID_Santri','Nama_Santri','Hadiah_Diambil','Poin_Dipotong']);
    s3.getRange('1:1').setFontWeight('bold').setBackground('#c9922e').setFontColor('#ffffff');
  }

  Logger.log('✅ Setup selesai! Sheet berhasil dibuat.');
}
