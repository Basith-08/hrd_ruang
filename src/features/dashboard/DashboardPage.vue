<template>
  <div class="flex w-full flex-col gap-5">
    <header class="flex flex-col gap-4 px-5 pt-4 md:px-6">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="app-dashboard-eyebrow">Ruang Kerja / Workspace</p>
          <h1 class="app-page-title mt-2">Dashboard</h1>
          <p class="app-page-description mt-2 max-w-3xl">
            {{
              text('dashboard.header.welcome', {
                email: user?.email ?? '-',
                role: userRole ?? '-',
              })
            }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="app-status-chip app-status-chip-neutral">
            {{ userRole || 'Peran tidak diketahui / Unknown role' }}
          </span>
          <span class="app-status-chip app-status-chip-accent">
            Sinkron terakhir / Last sync:
            {{
              lastSyncedAt
                ? formatDashboardDate(lastSyncedAt)
                : loading
                  ? text('common.loading')
                  : '-'
            }}
          </span>
        </div>
      </div>
    </header>

    <AppAlert :message="loadError" />

    <div class="grid gap-5 px-5 md:px-6 xl:grid-cols-[minmax(0,1.6fr)_340px]">
      <section
        class="relative overflow-hidden rounded-[1.2rem] bg-[linear-gradient(135deg,var(--app-sidebar-color-bg)_0%,var(--app-color-accent-strong)_62%,var(--app-color-accent)_100%)] px-6 py-6 text-white shadow-[0_28px_60px_-34px_rgb(18_59_61_/_0.72)]"
      >
        <div class="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/8 blur-2xl" />
        <div
          class="absolute bottom-[-2.5rem] right-16 h-36 w-36 rounded-full bg-[rgb(116_215_197_/_0.12)] blur-2xl"
        />

        <div class="relative z-10">
          <p class="text-sm font-semibold tracking-[0.16em] text-white/55 uppercase">
            Ruang Kerja / Workspace
          </p>
          <h2 class="mt-3 text-[2rem] leading-tight font-semibold tracking-[-0.03em]">
            Selamat datang kembali, {{ displayName }}
          </h2>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-white/72">
            Pantau flow inti recruitment dari ERF, approval, PIC recruitment, kandidat, interview,
            dokumen, sampai handoff kontrak dalam satu dashboard tanpa mengulang analitik rekrutmen
            yang sudah ada di halaman lain.
          </p>

          <div class="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article
              v-for="item in heroStats"
              :key="item.label"
              class="flex items-center gap-4 rounded-[1rem] border border-white/12 bg-white/8 px-4 py-4 backdrop-blur-sm"
            >
              <span
                class="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                :class="item.iconWrapClass"
              >
                <component :is="item.icon" class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-white/58">
                  {{ item.label }}
                </p>
                <p class="mt-1 text-[2rem] leading-none font-semibold tracking-[-0.04em]">
                  {{ item.value }}
                </p>
                <p class="mt-1 text-xs text-white/70">
                  {{ item.copy }}
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="app-section-panel overflow-hidden">
        <div class="border-b border-[var(--app-color-border)] px-5 py-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="app-dashboard-eyebrow">Focus Hari Ini</p>
              <h2 class="app-dashboard-title mt-2 !text-[1.15rem]">
                Fokus Hari Ini / Today's Focus
              </h2>
            </div>
            <span class="app-status-chip app-status-chip-accent">Prioritas / Priority</span>
          </div>
        </div>

        <div class="divide-y divide-[var(--app-color-border)]">
          <article
            v-for="item in focusTodayItems"
            :key="item.title"
            class="flex items-start gap-4 px-5 py-4"
          >
            <span
              class="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl"
              :class="item.iconWrapClass"
            >
              <component :is="item.icon" class="h-4 w-4" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <p class="app-copy-strong text-sm">{{ item.title }}</p>
                <span class="text-sm font-semibold text-[var(--app-color-text)]">{{ item.value }}</span>
              </div>
              <p class="app-card-copy mt-1">{{ item.copy }}</p>
            </div>
          </article>
        </div>
      </section>
    </div>

    <div class="grid gap-5 px-5 md:px-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
      <section class="app-section-panel overflow-hidden">
        <div class="border-b border-[var(--app-color-border)] px-5 py-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="app-dashboard-eyebrow">Grafik Operasional / Operations Chart</p>
              <h2 class="app-dashboard-title mt-2 !text-[1.2rem]">
                Bottleneck Operasional per Modul / Operational Bottleneck by Module
              </h2>
              <p class="app-dashboard-copy mt-2">
                Fokus pada backlog lintas modul yang perlu action sekarang.
              </p>
            </div>
            <span class="app-status-chip app-status-chip-neutral">Semua Modul</span>
          </div>
        </div>

        <div class="grid gap-5 px-5 py-5 xl:grid-cols-[260px_minmax(0,1fr)]">
          <article
            class="rounded-[1rem] border border-[var(--app-color-border)] bg-[linear-gradient(180deg,var(--app-color-warning-soft)_0%,var(--app-color-surface)_100%)] px-5 py-5"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-color-text-soft)]">
              Bottleneck dominan / Dominant bottleneck
            </p>
            <p class="mt-4 text-sm font-semibold text-[var(--app-color-text)]">
              {{ operationsLeader.label }}
            </p>
            <p
              class="mt-3 text-[3rem] leading-none font-semibold tracking-[-0.05em] text-[var(--app-color-text)]"
            >
              {{ operationsLeader.value }}
            </p>
            <p class="mt-3 text-sm leading-6 text-[var(--app-color-text-muted)]">
              {{ operationsLeader.copy }}
            </p>
            <div
              class="mt-5 h-2.5 overflow-hidden rounded-full bg-[var(--app-color-surface)] shadow-[inset_0_0_0_1px_rgb(197_216_212_/_0.55)]"
            >
              <div
                class="h-full rounded-full"
                :style="{
                  width: `${operationsLeader.percentage}%`,
                  background: operationsLeader.color,
                }"
              />
            </div>
            <p class="mt-2 text-xs font-medium text-[var(--app-color-text-soft)]">
              {{ operationsLeader.percentage }}% dari bottleneck yang sedang terpantau / of tracked
              bottlenecks
            </p>
          </article>

          <div class="space-y-4">
            <article
              v-for="item in operationsBacklogItems"
              :key="item.label"
              class="app-dashboard-subpanel"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span
                      class="h-2.5 w-2.5 rounded-full"
                      :style="{ backgroundColor: item.color }"
                    />
                    <p class="app-copy-strong text-sm">{{ item.label }}</p>
                  </div>
                  <p class="app-card-copy mt-1">{{ item.helper }} · {{ item.copy }}</p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-semibold tracking-[-0.03em] text-[var(--app-color-text)]">
                    {{ item.value }}
                  </p>
                  <p class="app-card-copy mt-1">{{ item.percentage }}%</p>
                </div>
              </div>

              <div class="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--app-color-surface-subtle)]">
                <div
                  class="h-full rounded-full transition-[width] duration-300"
                  :style="{
                    width: `${item.percentage}%`,
                    background: item.color,
                  }"
                />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="app-section-panel p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="app-dashboard-eyebrow">Ringkasan Approval / Approval Snapshot</p>
            <h2 class="app-dashboard-title mt-2 !text-[1.15rem]">
              Snapshot Status Approval / Approval Status Snapshot
            </h2>
          </div>
          <span class="app-status-chip app-status-chip-neutral">
            {{ summary.approvals.visible_count }} terlihat / visible
          </span>
        </div>

        <div class="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <article
            v-for="item in approvalStatusItems"
            :key="item.label"
            class="app-dashboard-subpanel"
          >
            <div class="flex items-center gap-2">
              <span class="h-2.5 w-2.5 rounded-full" :class="item.dotClass" />
              <p class="app-copy-strong text-sm">{{ item.label }}</p>
            </div>
            <p
              class="mt-3 text-[1.9rem] leading-none font-semibold tracking-[-0.04em] text-[var(--app-color-text)]"
            >
              {{ item.value }}
            </p>
            <p class="app-card-copy mt-2">{{ item.copy }}</p>
          </article>
        </div>
      </section>
    </div>

    <div class="grid gap-5 px-5 md:px-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section class="app-section-panel p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="app-dashboard-eyebrow">Progress Kesiapan / Readiness Progress</p>
            <h2 class="app-dashboard-title mt-2 !text-[1.15rem]">
              Progress Kesiapan / Readiness Progress
            </h2>
          </div>
          <span class="app-status-chip app-status-chip-neutral">3 Titik Cek / Checkpoints</span>
        </div>

        <div class="mt-5 space-y-4">
          <article
            v-for="item in readinessProgressItems"
            :key="item.label"
            class="app-dashboard-subpanel"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="app-copy-strong text-sm">{{ item.label }}</p>
                <p class="app-card-copy mt-1">{{ item.copy }}</p>
              </div>
              <div class="text-right">
                <p class="app-copy-strong text-sm">{{ item.percentage }}%</p>
                <p class="app-card-copy mt-1">{{ item.value }}</p>
              </div>
            </div>

            <div class="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--app-color-border-strong)]">
              <div
                class="h-full rounded-full"
                :class="item.barClass"
                :style="{ width: `${item.percentage}%` }"
              />
            </div>
          </article>
        </div>
      </section>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section class="app-section-panel p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="app-dashboard-eyebrow">Jadwal Mendatang / Upcoming</p>
              <h2 class="app-dashboard-title mt-2 !text-[1.15rem]">
                Interview Mendatang / Upcoming Interviews
              </h2>
            </div>
            <span class="app-status-chip app-status-chip-accent">Mendatang / Upcoming</span>
          </div>

          <div v-if="upcomingInterviewItems.length > 0" class="mt-5 space-y-3">
            <article
              v-for="item in upcomingInterviewItems"
              :key="`${item.candidate_name}-${item.interview_date}`"
              class="app-dashboard-card px-4 py-3"
            >
              <div class="flex items-start gap-3">
                <span
                  class="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-color-accent-soft)] text-[var(--app-color-accent-strong)]"
                >
                  <FileCheck class="h-4 w-4" />
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="app-copy-strong text-sm">{{ item.candidate_name }}</p>
                      <p class="app-card-copy mt-1">{{ item.applied_position }}</p>
                    </div>
                    <span class="app-status-chip app-status-chip-neutral">
                      {{ item.interview_date }}
                    </span>
                  </div>
                  <p class="app-card-copy mt-2">{{ item.interviewer_name }}</p>
                </div>
              </div>
            </article>
          </div>

          <div
            v-else
            class="mt-5 rounded-[1rem] border border-dashed border-[var(--app-color-border)] bg-[var(--app-color-surface-muted)] px-4 py-5 text-center"
          >
            <span
              class="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--app-color-accent-soft)] text-[var(--app-color-accent-strong)]"
            >
              <FileCheck class="h-5 w-5" />
            </span>
            <p class="mt-3 text-sm font-medium text-[var(--app-color-text-muted)]">
              Belum ada jadwal interview mendatang yang terlihat pada cakupan user saat ini. / No
              upcoming interviews are visible for the current user scope.
            </p>
            <NuxtLink
              to="/interview-evaluations/list"
              class="mt-4 inline-flex rounded-xl border border-[var(--app-color-accent-border)] px-4 py-2 text-sm font-medium text-[var(--app-color-accent-strong)] transition hover:bg-[var(--app-color-accent-soft-hover)]"
            >
              Lihat Kalender / View Calendar
            </NuxtLink>
          </div>
        </section>

        <section class="app-section-panel p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="app-dashboard-eyebrow">Aktivitas Terbaru / Recent Activity</p>
              <h2 class="app-dashboard-title mt-2 !text-[1.15rem]">
                Aktivitas Terbaru / Recent Activity
              </h2>
            </div>
            <span class="app-link-accent text-sm">Lihat Semua / View All</span>
          </div>

          <div class="mt-5 space-y-4">
            <article
              v-for="item in recentActivityItems"
              :key="`${item.title}-${item.meta}`"
              class="flex items-start gap-3"
            >
              <span class="mt-2 h-2.5 w-2.5 rounded-full" :class="item.dotClass" />
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <p class="app-copy-strong text-sm">{{ item.title }}</p>
                  <span class="app-card-copy shrink-0">{{ item.meta }}</span>
                </div>
                <p class="app-card-copy mt-1">{{ item.copy }}</p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <section class="px-5 pb-5 md:px-6">
      <div class="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p class="app-dashboard-eyebrow">Sekilas / At a Glance</p>
          <h2 class="app-dashboard-title mt-2 !text-[1.25rem]">
            Ringkasan Kesehatan Rekrutmen / Recruitment Health Overview
          </h2>
          <p class="app-dashboard-copy mt-2 max-w-3xl">
            Satu area untuk membaca alur kerja dari intake, pergerakan kandidat, sampai closing
            tanpa harus membuka menu satu per satu.
          </p>
        </div>
        <span class="app-status-chip app-status-chip-neutral">Pindai 5 detik / 5-second scan</span>
      </div>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <section class="app-section-panel overflow-hidden">
          <div class="border-b border-[var(--app-color-border)] px-5 py-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="app-dashboard-eyebrow">Kesehatan Alur / Flow Health</p>
                <h3 class="app-dashboard-title mt-2 !text-[1.12rem]">
                  Keadaan Alur Kerja Saat Ini
                </h3>
              </div>
              <span class="app-status-chip app-status-chip-accent">Operasional / Operational</span>
            </div>
          </div>

          <div class="px-5 py-5">
            <div class="space-y-3">
              <article
                v-for="group in overviewFlowGroups"
                :key="group.label"
                class="relative overflow-hidden rounded-[1.25rem] border border-[var(--app-color-border)] bg-[var(--app-color-surface)] px-5 py-5"
              >
                <div class="absolute inset-x-0 top-0 h-1.5" :class="group.lineClass" />

                <div class="grid gap-5 pt-2 xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-6">
                  <div>
                    <p
                      class="text-xs font-semibold tracking-[0.14em] uppercase"
                      :class="group.eyebrowClass"
                    >
                      {{ group.eyebrow }}
                    </p>
                    <h4 class="mt-2 text-[1.05rem] font-semibold tracking-[-0.02em] text-[var(--app-color-text)]">
                      {{ group.label }}
                    </h4>
                    <p class="app-card-copy mt-2">{{ group.copy }}</p>

                    <div class="mt-4 flex flex-wrap gap-2">
                      <NuxtLink
                        v-for="link in group.links"
                        :key="link.to"
                        :to="link.to"
                        class="inline-flex rounded-xl border border-[var(--app-color-border)] bg-[var(--app-color-surface-muted)] px-3 py-2 text-sm font-medium text-[var(--app-color-text-muted)] transition hover:bg-[var(--app-color-surface)]"
                      >
                        {{ link.label }}
                      </NuxtLink>
                    </div>
                  </div>

                  <div
                    class="overflow-hidden rounded-[1.1rem] border border-[var(--app-color-border)] bg-[var(--app-color-surface-muted)] sm:grid"
                    :class="group.metricsGridClass"
                  >
                    <div
                      v-for="metric in group.metrics"
                      :key="metric.label"
                      class="px-4 py-4 sm:min-h-[150px] sm:border-l sm:border-[var(--app-color-border)] first:sm:border-l-0"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-color-text-soft)]">
                          {{ metric.label }}
                        </p>
                        <span class="h-2.5 w-2.5 rounded-full" :class="group.dotClass" />
                      </div>
                      <p
                        class="mt-5 text-[2rem] leading-none font-semibold tracking-[-0.05em] text-[var(--app-color-text)]"
                      >
                        {{ metric.value }}
                      </p>
                      <p class="mt-3 text-sm leading-6 text-[var(--app-color-text-muted)]">
                        {{ metric.copy }}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <div class="space-y-4">
          <section class="app-section-panel p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="app-dashboard-eyebrow">Perlu Perhatian / Need Attention</p>
                <h3 class="app-dashboard-title mt-2 !text-[1.12rem]">Perlu Tindakan Sekarang</h3>
              </div>
              <span class="app-status-chip app-status-chip-neutral">{{ activeOpsAlerts }}</span>
            </div>

            <div class="mt-5 space-y-3">
              <article
                v-for="group in actionPriorityGroups"
                :key="group.label"
                class="rounded-[1rem] border border-[var(--app-color-border)] bg-[var(--app-color-surface-muted)] px-4 py-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <p
                    class="text-xs font-semibold uppercase tracking-[0.14em]"
                    :class="group.labelClass"
                  >
                    {{ group.label }}
                  </p>
                  <span class="h-2.5 w-2.5 rounded-full" :class="group.dotClass" />
                </div>

                <div class="mt-3 space-y-3">
                  <div
                    v-for="item in group.items"
                    :key="item.title"
                    class="rounded-[0.95rem] border border-[var(--app-color-border)] bg-[var(--app-color-surface)] px-3.5 py-3.5"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="app-copy-strong text-sm">{{ item.title }}</p>
                        <p class="app-card-copy mt-1">{{ item.copy }}</p>
                      </div>
                      <p
                        class="text-[1.35rem] leading-none font-semibold tracking-[-0.04em]"
                        :class="item.valueClass"
                      >
                        {{ item.value }}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section class="app-section-panel p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="app-dashboard-eyebrow">Sinyal / Signals</p>
                <h3 class="app-dashboard-title mt-2 !text-[1.12rem]">Sinyal Terbaru</h3>
              </div>
              <span class="app-status-chip app-status-chip-accent">Langsung / Live</span>
            </div>

            <div class="mt-5 space-y-4">
              <article
                v-for="signal in dashboardSignals"
                :key="signal.label"
                class="rounded-[1rem] bg-[var(--app-color-surface-subtle)] px-4 py-4"
              >
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-color-text-soft)]">
                  {{ signal.label }}
                </p>
                <p class="mt-2 text-sm leading-6 text-[var(--app-color-text-muted)]">
                  {{ signal.value }}
                </p>
              </article>
            </div>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CheckSquare, ClipboardList, FileCheck, FileText, ShieldCheck } from 'lucide-vue-next'

import { callBackendApi } from '@/infrastructure/http/backendApi'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import { useLocale } from '@/composables/useLocale'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'

type DashboardSummaryResponse = {
  employee_request_forms: {
    total_count: number
    recent_jobs: Array<{
      id: string
      main_position: string | null
      site: string | null
      position_status: string | null
    }>
  }
  approvals: {
    visible_count: number
    pending_count: number
    approved_count: number
    rejected_count: number
  }
  recruitment: {
    total_count: number
  }
  candidate_employees: {
    total_count: number
    candidate_count: number
    employee_count: number
  }
  candidate_forms: {
    total_count: number
  }
}

type DashboardInterviewMonitorResponse = {
  interview_monitor: {
    visible_count: number
    pending_count: number
    completed_count: number
    upcoming_count: number
    nearest_interview: {
      candidate_name: string | null
      interview_date: string | null
      interviewer_name: string | null
      applied_position: string | null
    } | null
    upcoming_interviews: Array<{
      candidate_name: string | null
      interview_date: string | null
      interviewer_name: string | null
      applied_position: string | null
    }>
  }
}

type DashboardDocumentContractReadinessResponse = {
  document_contract_readiness: {
    visible_document_candidates: number
    profiles_without_documents: number
    profiles_missing_cv: number
    profiles_with_contract_documents: number
    contract_form_total: number
    contract_form_ready: number
    contract_form_in_progress: number
    latest_contract_candidate: string | null
  }
}

const { formatDateTime, text } = useLocale()
const { hasPermission, user, userRole } = useAuthViewModel()

const summary = ref<DashboardSummaryResponse>({
  employee_request_forms: {
    total_count: 0,
    recent_jobs: [],
  },
  approvals: {
    visible_count: 0,
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0,
  },
  recruitment: {
    total_count: 0,
  },
  candidate_employees: {
    total_count: 0,
    candidate_count: 0,
    employee_count: 0,
  },
  candidate_forms: {
    total_count: 0,
  },
})
const interviewMonitor = ref<DashboardInterviewMonitorResponse['interview_monitor']>({
  visible_count: 0,
  pending_count: 0,
  completed_count: 0,
  upcoming_count: 0,
  nearest_interview: null,
  upcoming_interviews: [],
})
const documentContractReadiness = ref<
  DashboardDocumentContractReadinessResponse['document_contract_readiness']
>({
  visible_document_candidates: 0,
  profiles_without_documents: 0,
  profiles_missing_cv: 0,
  profiles_with_contract_documents: 0,
  contract_form_total: 0,
  contract_form_ready: 0,
  contract_form_in_progress: 0,
  latest_contract_candidate: null,
})
const loading = ref(false)
const loadError = ref('')
const lastSyncedAt = ref<string | null>(null)

const displayName = computed(() => {
  const explicitName = String(user?.value?.full_name ?? '').trim()
  if (explicitName) {
    return explicitName
  }

  const email = String(user?.value?.email ?? '').trim()
  if (!email) {
    return 'User'
  }

  return email.split('@')[0] || 'User'
})

const canGenerateDocuments = computed(() => hasPermission('export_configuration:generate'))

function formatDashboardDate(value: string | null | undefined) {
  if (!value) {
    return '-'
  }

  return formatDateTime(value, { dateStyle: 'medium' })
}

const activeOpsAlerts = computed(
  () =>
    summary.value.approvals.pending_count +
    interviewMonitor.value.pending_count +
    documentContractReadiness.value.profiles_missing_cv +
    documentContractReadiness.value.contract_form_in_progress,
)

const heroStats = computed(() => [
  {
    label: 'ERF Aktif / Active ERF',
    value: `${summary.value.employee_request_forms.total_count}`,
    copy: 'Permintaan aktif pada cakupan saat ini / Active requests in current scope',
    icon: FileText,
    iconWrapClass: 'bg-[rgb(116_215_197_/_0.18)] text-white',
  },
  {
    label: 'Approval Tertunda / Pending Approval',
    value: `${summary.value.approvals.pending_count}`,
    copy: 'Menunggu keputusan / Waiting for decision',
    icon: CheckSquare,
    iconWrapClass: 'bg-[rgb(232_200_121_/_0.2)] text-white',
  },
  {
    label: 'Feedback Interview Tertunda / Pending Interview Feedback',
    value: `${interviewMonitor.value.pending_count}`,
    copy: 'Feedback tertunda / Feedback waiting',
    icon: FileCheck,
    iconWrapClass: 'bg-[rgb(139_213_189_/_0.2)] text-white',
  },
  {
    label: 'Alert Aktif / Active Alerts',
    value: `${activeOpsAlerts.value}`,
    copy: 'Butuh tindak lanjut / Needs follow-up',
    icon: ShieldCheck,
    iconWrapClass: 'bg-[rgb(232_170_165_/_0.2)] text-white',
  },
])

const operationsBacklogItems = computed(() =>
  [
    {
      label: 'Approval tertunda / Pending approvals',
      shortLabel: 'Approval',
      value: summary.value.approvals.pending_count,
      helper: 'Tinjau / Review',
      copy: 'Permintaan yang masih menunggu keputusan approver. / Requests still waiting for approver decision.',
      color: 'var(--app-color-warning-strong)',
    },
    {
      label: 'Interview tertunda / Pending interviews',
      shortLabel: 'Interview',
      value: interviewMonitor.value.pending_count,
      helper: 'Feedback',
      copy: 'Evaluasi yang belum selesai dari interviewer. / Evaluations not yet completed by interviewer.',
      color: 'var(--app-color-accent-strong)',
    },
    {
      label: 'CV belum lengkap / Profiles missing CV',
      shortLabel: 'Docs',
      value: documentContractReadiness.value.profiles_missing_cv,
      helper: 'CV kurang / Missing CV',
      copy: 'Profil yang terlihat masih belum memiliki CV. / Visible profiles still do not have CV uploaded.',
      color: 'var(--app-color-danger)',
    },
    {
      label: 'Contract form berjalan / Contract forms in progress',
      shortLabel: 'Kontrak',
      value: documentContractReadiness.value.contract_form_in_progress,
      helper: 'Penutupan / Closing',
      copy: 'Handoff kontrak yang masih setengah jalan. / Contract handoff still in progress.',
      color: 'var(--app-color-success)',
    },
  ].map((item) => ({
    ...item,
    percentage:
      activeOpsAlerts.value > 0 && item.value > 0
        ? Math.max(4, Math.round((item.value / activeOpsAlerts.value) * 100))
        : 0,
  })),
)

const operationsLeader = computed(() => {
  const [topItem] = [...operationsBacklogItems.value].sort(
    (left, right) => right.value - left.value,
  )

  return (
    topItem ?? {
      label: 'Tidak ada bottleneck aktif / No active bottleneck',
      value: 0,
      helper: 'Tenang / Idle',
      copy: 'Belum ada bottleneck lintas modul pada cakupan saat ini. / No cross-module bottleneck in current scope.',
      color: 'var(--app-color-text-soft)',
      percentage: 0,
    }
  )
})

const approvalStatusItems = computed(() => {
  const total = Math.max(1, summary.value.approvals.visible_count)

  return [
    {
      label: 'Tertunda / Pending',
      value: summary.value.approvals.pending_count,
      percentage: Math.round((summary.value.approvals.pending_count / total) * 100),
      barClass: 'bg-[var(--app-color-warning-strong)]',
      dotClass: 'bg-[var(--app-color-warning-strong)]',
      copy: 'Masih menunggu action approver.',
    },
    {
      label: 'Disetujui / Approved',
      value: summary.value.approvals.approved_count,
      percentage: Math.round((summary.value.approvals.approved_count / total) * 100),
      barClass: 'bg-[var(--app-color-success)]',
      dotClass: 'bg-[var(--app-color-success)]',
      copy: 'Sudah lolos dari sisi approval.',
    },
    {
      label: 'Ditolak / Rejected',
      value: summary.value.approvals.rejected_count,
      percentage: Math.round((summary.value.approvals.rejected_count / total) * 100),
      barClass: 'bg-[var(--app-color-danger)]',
      dotClass: 'bg-[var(--app-color-danger)]',
      copy: 'Butuh follow-up bisnis atau revisi demand.',
    },
  ]
})

const readinessProgressItems = computed(() => [
  {
    label: 'Penyelesaian interview / Interview completion',
    value: `${interviewMonitor.value.completed_count}/${Math.max(interviewMonitor.value.visible_count, 0)}`,
    percentage:
      interviewMonitor.value.visible_count > 0
        ? Math.round(
            (interviewMonitor.value.completed_count / interviewMonitor.value.visible_count) * 100,
          )
        : 0,
    copy: 'Semakin tinggi, semakin kecil peluang kandidat tertahan di stage evaluasi.',
    barClass: 'bg-[linear-gradient(90deg,var(--app-color-accent-strong)_0%,var(--app-color-accent)_100%)]',
  },
  {
    label: 'Cakupan dokumen / Document coverage',
    value: `${Math.max(documentContractReadiness.value.visible_document_candidates - documentContractReadiness.value.profiles_without_documents, 0)}/${documentContractReadiness.value.visible_document_candidates}`,
    percentage:
      documentContractReadiness.value.visible_document_candidates > 0
        ? Math.round(
            ((documentContractReadiness.value.visible_document_candidates -
              documentContractReadiness.value.profiles_without_documents) /
              documentContractReadiness.value.visible_document_candidates) *
              100,
          )
        : 0,
    copy: 'Mengukur berapa banyak profil yang terlihat sudah punya dokumen dasar.',
    barClass: 'bg-[linear-gradient(90deg,var(--app-color-accent)_0%,var(--app-color-accent-border)_100%)]',
  },
  {
    label: 'Kesiapan kontrak / Contract readiness',
    value: `${documentContractReadiness.value.contract_form_ready}/${documentContractReadiness.value.contract_form_total}`,
    percentage:
      documentContractReadiness.value.contract_form_total > 0
        ? Math.round(
            (documentContractReadiness.value.contract_form_ready /
              documentContractReadiness.value.contract_form_total) *
              100,
          )
        : 0,
    copy: 'Semakin tinggi, semakin rapi proses handoff rekrutmen ke administrasi.',
    barClass: 'bg-[linear-gradient(90deg,var(--app-color-success-strong)_0%,var(--app-color-success)_100%)]',
  },
])

const focusTodayItems = computed(() => [
  {
    title: 'Approval menunggu review / Approval items waiting for review',
    value: `${summary.value.approvals.pending_count}`,
    copy:
      summary.value.approvals.pending_count > 0
        ? 'Mulai dari sini karena approval adalah bottleneck paling awal.'
        : 'Tidak ada item approval tertunda pada cakupan saat ini.',
    icon: CheckSquare,
    iconWrapClass: 'bg-[var(--app-color-accent-soft)] text-[var(--app-color-accent-strong)]',
  },
  {
    title: 'Feedback interview tertunda / Pending interview feedback',
    value: `${interviewMonitor.value.pending_count}`,
    copy:
      interviewMonitor.value.pending_count > 0
        ? 'Dorong feedback interviewer selesai supaya kandidat tidak tertahan.'
        : 'Tidak ada feedback interview yang masih tertunda saat ini.',
    icon: FileCheck,
    iconWrapClass: 'bg-[var(--app-color-accent-soft-hover)] text-[var(--app-color-accent-strong)]',
  },
  {
    title: 'CV kandidat belum lengkap / Missing candidate CV',
    value: `${documentContractReadiness.value.profiles_missing_cv}`,
    copy: 'Lengkapi CV lebih dulu karena ini blocker paling dasar untuk review kandidat.',
    icon: ClipboardList,
    iconWrapClass: 'bg-[var(--app-color-success-soft)] text-[var(--app-color-success-strong)]',
  },
  {
    title: 'Contract form berjalan / Contract forms in progress',
    value: `${documentContractReadiness.value.contract_form_in_progress}`,
    copy: 'Pastikan closing document dan data contract tidak menggantung di akhir proses.',
    icon: FileText,
    iconWrapClass: 'bg-[var(--app-color-warning-soft)] text-[var(--app-color-warning-strong)]',
  },
])

const upcomingInterviewItems = computed(() =>
  interviewMonitor.value.upcoming_interviews.map((item) => ({
    candidate_name: item.candidate_name ?? 'Kandidat',
    interview_date: formatDashboardDate(item.interview_date),
    interviewer_name: item.interviewer_name ?? 'Interviewer belum ditetapkan',
    applied_position: item.applied_position ?? 'Posisi belum diatur',
  })),
)

const recentActivityItems = computed(() => {
  const items: Array<{
    title: string
    copy: string
    meta: string
    dotClass: string
  }> = []

  if (summary.value.employee_request_forms.recent_jobs[0]) {
    const latestJob = summary.value.employee_request_forms.recent_jobs[0]
    items.push({
      title: 'ERF baru masuk ke dashboard',
      copy: `${latestJob.main_position?.trim() || 'Posisi tidak diketahui'} · ${latestJob.site?.trim() || 'Site tidak diketahui'}`,
      meta: latestJob.position_status?.trim() || 'ERF',
      dotClass: 'bg-[var(--app-color-warning-strong)]',
    })
  }

  if (interviewMonitor.value.nearest_interview) {
    items.push({
      title: 'Jadwal interview perlu perhatian',
      copy: `${interviewMonitor.value.nearest_interview.candidate_name ?? 'Kandidat'} bersama ${interviewMonitor.value.nearest_interview.interviewer_name ?? 'Interviewer'}`,
      meta: formatDashboardDate(interviewMonitor.value.nearest_interview.interview_date),
      dotClass: 'bg-[var(--app-color-success)]',
    })
  }

  if (documentContractReadiness.value.latest_contract_candidate) {
    items.push({
      title: 'Handoff kontrak sedang bergerak',
      copy: documentContractReadiness.value.latest_contract_candidate,
      meta: `${documentContractReadiness.value.contract_form_ready} ready`,
      dotClass: 'bg-[var(--app-color-accent)]',
    })
  }

  if (summary.value.approvals.rejected_count > 0) {
    items.push({
      title: 'Approval yang ditolak masih butuh tindak lanjut bisnis',
      copy: 'Tinjau demand yang tertahan sebelum terlalu lama berhenti di sisi intake.',
      meta: `${summary.value.approvals.rejected_count} rejected`,
      dotClass: 'bg-[var(--app-color-danger)]',
    })
  }

  if (items.length === 0) {
    items.push({
      title: 'Belum ada sinyal aktivitas besar',
      copy: 'Dashboard belum melihat pergerakan baru pada cakupan user saat ini.',
      meta: 'Tenang',
      dotClass: 'bg-[var(--app-color-text-soft)]',
    })
  }

  return items.slice(0, 4)
})

const latestIntakeSignal = computed(() => {
  const latestErf = summary.value.employee_request_forms.recent_jobs[0]
  if (!latestErf) {
    return 'Belum ada ERF baru yang menjadi sinyal intake pada cakupan user saat ini.'
  }

  const position = latestErf.main_position?.trim() || 'Posisi tidak diketahui'
  const site = latestErf.site?.trim() || 'Site tidak diketahui'
  const status = latestErf.position_status?.trim() || 'Terbuka'

  return `${position} di ${site} saat ini menjadi intake terbaru dengan status ${status}.`
})

const nearestCandidateSignal = computed(() => {
  const nearestInterview = interviewMonitor.value.nearest_interview
  if (!nearestInterview) {
    return 'Belum ada jadwal interview terdekat yang muncul pada scope user saat ini.'
  }

  return `${nearestInterview.candidate_name ?? 'Kandidat'} dijadwalkan interview ${formatDashboardDate(
    nearestInterview.interview_date,
  )} bersama ${nearestInterview.interviewer_name ?? 'interviewer'}.`
})

const closingStoryNarrative = computed(() => {
  if (documentContractReadiness.value.latest_contract_candidate) {
    const exportCopy = canGenerateDocuments.value
      ? 'Setelah data final siap, lanjutkan ke Document Export untuk membuat dokumen output.'
      : 'Final output document dilanjutkan oleh role yang memiliki akses export.'

    return `${documentContractReadiness.value.latest_contract_candidate} saat ini menjadi sinyal closing terbaru. ${exportCopy}`
  }

  return canGenerateDocuments.value
    ? 'Belum ada kandidat closing terbaru, tetapi jalur contract dan Document Export sudah siap dipakai saat data final tersedia.'
    : 'Belum ada kandidat closing terbaru pada cakupan saat ini.'
})

const overviewFlowGroups = computed(() => {
  const closingLinks = [
    { label: 'Document Explorer', to: '/recruitment/document-explorer' },
    { label: 'Employee Contract Form', to: '/recruitment/new-employee-contract-forms' },
  ]

  if (canGenerateDocuments.value) {
    closingLinks.push({ label: 'Document Export', to: '/configuration-export/generate' })
  }

  return [
    {
      eyebrow: 'Intake Permintaan / Request Intake',
      label: 'Permintaan dan penugasan awal / Request and initial assignment',
      copy: 'Employee Request Forms bergerak dari pembuatan demand, approval, lalu masuk ke PIC Recruitment untuk penugasan recruiter. / Employee Request Forms move from demand creation, approval, then into PIC Recruitment for recruiter assignment.',
      lineClass: 'bg-[var(--app-color-accent)]',
      eyebrowClass: 'text-[var(--app-color-accent-strong)]',
      dotClass: 'bg-[var(--app-color-accent)]',
      metricsGridClass: 'sm:grid-cols-3',
      metrics: [
        {
          label: 'Employee Request Forms',
          value: `${summary.value.employee_request_forms.total_count}`,
          copy: 'permintaan kerja aktif / active staffing requests',
        },
        {
          label: 'Approval Tracking',
          value: `${summary.value.approvals.pending_count}`,
          copy: 'menunggu keputusan / waiting for decision',
        },
        {
          label: 'PIC Recruitment',
          value: `${summary.value.recruitment.total_count}`,
          copy: 'siap ditangani recruiter / ready for recruiter handling',
        },
      ],
      links: [
        { label: 'Employee Request Forms', to: '/employee-request-forms' },
        { label: 'Approval Tracking', to: '/approval-tracking' },
        { label: 'PIC Recruitment', to: '/recruitment/pic-recruitment' },
      ],
    },
    {
      eyebrow: 'Pipeline Kandidat / Candidate Pipeline',
      label:
        'Registrasi kandidat sampai evaluasi interview / Candidate registration to interview evaluation',
      copy: 'Candidate & Employee dipakai untuk registrasi akun kandidat, Candidate & Employee Forms untuk pengisian data, lalu Assessment List dan Interviewer Form membawa kandidat ke evaluasi. / Candidate & Employee is used to register candidate accounts, Candidate & Employee Forms for data submission, then Assessment List and Interviewer Form bring candidates into evaluation.',
      lineClass: 'bg-[var(--app-color-success)]',
      eyebrowClass: 'text-[var(--app-color-success-strong)]',
      dotClass: 'bg-[var(--app-color-success)]',
      metricsGridClass: 'sm:grid-cols-2',
      metrics: [
        {
          label: 'Candidate & Employee',
          value: `${summary.value.candidate_employees.total_count}`,
          copy: `${summary.value.candidate_employees.candidate_count} kandidat / candidate · ${summary.value.candidate_employees.employee_count} employee`,
        },
        {
          label: 'Candidate & Employee Forms',
          value: `${summary.value.candidate_forms.total_count}`,
          copy: 'profil yang sudah submit / submitted profiles',
        },
        {
          label: 'Assessment List',
          value: `${interviewMonitor.value.upcoming_count}`,
          copy: 'jadwal interview yang sudah tersusun / scheduled interviews',
        },
        {
          label: 'Interviewer Form',
          value: `${interviewMonitor.value.pending_count}`,
          copy: 'evaluasi interviewer belum selesai / interviewer evaluations still pending',
        },
      ],
      links: [
        { label: 'Candidate & Employee', to: '/candidate-employees' },
        { label: 'Candidate & Employee Forms', to: '/candidate-forms' },
        { label: 'Assessment List', to: '/interview-evaluations/list' },
        { label: 'Interviewer Form', to: '/interview-evaluations' },
      ],
    },
    {
      eyebrow: 'Finalisasi / Finalization',
      label: 'Dokumen, kontrak, dan output akhir / Documents, contract, and final output',
      copy: 'Sesudah interview selesai, alur bergerak ke Document Explorer, New Employee Contract Form, lalu Document Export sebagai output akhir jika role memiliki akses. / After interviews are completed, the flow moves to Document Explorer, New Employee Contract Form, then Document Export as the final output when the role has access.',
      lineClass: 'bg-[var(--app-color-warning-strong)]',
      eyebrowClass: 'text-[var(--app-color-warning-strong)]',
      dotClass: 'bg-[var(--app-color-warning-strong)]',
      metricsGridClass: 'sm:grid-cols-2',
      metrics: [
        {
          label: 'Document Explorer',
          value: `${documentContractReadiness.value.visible_document_candidates}`,
          copy: 'dokumen kandidat termonitor / monitored candidate documents',
        },
        {
          label: 'Employee Contract Form',
          value: `${documentContractReadiness.value.contract_form_ready}/${documentContractReadiness.value.contract_form_total}`,
          copy: `${documentContractReadiness.value.contract_form_in_progress} masih dalam proses / still in progress`,
        },
      ],
      links: closingLinks,
    },
  ]
})

const actionPriorityGroups = computed(() => [
  {
    label: 'Intake Permintaan / Request Intake',
    labelClass: 'text-[var(--app-color-accent-strong)]',
    dotClass: 'bg-[var(--app-color-accent)]',
    items: [
      {
        title: 'Approval Tracking',
        value: `${summary.value.approvals.pending_count}`,
        copy: 'Demand belum bisa bergerak ke recruiter sebelum area ini beres. / Demand cannot move to recruiter before this is resolved.',
        valueClass: 'text-[var(--app-color-warning-strong)]',
      },
    ],
  },
  {
    label: 'Pipeline Kandidat / Candidate Pipeline',
    labelClass: 'text-[var(--app-color-success-strong)]',
    dotClass: 'bg-[var(--app-color-success)]',
    items: [
      {
        title: 'Candidate & Employee Forms',
        value: `${documentContractReadiness.value.profiles_missing_cv}`,
        copy: 'Kandidat belum menuntaskan upload CV saat mengisi Candidate Form. / Candidate has not completed CV upload in Candidate Form.',
        valueClass: 'text-[var(--app-color-danger-strong)]',
      },
      {
        title: 'Interviewer Form',
        value: `${interviewMonitor.value.pending_count}`,
        copy: 'Kandidat bisa tertahan bila evaluator belum menutup penilaian. / Candidate may be blocked if evaluator has not closed the assessment.',
        valueClass: 'text-[var(--app-color-accent-strong)]',
      },
    ],
  },
  {
    label: 'Finalisasi / Finalization',
    labelClass: 'text-[var(--app-color-warning-strong)]',
    dotClass: 'bg-[var(--app-color-warning-strong)]',
    items: [
      {
        title: 'Employee Contract Form',
        value: `${documentContractReadiness.value.contract_form_in_progress}`,
        copy: 'Menunjukkan closing yang belum benar-benar selesai di ujung proses. / Shows closing that is not fully completed at the end of the process.',
        valueClass: 'text-[var(--app-color-success-strong)]',
      },
    ],
  },
])

const dashboardSignals = computed(() => [
  {
    label: 'Intake terbaru / Latest intake',
    value: latestIntakeSignal.value,
  },
  {
    label: 'Gerakan kandidat terdekat / Nearest candidate movement',
    value: nearestCandidateSignal.value,
  },
  {
    label: 'Sinyal closing / Closing signal',
    value: closingStoryNarrative.value,
  },
])

function resolveLoadErrorMessage(result: PromiseSettledResult<unknown>, fallback: string) {
  if (result.status === 'fulfilled') {
    return ''
  }

  return result.reason instanceof Error ? result.reason.message : fallback
}

onMounted(async () => {
  loading.value = true
  loadError.value = ''

  const [summaryResult, interviewResult, documentResult] = await Promise.allSettled([
    callBackendApi<DashboardSummaryResponse>('/api/dashboard/summary'),
    callBackendApi<DashboardInterviewMonitorResponse>('/api/dashboard/interview-monitor'),
    callBackendApi<DashboardDocumentContractReadinessResponse>(
      '/api/dashboard/document-contract-readiness',
    ),
  ])

  try {
    if (summaryResult.status === 'rejected') {
      throw summaryResult.reason
    }

    summary.value = summaryResult.value

    if (interviewResult.status === 'fulfilled') {
      interviewMonitor.value = interviewResult.value.interview_monitor
    }

    if (documentResult.status === 'fulfilled') {
      documentContractReadiness.value = documentResult.value.document_contract_readiness
    }

    lastSyncedAt.value = new Date().toISOString()

    const partialErrors = [
      resolveLoadErrorMessage(interviewResult, 'Interview monitor failed to load.'),
      resolveLoadErrorMessage(documentResult, 'Document and contract monitor failed to load.'),
    ].filter(Boolean)

    loadError.value = partialErrors.join(' ')
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Failed to load dashboard summary.'
  } finally {
    loading.value = false
  }
})
</script>
