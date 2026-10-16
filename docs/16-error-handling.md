# 16. Error Handling

## Pola Error Handling yang Ditemukan

### Frontend

- ViewModel/store menyimpan `error` reactive string.
- UI menampilkan error via:
  - `AppAlert`
  - toast `useAppToast()`
- Form login memakai validasi `zod` + `vee-validate`.

### Backend

- Wrapper utama: `server/utils/api.ts -> defineJsonHandler()`
- Error dilempar dengan:
  - `createHttpError(status, message)`
  - `new Error(message)`
- Handler akan:
  - `console.error(error)`
  - set status response
  - expose message hanya untuk error `4xx` atau error dengan `expose: true`

## Error Supabase Auth

Contoh:

- login gagal di `supabase.auth.signInWithPassword`
- session load gagal di `supabase.auth.getSession`
- sign out gagal

Respons ke user:

- pesan langsung dari Supabase bila tersedia
- fallback text i18n seperti `loginFailed`, `logoutFailed`

## Error Supabase Database

Pattern:

- server service melempar `new Error(error.message)` atau `createHttpError(500, ...)`
- frontend `backendApi.ts` membaca payload `{ error }` dan melempar `new Error(payload.error)`

Risiko:

- beberapa error database masih generic `Failed to ...`
- logging masih dominan `console.error`

## Error Supabase Storage

Contoh flow:

- create signed URL gagal
- upload template DOCX gagal
- upload foto kandidat gagal
- upload dokumen kontrak gagal

Respons:

- storage error message di-wrap menjadi `Error`
- frontend menampilkan toast error

## Error File Upload

Validasi yang ditemukan:

- template export harus `.docx`
- dokumen kontrak harus PDF
- size foto maksimal 5 MB
- size dokumen employee maksimal 10 MB
- contract docs wajib `format_office` saja (Draft Employment Contract); `skb` dan `other` opsional
- submit ulang diperbolehkan tanpa memilih file baru selama dokumen wajib sudah tersimpan di storage (validasi "minimal satu file dipilih" sudah dihapus)
- dokumen ERF (`document_erf`) maksimal 10 MB (`maxErfAttachmentSizeInBytes`); hanya PDF/DOCX yang diterima (`ErfDocumentParseError: "Only PDF or DOCX files are supported for ERF upload."`)
- bila dokumen ERF berhasil diupload tetapi parser tidak mengenali satu pun field (`extractErfFieldsFromText` return object kosong), file tetap disimpan tetapi menampilkan error `noFieldsRecognized` alih-alih toast sukses palsu
- bila field hasil parse dokumen ERF tidak cocok dengan opsi master data (`findOptionByLabel` gagal), value tetap diisi as-typed dan field menampilkan `warningText` — ini soft warning, bukan hard block; submit form tetap bisa dilakukan

## Error Autofill Dokumen ERF

- `Director BU` tidak lagi wajib dipilih sebelum submit ERF (validasi frontend `buDirectorRequired` dan validasi backend `Director BU is required.` sudah dihapus); bila dipilih, value harus tetap ada di `directorBuApprovalCandidateIds` (validasi `invalidBuDirector` masih berlaku).
- Auto Approval gagal dengan `422` bila requester (`erf.created_by`) tidak punya email valid di `profiles` (`"The ERF requester does not have a valid email for Auto Approval."`).

## Error CSV Import

Status: **Belum ditemukan di implementasi saat ini**.

Implikasi:

- tidak ada pola error CSV spesifik yang bisa didokumentasikan dari code saat ini.

## Error DOCX Processing

Terjadi pada:

- file DOCX invalid
- tidak ada placeholder
- render Docxtemplater gagal
- preview Mammoth gagal

Contoh pesan:

- `Only .docx files are allowed.`
- `No {{...}} placeholders were found...`
- `Failed to generate DOCX document: ...`
- `Failed to render DOCX preview: ...`

## Error Validasi Form

Contoh:

- login:
  - identifier minimal 3 karakter
  - password minimal 8 karakter
- user management:
  - full name wajib
  - role wajib
  - candidate wajib bind ERF
  - password minimal 6 karakter
- export generate:
  - field required tidak boleh kosong

## Error Network

`backendApi.ts`:

- menambahkan header auth otomatis
- bila response tidak `ok`, mencoba membaca `payload.error`
- fallback message: `Request failed with HTTP <status>.`

## Format Pesan Error ke User

| Channel | Bentuk |
| --- | --- |
| inline form | teks merah / `AppAlert` |
| global action | toast error |
| API JSON | `{ ok: false, error: "..." }` |

## Logging Error

Yang ditemukan:

- `console.error` pada server API wrapper dan beberapa store/service
- `console.warn` untuk CSP report

Structured logging / external logging sink:

- **Belum ditemukan di repository**

## Rekomendasi Improvement

1. Standarisasi error code/domain code di backend, bukan hanya message string.
2. Tambahkan structured logging untuk operasi penting: auth, export generate, signed URL, integrasi candidate service.
3. Tambahkan correlation/request id pada endpoint Nitro untuk debugging.
4. Dokumentasikan policy storage live agar error upload/download lebih mudah ditelusuri.
5. Jika CSV import akan ditambahkan, definisikan format error per baris dan ringkasan hasil import.
