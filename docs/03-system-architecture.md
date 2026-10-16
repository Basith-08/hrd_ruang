# 03. System Architecture

## Arsitektur Sistem Aktual

Project mengikuti arsitektur berlapis:

- `src/domain`: entity, contract repository, request object, util domain.
- `src/application`: use case yang mengorkestrasi repository.
- `src/infrastructure`: implementasi repository, client Supabase, adapter HTTP, helper security/runtime.
- `src/features`: page feature dan orchestration UI.
- `server/`: endpoint Nitro, service server, context auth, email, signed URL, export, dan service integration.

Frontend memanggil:

- Supabase client langsung untuk auth session dan beberapa upload file client-side.
- Endpoint Nitro untuk operasi yang butuh service role, permission check, rate limit, atau integrasi eksternal.

## Diagram Arsitektur

```mermaid
flowchart LR
  U[User Browser] --> N[Nuxt 4 SPA]
  N --> SAuth[Supabase Auth]
  N --> SDB[(Supabase PostgreSQL)]
  N --> SS[(Supabase Storage)]
  N --> API[Nitro Server API]
  API --> SAdmin[(Supabase via Service Role)]
  API --> SS
  API --> SMTP[SMTP]
  API --> CAND[Candidate Service / Candidate DB]
```

## Alur Komunikasi Nuxt.js dengan Supabase

1. Client membuat session/login melalui `supabase.auth.signInWithPassword`.
2. `authStore` mengambil access token session.
3. Untuk endpoint internal, `backendApi.ts` mengirim header `Authorization: Bearer <access_token>`.
4. Endpoint server memverifikasi token memakai `supabase.auth.getUser(accessToken)` dari service role client.
5. Server memuat role dan permission dari tabel `user_roles -> roles -> role_permissions -> permissions`.

## Client-Side Flow

```mermaid
sequenceDiagram
  participant User
  participant Page as Nuxt Page/Feature
  participant Store as authStore/ViewModel
  participant Repo as Repository
  participant API as Nitro API
  participant SB as Supabase

  User->>Page: buka halaman
  Page->>Store: init/load action
  Store->>Repo: panggil use case / repository
  alt kebutuhan data public client
    Repo->>SB: query auth/storage client
  else kebutuhan data terproteksi
    Repo->>API: fetch dengan bearer token
    API->>SB: query service role / user-scoped
  end
  SB-->>Repo: hasil
  Repo-->>Store: entity / DTO
  Store-->>Page: state reaktif
```

## Server-Side Flow

Server-side aktif di folder `server/`:

- `server/api/*`: endpoint domain utama aplikasi.
- `server/routes/*`: endpoint Nitro non-`/api`, terutama admin/auth/approval/recruitment utility.
- `server/services/*`: logika bisnis server.
- `server/lib/context.js`: autentikasi request dan permission loading.

## Authentication Flow

```mermaid
sequenceDiagram
  participant User
  participant LoginPage
  participant AuthRepo
  participant ResolveAPI as /auth/resolve-login
  participant SupabaseAuth
  participant ProfileAPI as /auth/profile

  User->>LoginPage: isi identifier + password
  LoginPage->>AuthRepo: login(identifier, password)
  alt identifier bukan email
    AuthRepo->>ResolveAPI: POST identifier
    ResolveAPI-->>AuthRepo: email
  end
  AuthRepo->>SupabaseAuth: signInWithPassword(email, password)
  SupabaseAuth-->>AuthRepo: session + user
  AuthRepo-->>LoginPage: user dasar
  LoginPage->>ProfileAPI: GET profile
  ProfileAPI-->>LoginPage: profile + role + permissions
```

## Database Query Flow

- Query list/detail biasa pada frontend dilakukan melalui repository implementation.
- Data yang sensitif atau perlu service role dilewatkan ke Nitro API.
- Candidate data tertentu dibaca dari candidate DB/service eksternal melalui `candidateDatabaseReadService.js` dan `candidateServiceClient.js`.

## Storage Upload / Download Flow

```mermaid
flowchart TD
  A[Client pilih file] --> B{Jenis file}
  B -->|Foto kandidat| C[Upload langsung via supabase.storage client]
  B -->|Dokumen kontrak employee| D[Upload langsung ke bucket candidate-documents]
  C --> E[Simpan path di form/state]
  D --> F[POST /api/candidate-forms/:id/employee-documents]
  F --> G[Append path ke candidate service]
  H[Open file] --> I[POST sign-url endpoint]
  I --> J[Server validasi akses + source storage]
  J --> K[Return signed URL]
  K --> L[window.open]
```

## Document Generation Flow

```mermaid
flowchart TD
  U[Upload DOCX template] --> T1[/api/export-templates/upload/]
  T1 --> T2[scanDocxPlaceholders]
  T2 --> T3[simpan export_templates]
  T3 --> T4[simpan export_template_fields]
  M[User mapping field] --> T5[/api/export-templates/:id/fields/:fieldId/]
  P[Prepare document] --> T6[/api/export-documents/prepare/]
  T6 --> T7[buildPreparedExportFields]
  V[Preview] --> T8[/api/export-documents/preview/]
  T8 --> T9[generateDocxFromTemplate]
  T9 --> T10[renderDocxPreviewHtml]
  G[Generate final] --> T11[/api/export-documents/generate/]
  T11 --> T12[generate DOCX]
  T12 --> T13[simpan generated_exports]
  T13 --> T14[download file]
```

## Security Consideration

- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server.
- Middleware route client memeriksa permission per route.
- Endpoint server memvalidasi permission ulang melalui `requireAnyPermission`.
- Security header aktif di middleware server dalam mode report-only untuk CSP.
- File storage dibuka memakai signed URL satu jam.
- Rate limit aktif untuk resolve login, CSP report, dan send email.
- Tidak semua tabel export memiliki RLS yang ditemukan di repository; akses saat ini diamankan melalui endpoint server berpermission dan service role. Ini perlu perhatian tambahan.
