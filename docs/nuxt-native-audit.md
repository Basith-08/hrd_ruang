# Nuxt-Native Audit

Dokumen ini memetakan bagian codebase yang sudah benar-benar mengikuti pola Nuxt, bagian yang masih hybrid hasil migrasi, dan area yang masih legacy sehingga layak dibersihkan pada fase berikutnya.

## Ringkasan

Status saat ini:

- Runtime aplikasi sudah Nuxt full-stack.
- Routing halaman, middleware, plugin startup, dan server API sudah berada di jalur Nuxt/Nitro.
- Layer UI, store, viewmodel, repository, dan data-access masih banyak memakai pola aplikasi Vue lama yang diadaptasi ke shell Nuxt, walau lapisan transisi terbesarnya sudah mulai dirapikan.

Kesimpulan praktis:

- Proyek ini sudah `Nuxt runtime-ready`.
- Proyek ini belum `Nuxt-native end-to-end`.

## Sudah Nuxt-Native

Bagian-bagian berikut sudah memakai struktur dan entrypoint Nuxt yang benar:

- `src/app.vue`
  Root app Nuxt sudah memakai `NuxtLayout`, `NuxtPage`, dan `ClientOnly`.
- `src/pages/**`
  URL publik sekarang dipetakan lewat file-based routing Nuxt.
- `src/layouts/default.vue`
  Layout utama app sudah dibaca sebagai layout Nuxt.
- `src/middleware/access.global.ts`
  Auth guard dan RBAC sudah pindah ke route middleware Nuxt.
- `src/plugins/auth-init.client.ts`
  Bootstrap auth dijalankan sebagai Nuxt plugin.
- `server/routes/**`
  Endpoint backend sekarang hidup sebagai Nitro route handlers.
- `server/services/**`, `server/lib/**`, `server/config/**`
  Server-only logic sudah dipisah ke area server Nuxt.
- `nuxt.config.ts`
  Dev/build sekarang dikontrol penuh dari Nuxt.

## Masih Hybrid

Bagian berikut bekerja baik di atas Nuxt, tetapi secara arsitektur masih merupakan hasil carry-over dari aplikasi Vue sebelumnya:

### 1. Wrapper Pages

`src/pages/**` masih banyak berupa route shell tipis yang merender feature component dari `src/features/**`.

Contoh pola:

- page Nuxt:
  - `src/pages/dashboard.vue`
  - `src/pages/login.vue`
- feature component:
  - `src/features/dashboard/DashboardPage.vue`
  - `src/features/auth/LoginPage.vue`

Ini aman untuk migrasi bertahap, tetapi belum Nuxt-native secara struktur UI.

### 2. Feature Layer yang Masih Carry-Over

Folder `src/features/**` sekarang menjadi pusat komponen halaman utama, tetapi isi file-filenya masih banyak membawa pola aplikasi Vue sebelumnya.

Ini berarti:

- Nuxt saat ini lebih berfungsi sebagai shell/router/runtime.
- Sebagian besar pengalaman UI belum dipindah ke pola composable + page + layout Nuxt yang lebih langsung.

### 3. ViewModel Pattern

Folder `src/viewmodels/**` masih aktif sebagai lapisan koordinasi state/interaction.

Pola ini tidak salah, tetapi di aplikasi Nuxt biasanya sebagian concern seperti:

- route-aware state
- server/client fetch orchestration
- runtime config usage
- page-specific data loading

lebih sering dipindah ke:

- composables
- page `setup`
- server routes
- `useAsyncData` / `useFetch` bila cocok

### 4. DI Container Lama

Repository sekarang sudah diekspos lewat plugin/composable Nuxt, tetapi source instance-nya masih memakai registry shared di `src/infrastructure/repositories.ts`.

Ini menandakan arsitektur sebelumnya masih dipertahankan penuh. Di Nuxt, beberapa dependency seperti runtime config, request-aware service, atau transport client biasanya lebih nyaman disuntikkan melalui composable/factory daripada singleton global.

### 5. Supabase Client Custom

Client Supabase masih dikelola lewat:

- `src/infrastructure/runtime/publicConfig.ts`
- `src/infrastructure/supabase/client.ts`

Ini valid, tetapi bukan pola paling khas Nuxt. Saat ini konfigurasi publik dan client creation masih memakai helper custom, bukan composable Nuxt yang terintegrasi penuh.

## Masih Legacy / Layak Dibersihkan

### 1. Direktori `src/app/` yang Sekarang Kosong

Folder `src/app/` masih tersisa, tetapi isinya sudah kosong setelah struktur dipindah ke `src/pages`, `src/layouts`, `src/middleware`, dan `src/plugins`.

Layak dihapus:

- `src/app/`

### 2. Dependensi yang Sudah Tidak Dipakai

Dari `package.json`, ada beberapa dependency/devDependency yang terlihat sebagai sisa migrasi:

- `@nuxtjs/supabase`
  Sudah tidak dipakai runtime aktif.
- `@nuxtjs/tailwindcss`
  Tidak dipakai di `nuxt.config.ts`.
- `vite-plugin-vue-devtools`
  Sudah tidak dipakai setelah app tidak lagi dibangun dengan `vite.config.ts`.

Catatan:

- Penghapusan paket sebaiknya dibarengi `pnpm remove` agar lockfile ikut bersih.

### 3. `vue-router` sebagai Dependency Aplikasi

Sebagian besar pemakaian aktif `vue-router` sudah dibersihkan dari `src/`, tetapi package `vue-router` masih tercantum di dependency root.

Karena Nuxt memang membawanya secara internal, dependency eksplisit ini mungkin tidak lagi dibutuhkan kecuali ada test/helper yang masih memerlukannya secara langsung.

### 4. Browser-Only Code yang Masih Menyebar

Masih ada banyak pemakaian browser globals langsung seperti:

- `window`
- `document`

terutama di:

- `src/stores/authStore.ts`
- `src/presentation/components/forms/SearchableSelect.vue`
- `src/presentation/components/menus/RowActionsMenu.vue`
- `src/presentation/utils/candidateFormPdfTemplate.ts`
- `src/presentation/utils/employeeRequestFormPdfTemplate.ts`

Karena app saat ini `ssr: false`, ini belum memicu masalah besar. Tetapi kalau nanti SSR diaktifkan, area ini akan jadi sumber error utama.

### 5. Fetch/Data Loading yang Masih SPA-Oriented

Contoh:

- `src/infrastructure/http/backendApi.ts`
- repository Supabase di `src/infrastructure/supabase/repositories/**`
- store auth di `src/stores/authStore.ts`

Masih kuat berorientasi ke:

- bearer token di client
- fetch setelah app init
- singleton client access

Ini cocok untuk fase migrasi, tetapi belum memanfaatkan fitur Nuxt seperti:

- `useFetch`
- `useAsyncData`
- route middleware + server state handoff
- request-scoped helpers

## Prioritas Cleanup yang Disarankan

Urutan yang paling efektif:

### Prioritas 1

Bersihkan sisa struktur mati dan dependency mati.

- hapus `src/app/` yang kosong
- hapus dependency yang tidak dipakai lagi
- cek apakah `vue-router` masih perlu sebagai dependency eksplisit

### Prioritas 2

Turunkan ketergantungan page wrapper tipis.

Target:

- pertahankan `src/pages/**` sebagai route shell dan gunakan `src/features/**` sebagai feature UI, bukan `presentation/pages`
- gunakan `src/presentation/components/**` hanya untuk reusable UI, bukan page shell utama

### Prioritas 3

Nuxt-kan data loading dan runtime access.

Target:

- kurangi singleton repository global
- pindahkan route-aware loading ke composable/page Nuxt
- audit `window` / `document` / `local-only` logic agar lebih eksplisit client-only

### Prioritas 4

Kalau ingin benar-benar Nuxt-native:

- evaluasi `useAsyncData` untuk page data utama
- evaluasi request-aware auth/profile hydration
- pertimbangkan SSR setelah browser-only code bersih

## Definisi Selesai

Codebase ini bisa disebut "lebih Nuxt-native" bila kondisi berikut tercapai:

- `src/pages/**` berisi implementasi page utama, bukan cuma wrapper
- dependency sisa migrasi Vite/Vue lama sudah dibersihkan
- runtime config dan Supabase access tidak bergantung pada helper transisi
- page data loading memanfaatkan pola Nuxt, bukan bootstrap SPA lama
- browser-only logic sudah terisolasi dengan jelas
