<template>
  <div class="flex w-full flex-col gap-5">
    <header class="flex flex-col gap-4 px-5 pt-4 md:px-6">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="app-page-title mt-2">Dashboard</h1>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="app-status-chip app-status-chip-neutral">
            {{ userRole || text('dashboard.compact.unknownRole') }}
          </span>
          <span class="app-status-chip app-status-chip-accent">
            {{ text('dashboard.compact.lastSync') }}:
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
          <h2 class="mt-3 text-[2rem] leading-tight font-semibold tracking-[-0.03em]">
            {{ text('dashboard.compact.helloName', { name: displayName }) }}
          </h2>

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
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="app-section-panel overflow-hidden">
        <div class="border-b border-[var(--app-color-border)] px-5 py-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="app-dashboard-title mt-2 !text-[1.15rem]">
                {{ text('dashboard.compact.todaySFocus') }}
              </h2>
            </div>
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
                <span class="text-sm font-semibold text-[var(--app-color-text)]">{{
                  item.value
                }}</span>
              </div>
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
              <h2 class="app-dashboard-title mt-2 !text-[1.2rem]">
                {{ text('dashboard.compact.needsAttention') }}
              </h2>
            </div>
          </div>
        </div>

        <div class="grid gap-5 px-5 py-5 xl:grid-cols-[260px_minmax(0,1fr)]">
          <article
            class="rounded-[1rem] border border-[var(--app-color-border)] bg-[linear-gradient(180deg,var(--app-color-warning-soft)_0%,var(--app-color-surface)_100%)] px-5 py-5"
          >
            <p
              class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-color-text-soft)]"
            >
              {{ text('dashboard.compact.topPriority') }}
            </p>
            <p class="mt-4 text-sm font-semibold text-[var(--app-color-text)]">
              {{ operationsLeader.label }}
            </p>
            <p
              class="mt-3 text-[3rem] leading-none font-semibold tracking-[-0.05em] text-[var(--app-color-text)]"
            >
              {{ operationsLeader.value }}
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
              {{
                text('dashboard.compact.backlogShare', { percentage: operationsLeader.percentage })
              }}
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
                </div>
                <div class="text-right">
                  <p class="text-lg font-semibold tracking-[-0.03em] text-[var(--app-color-text)]">
                    {{ item.value }}
                  </p>
                  <p class="app-card-copy mt-1">{{ item.percentage }}%</p>
                </div>
              </div>

              <div
                class="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--app-color-surface-subtle)]"
              >
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
            <h2 class="app-dashboard-title mt-2 !text-[1.15rem]">
              {{ text('dashboard.compact.approvalStatus') }}
            </h2>
          </div>
          <span class="app-status-chip app-status-chip-neutral">
            {{ text('dashboard.compact.total', { count: summary.approvals.visible_count }) }}
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
          </article>
        </div>
      </section>
    </div>

    <div class="grid gap-5 px-5 md:px-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section class="app-section-panel p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="app-dashboard-title mt-2 !text-[1.15rem]">
              {{ text('dashboard.compact.readiness') }}
            </h2>
          </div>
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
              </div>
              <div class="text-right">
                <p class="app-copy-strong text-sm">{{ item.percentage }}%</p>
                <p class="app-card-copy mt-1">{{ item.value }}</p>
              </div>
            </div>

            <div
              class="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--app-color-border-strong)]"
            >
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
              <h2 class="app-dashboard-title mt-2 !text-[1.15rem]">
                {{ text('dashboard.compact.upcomingInterviews') }}
              </h2>
            </div>
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
              {{ text('dashboard.compact.noInterviews') }}
            </p>
            <NuxtLink
              to="/interview-evaluations/list"
              class="mt-4 inline-flex rounded-xl border border-[var(--app-color-accent-border)] px-4 py-2 text-sm font-medium text-[var(--app-color-accent-strong)] transition hover:bg-[var(--app-color-accent-soft-hover)]"
            >
              {{ text('dashboard.compact.viewSchedule') }}
            </NuxtLink>
          </div>
        </section>

        <section class="app-section-panel p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="app-dashboard-title mt-2 !text-[1.15rem]">
                {{ text('dashboard.compact.recentActivity') }}
              </h2>
            </div>
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
          <h2 class="app-dashboard-title mt-2 !text-[1.25rem]">
            {{ text('dashboard.compact.recruitmentOverview') }}
          </h2>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <section class="app-section-panel overflow-hidden">
          <div class="border-b border-[var(--app-color-border)] px-5 py-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="app-dashboard-title mt-2 !text-[1.12rem]">
                  {{ text('dashboard.compact.workflow') }}
                </h3>
              </div>
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
                    <h4
                      class="mt-2 text-[1.05rem] font-semibold tracking-[-0.02em] text-[var(--app-color-text)]"
                    >
                      {{ group.label }}
                    </h4>

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
                        <p
                          class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-color-text-soft)]"
                        >
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
                <h3 class="app-dashboard-title mt-2 !text-[1.12rem]">
                  {{ text('dashboard.compact.priorities') }}
                </h3>
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
                <h3 class="app-dashboard-title mt-2 !text-[1.12rem]">Sinyal Terbaru</h3>
              </div>
            </div>

            <div class="mt-5 space-y-4">
              <article
                v-for="signal in dashboardSignals"
                :key="signal.label"
                class="rounded-[1rem] bg-[var(--app-color-surface-subtle)] px-4 py-4"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--app-color-text-soft)]"
                >
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
    label: text('dashboard.compact.activeErf'),
    value: `${summary.value.employee_request_forms.total_count}`,
    icon: FileText,
    iconWrapClass: 'bg-[rgb(116_215_197_/_0.18)] text-white',
  },
  {
    label: text('dashboard.compact.pendingApproval'),
    value: `${summary.value.approvals.pending_count}`,
    icon: CheckSquare,
    iconWrapClass: 'bg-[rgb(232_200_121_/_0.2)] text-white',
  },
  {
    label: text('dashboard.compact.pendingInterviewFeedback'),
    value: `${interviewMonitor.value.pending_count}`,
    icon: FileCheck,
    iconWrapClass: 'bg-[rgb(139_213_189_/_0.2)] text-white',
  },
  {
    label: text('dashboard.compact.activeAlerts'),
    value: `${activeOpsAlerts.value}`,
    icon: ShieldCheck,
    iconWrapClass: 'bg-[rgb(232_170_165_/_0.2)] text-white',
  },
])

const operationsBacklogItems = computed(() =>
  [
    {
      label: text('dashboard.compact.pendingApprovals'),
      shortLabel: 'Approval',
      value: summary.value.approvals.pending_count,
      color: 'var(--app-color-warning-strong)',
    },
    {
      label: text('dashboard.compact.pendingInterviews'),
      shortLabel: 'Interview',
      value: interviewMonitor.value.pending_count,
      color: 'var(--app-color-accent-strong)',
    },
    {
      label: text('dashboard.compact.profilesMissingCv'),
      shortLabel: 'Docs',
      value: documentContractReadiness.value.profiles_missing_cv,
      color: 'var(--app-color-danger)',
    },
    {
      label: text('dashboard.compact.contractFormsInProgress'),
      shortLabel: 'Kontrak',
      value: documentContractReadiness.value.contract_form_in_progress,
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
      label: text('dashboard.compact.noActiveBottleneck'),
      value: 0,
      color: 'var(--app-color-text-soft)',
      percentage: 0,
    }
  )
})

const approvalStatusItems = computed(() => {
  const total = Math.max(1, summary.value.approvals.visible_count)

  return [
    {
      label: text('dashboard.compact.pending'),
      value: summary.value.approvals.pending_count,
      percentage: Math.round((summary.value.approvals.pending_count / total) * 100),
      barClass: 'bg-[var(--app-color-warning-strong)]',
      dotClass: 'bg-[var(--app-color-warning-strong)]',
    },
    {
      label: text('dashboard.compact.approved'),
      value: summary.value.approvals.approved_count,
      percentage: Math.round((summary.value.approvals.approved_count / total) * 100),
      barClass: 'bg-[var(--app-color-success)]',
      dotClass: 'bg-[var(--app-color-success)]',
    },
    {
      label: text('dashboard.compact.rejected'),
      value: summary.value.approvals.rejected_count,
      percentage: Math.round((summary.value.approvals.rejected_count / total) * 100),
      barClass: 'bg-[var(--app-color-danger)]',
      dotClass: 'bg-[var(--app-color-danger)]',
    },
  ]
})

const readinessProgressItems = computed(() => [
  {
    label: text('dashboard.compact.interviewCompletion'),
    value: `${interviewMonitor.value.completed_count}/${Math.max(interviewMonitor.value.visible_count, 0)}`,
    percentage:
      interviewMonitor.value.visible_count > 0
        ? Math.round(
            (interviewMonitor.value.completed_count / interviewMonitor.value.visible_count) * 100,
          )
        : 0,
    barClass:
      'bg-[linear-gradient(90deg,var(--app-color-accent-strong)_0%,var(--app-color-accent)_100%)]',
  },
  {
    label: text('dashboard.compact.documentCoverage'),
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
    barClass:
      'bg-[linear-gradient(90deg,var(--app-color-accent)_0%,var(--app-color-accent-border)_100%)]',
  },
  {
    label: text('dashboard.compact.contractReadiness'),
    value: `${documentContractReadiness.value.contract_form_ready}/${documentContractReadiness.value.contract_form_total}`,
    percentage:
      documentContractReadiness.value.contract_form_total > 0
        ? Math.round(
            (documentContractReadiness.value.contract_form_ready /
              documentContractReadiness.value.contract_form_total) *
              100,
          )
        : 0,
    barClass:
      'bg-[linear-gradient(90deg,var(--app-color-success-strong)_0%,var(--app-color-success)_100%)]',
  },
])

const focusTodayItems = computed(() => [
  {
    title: text('dashboard.compact.pendingApprovals'),
    value: `${summary.value.approvals.pending_count}`,
    icon: CheckSquare,
    iconWrapClass: 'bg-[var(--app-color-accent-soft)] text-[var(--app-color-accent-strong)]',
  },
  {
    title: text('dashboard.compact.pendingFeedback'),
    value: `${interviewMonitor.value.pending_count}`,
    icon: FileCheck,
    iconWrapClass: 'bg-[var(--app-color-accent-soft-hover)] text-[var(--app-color-accent-strong)]',
  },
  {
    title: text('dashboard.compact.missingCandidateCv'),
    value: `${documentContractReadiness.value.profiles_missing_cv}`,
    icon: ClipboardList,
    iconWrapClass: 'bg-[var(--app-color-success-soft)] text-[var(--app-color-success-strong)]',
  },
  {
    title: text('dashboard.compact.contractFormsInProgress'),
    value: `${documentContractReadiness.value.contract_form_in_progress}`,
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
      title: text('dashboard.compact.LatestErf'),
      copy: `${latestJob.main_position?.trim() || 'Posisi tidak diketahui'} · ${latestJob.site?.trim() || 'Site tidak diketahui'}`,
      meta: latestJob.position_status?.trim() || 'ERF',
      dotClass: 'bg-[var(--app-color-warning-strong)]',
    })
  }

  if (interviewMonitor.value.nearest_interview) {
    items.push({
      title: text('dashboard.compact.NextInterview'),
      copy: `${interviewMonitor.value.nearest_interview.candidate_name ?? 'Kandidat'} bersama ${interviewMonitor.value.nearest_interview.interviewer_name ?? 'Interviewer'}`,
      meta: formatDashboardDate(interviewMonitor.value.nearest_interview.interview_date),
      dotClass: 'bg-[var(--app-color-success)]',
    })
  }

  if (documentContractReadiness.value.latest_contract_candidate) {
    items.push({
      title: text('dashboard.compact.LatestContract'),
      copy: documentContractReadiness.value.latest_contract_candidate,
      meta: `${documentContractReadiness.value.contract_form_ready} ready`,
      dotClass: 'bg-[var(--app-color-accent)]',
    })
  }

  if (summary.value.approvals.rejected_count > 0) {
    items.push({
      title: text('dashboard.compact.RejectedApprovals'),
      copy: text('dashboard.compact.NeedsReview'),
      meta: `${summary.value.approvals.rejected_count} rejected`,
      dotClass: 'bg-[var(--app-color-danger)]',
    })
  }

  if (items.length === 0) {
    items.push({
      title: text('dashboard.compact.NoRecentActivity'),
      copy: text('dashboard.compact.NoUpdatesYet'),
      meta: 'Tenang',
      dotClass: 'bg-[var(--app-color-text-soft)]',
    })
  }

  return items.slice(0, 4)
})

const latestIntakeSignal = computed(() => {
  const latestErf = summary.value.employee_request_forms.recent_jobs[0]
  if (!latestErf) {
    return text('dashboard.compact.noRecentErf')
  }

  const position = latestErf.main_position?.trim() || 'Posisi tidak diketahui'
  const site = latestErf.site?.trim() || 'Site tidak diketahui'
  const status = latestErf.position_status?.trim() || 'Terbuka'

  return `${position} · ${site} · ${status}`
})

const nearestCandidateSignal = computed(() => {
  const nearestInterview = interviewMonitor.value.nearest_interview
  if (!nearestInterview) {
    return text('dashboard.compact.noInterviews')
  }

  return `${nearestInterview.candidate_name ?? 'Kandidat'} · ${formatDashboardDate(
    nearestInterview.interview_date,
  )} · ${nearestInterview.interviewer_name ?? 'Interviewer'}`
})

const closingStoryNarrative = computed(
  () =>
    documentContractReadiness.value.latest_contract_candidate ||
    text('dashboard.compact.noRecentContract'),
)

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
      label: text('dashboard.compact.requests'),
      lineClass: 'bg-[var(--app-color-accent)]',
      eyebrowClass: 'text-[var(--app-color-accent-strong)]',
      dotClass: 'bg-[var(--app-color-accent)]',
      metricsGridClass: 'sm:grid-cols-3',
      metrics: [
        {
          label: 'Employee Request Forms',
          value: `${summary.value.employee_request_forms.total_count}`,
          copy: text('dashboard.compact.activeStaffingRequests'),
        },
        {
          label: 'Approval Tracking',
          value: `${summary.value.approvals.pending_count}`,
          copy: text('dashboard.compact.waitingForDecisionDetail'),
        },
        {
          label: 'PIC Recruitment',
          value: `${summary.value.recruitment.total_count}`,
          copy: text('dashboard.compact.readyForRecruiterHandling'),
        },
      ],
      links: [
        { label: 'Employee Request Forms', to: '/employee-request-forms' },
        { label: 'Approval Tracking', to: '/approval-tracking' },
        { label: 'PIC Recruitment', to: '/recruitment/pic-recruitment' },
      ],
    },
    {
      label: text('dashboard.compact.candidates'),
      lineClass: 'bg-[var(--app-color-success)]',
      eyebrowClass: 'text-[var(--app-color-success-strong)]',
      dotClass: 'bg-[var(--app-color-success)]',
      metricsGridClass: 'sm:grid-cols-2',
      metrics: [
        {
          label: 'Candidate & Employee',
          value: `${summary.value.candidate_employees.total_count}`,
          copy: text('dashboard.compact.candidateEmployeeCount', {
            candidates: summary.value.candidate_employees.candidate_count,
            employees: summary.value.candidate_employees.employee_count,
          }),
        },
        {
          label: 'Candidate & Employee Forms',
          value: `${summary.value.candidate_forms.total_count}`,
          copy: text('dashboard.compact.submittedProfiles'),
        },
        {
          label: 'Assessment List',
          value: `${interviewMonitor.value.upcoming_count}`,
          copy: text('dashboard.compact.scheduledInterviews'),
        },
        {
          label: 'Interviewer Form',
          value: `${interviewMonitor.value.pending_count}`,
          copy: text('dashboard.compact.interviewerEvaluationsStillPending'),
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
      label: text('dashboard.compact.documentsContracts'),
      lineClass: 'bg-[var(--app-color-warning-strong)]',
      eyebrowClass: 'text-[var(--app-color-warning-strong)]',
      dotClass: 'bg-[var(--app-color-warning-strong)]',
      metricsGridClass: 'sm:grid-cols-2',
      metrics: [
        {
          label: 'Document Explorer',
          value: `${documentContractReadiness.value.visible_document_candidates}`,
          copy: text('dashboard.compact.monitoredCandidateDocuments'),
        },
        {
          label: 'Employee Contract Form',
          value: `${documentContractReadiness.value.contract_form_ready}/${documentContractReadiness.value.contract_form_total}`,
          copy: text('dashboard.compact.inProgressCount', {
            count: documentContractReadiness.value.contract_form_in_progress,
          }),
        },
      ],
      links: closingLinks,
    },
  ]
})

const actionPriorityGroups = computed(() => [
  {
    label: text('dashboard.compact.requestIntake'),
    labelClass: 'text-[var(--app-color-accent-strong)]',
    dotClass: 'bg-[var(--app-color-accent)]',
    items: [
      {
        title: 'Approval Tracking',
        value: `${summary.value.approvals.pending_count}`,
        valueClass: 'text-[var(--app-color-warning-strong)]',
      },
    ],
  },
  {
    label: text('dashboard.compact.candidatePipeline'),
    labelClass: 'text-[var(--app-color-success-strong)]',
    dotClass: 'bg-[var(--app-color-success)]',
    items: [
      {
        title: 'Candidate & Employee Forms',
        value: `${documentContractReadiness.value.profiles_missing_cv}`,
        valueClass: 'text-[var(--app-color-danger-strong)]',
      },
      {
        title: 'Interviewer Form',
        value: `${interviewMonitor.value.pending_count}`,
        valueClass: 'text-[var(--app-color-accent-strong)]',
      },
    ],
  },
  {
    label: text('dashboard.compact.finalization'),
    labelClass: 'text-[var(--app-color-warning-strong)]',
    dotClass: 'bg-[var(--app-color-warning-strong)]',
    items: [
      {
        title: 'Employee Contract Form',
        value: `${documentContractReadiness.value.contract_form_in_progress}`,
        valueClass: 'text-[var(--app-color-success-strong)]',
      },
    ],
  },
])

const dashboardSignals = computed(() => [
  {
    label: text('dashboard.compact.latestIntake'),
    value: latestIntakeSignal.value,
  },
  {
    label: text('dashboard.compact.nextInterview'),
    value: nearestCandidateSignal.value,
  },
  {
    label: text('dashboard.compact.latestContract'),
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
