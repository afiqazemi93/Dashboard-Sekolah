# Panduan Integrasi Google Sheets & Google Apps Script (Keberadaan Guru & Staf)

Dokumen ini mengandungi kod lengkap Google Apps Script, panduan langkah-demi-langkah penyebaran (deployment), cara konfigurasi di dalam Sistem Pengurusan Sekolah, serta prompt optimum yang boleh anda salin dan tampal ke **Google AI Studio** untuk menambah baik atau mengubah suai sistem ini pada masa hadapan.

---

## 1. Kod Google Apps Script (GAS API)

Sila ikuti langkah di bawah untuk meletakkan kod ini pada Google Sheets anda:

1. Buka Google Sheets anda: [Pautan Google Spreadsheet Keberadaan](https://docs.google.com/spreadsheets/d/1T09-iQFTlgHpe8mfBmtYknfxTRxEjxGrdBU7-NLkwts/edit)
2. Klik menu **Extensions** > **Apps Script**.
3. Padam sebarang kod sedia ada di dalam editor `Code.gs` dan gantikan dengan kod lengkap di bawah:

```javascript
/**
 * Google Apps Script Web App API untuk Keberadaan Guru & Staf
 * Menyediakan data dari Google Sheets secara langsung dalam format JSON bebas CORS.
 */
function doGet(e) {
  // ID Spreadsheet diambil dari URL sheet anda
  const SPREADSHEET_ID = "1T09-iQFTlgHpe8mfBmtYknfxTRxEjxGrdBU7-NLkwts";
  const SHEET_NAME = "Form Responses 1"; // Nama tab sheet maklum balas borang
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    
    // Jika sheet kosong atau hanya mempunyai baris pengepala (header row)
    if (data.length < 2) {
      return createJsonResponse([]);
    }
    
    const headers = data[0];
    const jsonOutput = [];
    
    // Membantu menormalisasikan nama kunci (headers) agar sesuai dengan struktur data JavaScript
    function normalizeHeaderKey(header) {
      return header.toString().trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/(^_+|_+$)/g, '');
    }
    
    // Gelung (loop) untuk setiap baris data (bermula baris kedua)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const record = {};
      
      for (let j = 0; j < headers.length; j++) {
        const headerName = headers[j];
        let rawValue = row[j];
        
        // Memformat objek Tarikh ke rentetan format secara selamat
        if (rawValue instanceof Date) {
          // Semak jika tahun adalah 1899, bermakna ia adalah sel 'Masa' (Time) dan kita perlu tetapkan ia sebagai HH:mm
          if (rawValue.getFullYear() === 1899) {
            rawValue = Utilities.formatDate(rawValue, Session.getScriptTimeZone(), "HH:mm");
          } else {
            // Jika ia adalah tarikh biasa, simpan sebagai YYYY-MM-DD
            rawValue = Utilities.formatDate(rawValue, Session.getScriptTimeZone(), "yyyy-MM-dd");
          }
        }
        
        // Simpan data di bawah kunci asal dan juga kunci yang telah dinormalisasikan
        record[headerName] = rawValue;
        record[normalizeHeaderKey(headerName)] = rawValue;
      }
      
      // Mengambil dan menggabungkan butiran-butiran daripada kedua-dua lajur pilihan jawapan
      const butiranKursus = record["sila_nyatakan_butiran_nama_kursus_urusan_rasmi_sebab_lain_lain"] || record["Sila nyatakan butiran (nama kursus, urusan rasmi, sebab lain-lain)"] || "";
      const butiranTaklimat = record["sila_nyatakan_butiran_nama_program_taklimat_sebab_lewat_sebab_keluar_awal"] || record["Sila nyatakan butiran (nama program/taklimat, sebab lewat, sebab keluar awal)"] || "";
      const masaPilihan = record["masa"] || record["Masa"] || "";
      
      let senaraiButiran = [];
      if (butiranKursus.toString().trim() !== "") {
        senaraiButiran.push(butiranKursus.toString().trim());
      }
      if (butiranTaklimat.toString().trim() !== "") {
        senaraiButiran.push(butiranTaklimat.toString().trim());
      }
      if (masaPilihan.toString().trim() !== "") {
        senaraiButiran.push("Masa: " + masaPilihan.toString().trim());
      }
      
      // Gabungkan butiran dengan pemisah interaktif " | "
      record["butiran"] = senaraiButiran.join(" | ");
      
      jsonOutput.push(record);
    }
    
    return createJsonResponse(jsonOutput);
    
  } catch (error) {
    return createJsonResponse({ 
      success: false, 
      error: error.toString(),
      message: "Gagal memproses data Google Sheets. Sila pastikan ID dan kebenaran adalah betul." 
    });
  }
}

/**
 * Membina Output JSON yang diperlukan berserta tetapan CORS yang sah
 */
function createJsonResponse(dataObject) {
  return ContentService.createTextOutput(JSON.stringify(dataObject))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 2. Cara Mengaktifkan & Menyebarkan (Deploy) Web App

Supaya sistem pengurusan sekolah portal boleh memanggil Apps Script ini tanpa halangan CORS:

1. Di sebelah atas kanan editor Google Apps Script, klik butang **Deploy** > **New deployment**.
2. Klik ikon berbentuk gear (**Select type**) di sebelah kiri perkataan "Configuration" dan pilih **Web app**.
3. Isi butiran konfigurasi penting berikut:
   * **Description**: *API Keberadaan Guru Staf SKBL*
   * **Execute as**: Pilih **Me (emel_anda@gmail.com)**
   * **Who has access**: Pilih **Anyone** (Ini membolehkan sistem portal sekolah mengambil data tanpa sekatan pengesahan login).
4. Klik butang **Deploy**.
5. Jika keluar arahan meminta kebenaran hak akses, klik **Authorize Access**, pilih akaun Google anda, pintas amaran keselamatan (*Advanced* > *Go to Untitled project (unsafe)*), dan klik **Allow**.
6. Google akan memberikan anda **Web App URL** (contohnya bermula dengan `https://script.google.com/macros/s/.../exec`). **Salin URL ini!**

---

## 3. Cara Konfigurasi URL dalam Sistem Pentadbiran Portal

Kelebihan sistem portal ini ialah anda tidak perlu menulis sebarang kod pengaturcaraan tambahan untuk menggantikan URL ini. Anda boleh terus melakukannya melalui fungsi Admin di pelayar web:

1. Buka halaman utama sistem aplikasi web anda.
2. Klik pada **Butang Pentadbir / Admin** di bahagian menu Sidebar.
3. Masukkan kata laluan Admin anda untuk mengaktifkan **Mod Penyuntingan (Editing Mode)**.
4. Pergi ke halaman pertama **Maklumat Sekolah**.
5. Scroll ke bawah sehingga anda menemui seksyen **Pautan Keberadaan**.
6. Tampal (paste) URL Web App Google Apps Script yang telah anda salin tadi ke dalam kotak input **URL Google Apps Script API (Data Live Keberadaan)**.
7. Anda juga boleh memautkan borang Google Form di dalam medan **Borang Keberadaan (URL)** supaya guru boleh klik butang untuk terus mengisi borang kehadiran tersebut.
8. Klik butang **Simpan** di sebelah bawah kanan borang tersebut.
9. **Selesai!** Data keberadaan guru yang diisi di Google Sheets anda akan dipaparkan secara langsung (real-time) di tab **Keberadaan Guru & Staf**.

---

## 4. Prompt Bersedia Untuk Google AI Studio

Jika anda ingin menggunakan Google AI Studio semula atau membina ciri baru menggunakan model cerdas Gemini untuk menganalisis data kehadiran atau menjana borang, di bawah adalah prompt optimum yang boleh anda salin terus ke dalam Google AI Studio:

```text
Sila reka bentuk dan bina satu halaman "Keberadaan Guru & Staf" interaktif dalam React menggunakan Tailwind CSS untuk portal sekolah PPKI. Sistem mestilah disepadukan secara selamat dan lancar dengan Google Sheets responses melalui sistem integrasi servis Google Apps Script Web App API.

DATA COLUMN BAGI GOOGLE SHEETS ADALAH SEPERTI BERIKUT:
- Timestamp
- Nama Guru / AKP
- Tarikh Mula
- Tarikh Akhir
- Jenis Keberadaan
- Sila nyatakan butiran (nama kursus, urusan rasmi, sebab lain-lain)
- Sila nyatakan butiran (nama program/taklimat, sebab lewat, sebab keluar awal)
- Masa

KEPERLUAN KOD INTEGRASI REACT:
1. Sediakan pemanggil URL fleksibel 'details.keberadaanGasUrl' dengan kebolehan memproses tindak balas API JSON daripada skrip doGet() secara dinamik.
2. Gabungkan nilai lajur 'Sila nyatakan butiran (kursus)' dan 'Sila nyatakan butiran (program)' dinamik bersama lajur 'Masa' ke dalam satu medan paparan yang mudah dibaca iaitu 'butiran' berasingan dipisahkan dengan tanda " | ".
3. Sediakan penapis carian mengikut Nama Guru/Staf, Kategori Keberadaan (CRK, MC, CTR, Urusan Rasmi, Kursus/LDP, dan lain-lain).
4. Paparkan petunjuk visual warna lencana (badge color) yang sepadan untuk setiap "Jenis Keberadaan" (cth: Cuti Sakit dipaparkan warna merah pudar, Kursus dipaparkan biru firus, hadir dengan warna indigo).
5. Kekalkan sokongan penukaran hari (sebelum/selepas) untuk memudahkan guru besar dan pihak pentadbiran meninjau prestasi rekod ketidakhadiran berperingkat harian.
```
