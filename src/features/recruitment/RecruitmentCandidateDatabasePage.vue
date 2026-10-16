<template>
  <div class="flex w-full flex-col gap-4">
    <AppAlert :message="error" />

    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-3xl">
          <p class="app-dashboard-eyebrow">
            {{ text('recruitmentCandidates.page.eyebrow') }}
          </p>
          <h1 class="app-dashboard-title mt-3">
            {{ text('recruitmentCandidates.page.title') }}
          </h1>
          <p class="app-dashboard-copy mt-2">
            {{ text('recruitmentCandidates.page.description') }}
          </p>
        </div>
      </div>

      <div class="app-dashboard-kpi-layout">
        <div class="app-dashboard-kpi-hero">
          <div class="app-dashboard-kpi-hero-main">
            <p class="app-dashboard-kpi-hero-label">
              {{ text('recruitmentCandidates.stats.total') }}
            </p>
            <p class="app-dashboard-kpi-hero-value">
              {{ candidates.length }}
            </p>
            <p class="app-dashboard-kpi-hero-copy">
              {{ text('recruitmentCandidates.filters.resultSummary', {
                shown: filteredCandidates.length, total:
                  candidates.length }) }}
            </p>
          </div>
          <div class="app-dashboard-kpi-hero-meta">
            <div class="app-dashboard-kpi-hero-meta-card">
              <p class="app-dashboard-kpi-hero-meta-label">
                {{ text('recruitmentCandidates.stats.boundErf') }}
              </p>
              <p class="app-dashboard-kpi-hero-meta-value">
                {{ linkedErfCount }}
              </p>
            </div>
            <div class="app-dashboard-kpi-hero-meta-card">
              <p class="app-dashboard-kpi-hero-meta-label">
                {{ text('recruitmentCandidates.stats.departments') }}
              </p>
              <p class="app-dashboard-kpi-hero-meta-value">
                {{ departmentCoverageCount }}
              </p>
            </div>
          </div>
        </div>

        <div class="app-dashboard-kpi-grid">
          <div class="app-dashboard-kpi-card app-dashboard-kpi-card-success">
            <p class="app-dashboard-kpi-card-label">
              {{ text('recruitmentCandidates.stats.completed') }}
            </p>
            <p class="app-dashboard-kpi-card-value">
              {{ completedCount }}
            </p>
            <p class="app-dashboard-kpi-card-copy">
              {{ text('recruitmentCandidates.stats.completedHint') }}
            </p>
          </div>

          <div class="app-dashboard-kpi-card app-dashboard-kpi-card-warning">
            <p class="app-dashboard-kpi-card-label">
              {{ text('recruitmentCandidates.stats.inProgress') }}
            </p>
            <p class="app-dashboard-kpi-card-value">
              {{ inProgressCount }}
            </p>
            <p class="app-dashboard-kpi-card-copy">
              {{ text('recruitmentCandidates.stats.inProgressHint') }}
            </p>
          </div>

          <div class="app-dashboard-kpi-card app-dashboard-kpi-card-accent">
            <p class="app-dashboard-kpi-card-label">
              {{ text('recruitmentCandidates.stats.filtered') }}
            </p>
            <p class="app-dashboard-kpi-card-value">
              {{ filteredCandidates.length }}
            </p>
            <p class="app-dashboard-kpi-card-copy">
              {{ text('recruitmentCandidates.stats.filteredHint') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="app-dashboard-panel">
      <div class="app-dashboard-panel-header">
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="max-w-2xl">
              <p class="app-dashboard-eyebrow">
                {{ text('recruitmentCandidates.filters.title') }}
              </p>
              <h2 class="app-dashboard-title mt-2 !text-[1.15rem]">
                {{ text('recruitmentCandidates.filters.subtitle') }}
              </h2>
              <p class="app-dashboard-copy mt-1">
                {{ text('recruitmentCandidates.filters.resultSummary', {
                  shown: filteredCandidates.length, total:
                candidates.length }) }}
              </p>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row xl:flex-none">
              <AppActionButton class="inline-flex min-h-11 min-w-[120px] items-center justify-center"
                variant="secondary" :label="text('common.actions.refresh')" :loading="loading"
                :loading-label="text('common.loading')" @click="refresh" />
              <AppActionButton v-if="canExportCandidateFormExcel"
                class="inline-flex min-h-11 min-w-[160px] items-center justify-center"
                variant="success" :label="text('common.actions.exportExcel')"
                :loading="bulkExportLoading" :loading-label="text('common.loading')"
                :disabled="bulkExportLoading || loading || filteredCandidates.length === 0"
                @click="handleBulkExportExcel" />
              <AppActionButton class="h-11 px-4 py-0" variant="ghost"
                :label="text('recruitmentCandidates.filters.reset')" :disabled="!hasActiveFilters"
                @click="resetFilters" />
            </div>
          </div>

          <div class="grid gap-3 xl:grid-cols-[minmax(260px,1.4fr)_repeat(4,minmax(140px,1fr))]">
            <label class="block lg:col-span-2">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.search') }}
              </span>
              <AppSearchInput v-model="searchQuery"
                :placeholder="text('recruitmentCandidates.filters.searchPlaceholder')" />
            </label>
            <label class="block">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.formStatus') }}
              </span>
              <SearchableSelect v-model="statusFilter" :options="statusOptions" show-empty-option
                :empty-label="text('common.status.all')"
                :placeholder="text('recruitmentCandidates.filters.statusPlaceholder')" />
            </label>
            <label class="block">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('recruitmentCandidates.columns.role') }}
              </span>
              <SearchableSelect v-model="roleFilter" :options="roleOptions" show-empty-option
                :empty-label="text('common.status.all')"
                :placeholder="text('recruitmentCandidates.filters.rolePlaceholder')" />
            </label>
            <label class="block">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.employeeRequestForm') }}
              </span>
              <SearchableSelect v-model="erfFilter" :options="erfOptions" show-empty-option
                :empty-label="text('common.status.all')"
                :placeholder="text('recruitmentCandidates.filters.erfPlaceholder')" />
            </label>
            <label class="block">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('common.labels.department') }}
              </span>
              <SearchableSelect v-model="departmentFilter" :options="departmentOptions" show-empty-option
                :empty-label="text('common.status.all')"
                :placeholder="text('recruitmentCandidates.filters.departmentPlaceholder')" />
            </label>
            <label class="block">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('recruitmentCandidates.filters.applicationFrom') }}
              </span>
              <input v-model="applicationStart" type="date" class="app-field" />
            </label>
            <label class="block">
              <span class="app-fieldset-label mb-1.5 block">
                {{ text('recruitmentCandidates.filters.applicationTo') }}
              </span>
              <input v-model="applicationEnd" type="date" class="app-field" />
            </label>

            <div v-if="hasActiveFilters" class="app-dashboard-chip-row mt-4">
              <button v-for="filter in activeFilterChips" :key="filter.key" type="button" class="app-filter-chip"
                @click="clearFilter(filter.key)">
                <span>{{ filter.label }}: {{ filter.value }}</span>
                <span aria-hidden="true">x</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="app-dashboard-mobile-stack lg:hidden">
        <article v-for="(candidate, index) in pagedCandidates" :key="`card-${candidate.id}`" class="app-candidate-card">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="app-table-muted text-xs font-medium">#{{ rowNumber(index) }}</span>
                <span :class="candidateRoleBadge(candidate)">
                  {{ candidateRoleLabel(candidate) }}
                </span>
                <span class="app-badge-muted">
                  {{ candidateSourceLabel(candidate.candidate_source) }}
                </span>
              </div>
              <h2 class="app-card-title mt-2 truncate text-base">
                {{ candidateName(candidate) }}
              </h2>
              <p class="app-copy-body app-copy-strong mt-1 truncate">
                {{ fallback(candidate.employee_request_form?.main_position) }}
              </p>
              <p class="app-table-muted mt-1 truncate text-xs">
                {{ fallback(candidate.employee_request_form?.department) }} • {{
                  fallback(candidate.employee_request_form?.site) }}
              </p>
            </div>
            <span class="shrink-0" :class="candidateStatusBadge(candidate.completion_status)">
              {{ candidateStatusLabel(candidate.completion_status) }}
            </span>
          </div>

          <dl class="mt-4 grid gap-3 border-t app-table-divider pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt class="app-label-compact">{{ text('common.labels.email') }}</dt>
              <dd class="app-copy-body mt-1 break-words">{{ fallback(candidateDetail(candidate).personal_email) }}</dd>
            </div>
            <div>
              <dt class="app-label-compact">{{ text('common.labels.phone') }}</dt>
              <dd class="app-copy-body mt-1">{{ fallback(candidateDetail(candidate).phone_number) }}</dd>
            </div>
            <div>
              <dt class="app-label-compact">{{ text('common.labels.department') }}</dt>
              <dd class="app-copy-body mt-1">{{ fallback(candidate.employee_request_form?.department) }}</dd>
            </div>
            <div>
              <dt class="app-label-compact">{{ text('recruitmentCandidates.columns.applicationDate') }}</dt>
              <dd class="app-copy-body mt-1">{{ formatDateDisplay(candidateDetail(candidate).date_application) }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="app-label-compact">{{ text('recruitmentCandidates.columns.education') }}</dt>
              <dd class="app-copy-body mt-1">{{ latestEducation(candidate) }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="app-label-compact">{{ text('recruitmentCandidates.columns.work') }}</dt>
              <dd class="app-copy-body mt-1">{{ latestWork(candidate) }}</dd>
            </div>
          </dl>

          <button v-if="canOpenCandidateDetail" type="button" class="app-detail-button mt-4"
            @click="goToCandidateDetail(candidate.id)">
            {{ text('common.actions.detail') }}
          </button>
        </article>

        <div v-if="!loading && filteredCandidates.length === 0" class="app-dashboard-empty">
          {{ text('common.noMatchingData') }}
        </div>
      </div>

      <div class="hidden overflow-x-auto lg:block">
            <table class="w-full min-w-[2100px] border-separate border-spacing-0 text-left text-sm">
              <thead class="app-dashboard-table-head">
                <tr>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[56px]">
                    {{ text('common.labels.no') }}</th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[220px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('name')">
                      <span>{{ text('common.labels.name') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('name') }}</span>
                    </button></th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[120px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('role')">
                      <span>{{ text('recruitmentCandidates.columns.role') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('role') }}</span>
                    </button></th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[140px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('source')">
                      <span>{{ text('recruitmentCandidates.columns.source') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('source') }}</span>
                    </button></th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[160px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('completion_status')">
                      <span>{{ text('common.labels.formStatus') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('completion_status') }}</span>
                    </button></th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[220px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('email')">
                      <span>{{ text('common.labels.email') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('email') }}</span>
                    </button></th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[160px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('phone')">
                      <span>{{ text('common.labels.phone') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('phone') }}</span>
                    </button></th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[240px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('employee_request_form')">
                      <span>{{ text('common.labels.employeeRequestForm') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('employee_request_form') }}</span>
                    </button></th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[160px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('pt')">
                      <span>{{ text('recruitmentCandidates.columns.pt') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('pt') }}</span>
                    </button></th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[180px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('department')">
                      <span>{{ text('common.labels.department') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('department') }}</span>
                    </button></th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[140px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('site')">
                      <span>{{ text('recruitmentCandidates.columns.site') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('site') }}</span>
                    </button></th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[160px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('application_date')">
                      <span>{{ text('recruitmentCandidates.columns.applicationDate') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('application_date') }}</span>
                    </button></th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[170px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('available_start_date')">
                      <span>{{ text('recruitmentCandidates.columns.availableStart') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('available_start_date') }}</span>
                    </button></th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[220px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('birth')">
                      <span>{{ text('recruitmentCandidates.columns.birth') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('birth') }}</span>
                    </button></th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[120px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('gender')">
                      <span>{{ text('recruitmentCandidates.columns.gender') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('gender') }}</span>
                    </button></th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[260px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('education')">
                      <span>{{ text('recruitmentCandidates.columns.education') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('education') }}</span>
                    </button></th>
                  <th
                    class="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[280px]">
                    <button type="button" class="inline-flex items-center gap-2 transition hover:text-slate-800"
                      @click="toggleSort('work')">
                      <span>{{ text('recruitmentCandidates.columns.work') }}</span>
                      <span class="text-[10px] normal-case text-slate-500">{{ sortIndicator('work') }}</span>
                    </button></th>
                  <th v-if="canOpenCandidateDetail"
                    class="border-b border-slate-200 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 whitespace-nowrap min-w-[120px]">
                    {{ text('common.labels.actions') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(candidate, index) in pagedCandidates" :key="candidate.id" class="transition hover:bg-sky-50/40">
                  <td class="border-b border-slate-200 px-4 py-4 text-sm text-slate-400 align-middle whitespace-nowrap">{{ rowNumber(index) }}</td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle min-w-[220px]">
                    <p class="app-copy-strong whitespace-nowrap">{{ candidateName(candidate) }}</p>
                    <p class="app-table-muted mt-1 whitespace-nowrap text-xs">{{
                      fallback(candidateDetail(candidate).id_no) }}</p>
                  </td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
                    <span :class="candidateRoleBadge(candidate)">
                      {{ candidateRoleLabel(candidate) }}
                    </span>
                  </td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">{{
                    candidateSourceLabel(candidate.candidate_source) }}</td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">
                    <span :class="candidateStatusBadge(candidate.completion_status)">
                      {{ candidateStatusLabel(candidate.completion_status) }}
                    </span>
                  </td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">{{
                    fallback(candidateDetail(candidate).personal_email) }}</td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">{{
                    fallback(candidateDetail(candidate).phone_number) }}</td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle min-w-[240px]">
                    <p class="app-copy-strong whitespace-nowrap">{{
                      fallback(candidate.employee_request_form?.main_position) }}</p>
                    <p class="app-table-muted mt-1 whitespace-nowrap text-xs">{{
                      fallback(candidate.employee_request_form?.site) }}</p>
                  </td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">{{
                    fallback(candidate.employee_request_form?.pt_name) }}</td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">{{
                    fallback(candidate.employee_request_form?.department) }}</td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">{{
                    fallback(candidate.employee_request_form?.site) }}</td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">{{
                    formatDateDisplay(candidateDetail(candidate).date_application) }}</td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">{{
                    formatDateDisplay(candidateDetail(candidate).available_start_date) }}</td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle min-w-[220px]">
                    {{fallback([candidateDetail(candidate).place_of_birth,
                    formatDateDisplay(candidateDetail(candidate).date_of_birth)].filter((item) => item && item !==
                    '-').join(', ')) }}
                  </td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle whitespace-nowrap">{{ fallback(candidateDetail(candidate).gender) }}
                  </td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle min-w-[260px] whitespace-normal leading-6 text-sm text-slate-600">{{
                    latestEducation(candidate) }}</td>
                  <td class="border-b border-slate-200 px-4 py-4 align-middle min-w-[280px] whitespace-normal leading-6 text-sm text-slate-600">{{ latestWork(candidate)
                    }}</td>
                  <td v-if="canOpenCandidateDetail" class="border-b border-slate-200 px-4 py-4 text-right align-middle whitespace-nowrap">
                    <button type="button" class="app-table-inline-action" @click="goToCandidateDetail(candidate.id)">
                      {{ text('common.actions.detail') }}
                    </button>
                  </td>
                </tr>
                <tr v-if="!loading && filteredCandidates.length === 0">
                  <td :colspan="canOpenCandidateDetail ? 18 : 17" class="px-6 py-10">
                    <div class="app-dashboard-empty">
                      {{ text('common.noMatchingData') }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
      </div>

      <div v-if="!loading && filteredCandidates.length > 0" class="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="text-sm text-slate-500">
          <strong class="font-semibold text-slate-800">{{ pageStart }}</strong>
          -
          <strong class="font-semibold text-slate-800">{{ pageEnd }}</strong>
          /
          <strong class="font-semibold text-slate-800">{{ filteredCandidates.length }}</strong>
        </div>
        <TablePagination v-model:page="page" :page-size="pageSize" :total-items="filteredCandidates.length" />
      </div>
    </section>

    <AppLoadingOverlay v-if="loading" :message="text('common.loading')" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from '#imports'

import type { CandidateForm } from '@/domain/entities/CandidateForm'
import { useLocale } from '@/composables/useLocale'
import { useAuthViewModel } from '@/viewmodels/useAuthViewModel'
import { useCandidateFormViewModel } from '@/viewmodels/useCandidateFormViewModel'
import { callBackendApi, fetchBackendApi } from '@/infrastructure/http/backendApi'
import AppActionButton from '@/presentation/components/buttons/AppActionButton.vue'
import AppAlert from '@/presentation/components/feedback/AppAlert.vue'
import AppLoadingOverlay from '@/presentation/components/feedback/AppLoadingOverlay.vue'
import { useAppToast } from '@/presentation/components/feedback/useAppToast'
import AppSearchInput from '@/presentation/components/forms/AppSearchInput.vue'
import SearchableSelect from '@/presentation/components/forms/SearchableSelect.vue'
import TablePagination from '@/presentation/components/tables/TablePagination.vue'
import {
  candidateRoleBadge as resolveCandidateRoleBadge,
  candidateRoleLabel as resolveCandidateRoleLabel,
} from '@/features/candidateForms/candidateFormRole'
import {
  candidateStatusBadge,
  candidateStatusLabel as resolveCandidateStatusLabel,
} from '@/features/candidateForms/candidateFormStatus'
import { formatDateDisplay } from '@/presentation/utils/dateFormat'
import { compareNullableValues, type TableSortDirection } from '@/presentation/utils/tableSort'

type SelectOption = {
  value: string
  label: string
}
type FilterKey =
  | 'search'
  | 'status'
  | 'role'
  | 'erf'
  | 'department'
  | 'applicationStart'
  | 'applicationEnd'

type ActiveFilterChip = {
  key: FilterKey
  label: string
  value: string
}

type CandidateDatabaseSortKey =
  | 'name'
  | 'role'
  | 'source'
  | 'completion_status'
  | 'email'
  | 'phone'
  | 'employee_request_form'
  | 'pt'
  | 'department'
  | 'site'
  | 'application_date'
  | 'available_start_date'
  | 'birth'
  | 'gender'
  | 'education'
  | 'work'

const router = useRouter()
const { text } = useLocale()
const { hasAnyPermission } = useAuthViewModel()
const { candidates, getById, loading, error, refresh } = useCandidateFormViewModel()
const appToast = useAppToast()

const searchQuery = ref('')
const statusFilter = ref('')
const roleFilter = ref('')
const erfFilter = ref('')
const departmentFilter = ref('')
const applicationStart = ref('')
const applicationEnd = ref('')
const sortKey = ref<CandidateDatabaseSortKey | ''>('')
const sortDirection = ref<TableSortDirection>('asc')
const page = ref(1)
const pageSize = 10
const bulkExportLoading = ref(false)
const candidateDetailById = ref<Record<string, CandidateForm>>({})
const pendingDetailIds = new Set<string>()
const activeExportPollTimers = new Map<string, number>()
const candidateFormExportJobStorageKey = 'candidate-form-export-jobs'

type ExportJob = {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  error: string | null
  filename: string | null
}

const canOpenCandidateDetail = computed(() =>
  hasAnyPermission(['candidate_form:read', 'employee_form:read']),
)
const canExportCandidateFormExcel = computed(() =>
  hasAnyPermission(['candidate_form:export_excel', 'employee_form:export_excel']),
)

const completedCount = computed(() =>
  candidates.value.filter((candidate) => candidate.completion_status === 'completed').length,
)
const inProgressCount = computed(() =>
  candidates.value.filter((candidate) => candidate.completion_status !== 'completed').length,
)
const linkedErfCount = computed(() =>
  candidates.value.filter((candidate) =>
    Boolean(candidate.employee_request_form?.id || candidate.employee_request_form_id),
  ).length,
)
const departmentCoverageCount = computed(() =>
  new Set(
    candidates.value
      .map((candidate) => String(candidate.employee_request_form?.department ?? '').trim())
      .filter(Boolean),
  ).size,
)

const statusOptions = computed<SelectOption[]>(() => [
  { value: 'in_progress', label: candidateStatusLabel('in_progress') },
  { value: 'completed', label: candidateStatusLabel('completed') },
])
const roleOptions = computed<SelectOption[]>(() =>
  uniqueOptions(
    candidates.value
      .map((candidate) => String(candidate.role ?? '').trim())
      .filter(isNonEmptyString),
  ),
)
const erfOptions = computed<SelectOption[]>(() =>
  uniqueOptions(candidates.value.map((candidate) => candidate.employee_request_form?.main_position).filter(isNonEmptyString)),
)
const departmentOptions = computed<SelectOption[]>(() =>
  uniqueOptions(candidates.value.map((candidate) => candidate.employee_request_form?.department).filter(isNonEmptyString)),
)
const activeFilterChips = computed<ActiveFilterChip[]>(() => {
  const chips: ActiveFilterChip[] = []
  const push = (key: FilterKey, label: string, value: string) => {
    if (value) chips.push({ key, label, value })
  }

  push('search', text('common.labels.search'), searchQuery.value.trim())
  push('status', text('common.labels.formStatus'), optionLabel(statusOptions.value, statusFilter.value))
  push('role', text('recruitmentCandidates.columns.role'), optionLabel(roleOptions.value, roleFilter.value))
  push('erf', text('common.labels.employeeRequestForm'), optionLabel(erfOptions.value, erfFilter.value))
  push('department', text('common.labels.department'), optionLabel(departmentOptions.value, departmentFilter.value))
  push('applicationStart', text('recruitmentCandidates.filters.applicationFrom'), applicationStart.value)
  push('applicationEnd', text('recruitmentCandidates.filters.applicationTo'), applicationEnd.value)

  return chips
})
const hasActiveFilters = computed(() => activeFilterChips.value.length > 0)

const filteredCandidates = computed(() => {
  const query = normalize(searchQuery.value)

  return candidates.value.filter((candidate) => {
    if (statusFilter.value && candidate.completion_status !== statusFilter.value) return false
    if (roleFilter.value && candidate.role !== roleFilter.value) return false

    const mainPosition = candidate.employee_request_form?.main_position ?? ''
    if (erfFilter.value && mainPosition !== erfFilter.value) return false

    const department = candidate.employee_request_form?.department ?? ''
    if (departmentFilter.value && department !== departmentFilter.value) return false

    const applicationDate = dateKey(candidate.date_application)
    if (applicationStart.value && (!applicationDate || applicationDate < applicationStart.value)) return false
    if (applicationEnd.value && (!applicationDate || applicationDate > applicationEnd.value)) return false

    if (!query) return true

    const haystack = [
      candidateName(candidate),
      candidate.id_no,
      candidate.personal_email,
      candidate.phone_number,
      mainPosition,
      candidate.employee_request_form?.pt_name,
      department,
      candidate.employee_request_form?.site,
      candidate.gender,
      candidate.marital_status,
      candidate.nationality,
      candidate.religion,
      latestEducation(candidate),
      latestWork(candidate),
    ].map(normalize).join(' ')

    return haystack.includes(query)
  })
})

function candidateBirthLabel(candidate: CandidateForm) {
  return fallback([
    candidateDetail(candidate).place_of_birth,
    formatDateDisplay(candidateDetail(candidate).date_of_birth),
  ].filter((item) => item && item !== '-').join(', '))
}

function candidateSortValue(candidate: CandidateForm, key: CandidateDatabaseSortKey) {
  switch (key) {
    case 'name':
      return candidateName(candidate)
    case 'role':
      return candidateRoleLabel(candidate)
    case 'source':
      return candidateSourceLabel(candidate.candidate_source)
    case 'completion_status':
      return candidateStatusLabel(candidate.completion_status)
    case 'email':
      return fallback(candidateDetail(candidate).personal_email)
    case 'phone':
      return fallback(candidateDetail(candidate).phone_number)
    case 'employee_request_form':
      return fallback(candidate.employee_request_form?.main_position)
    case 'pt':
      return fallback(candidate.employee_request_form?.pt_name)
    case 'department':
      return fallback(candidate.employee_request_form?.department)
    case 'site':
      return fallback(candidate.employee_request_form?.site)
    case 'application_date':
      return dateKey(candidateDetail(candidate).date_application)
    case 'available_start_date':
      return dateKey(candidateDetail(candidate).available_start_date)
    case 'birth':
      return candidateBirthLabel(candidate)
    case 'gender':
      return fallback(candidateDetail(candidate).gender)
    case 'education':
      return latestEducation(candidate)
    case 'work':
      return latestWork(candidate)
    default:
      return ''
  }
}

const sortedCandidates = computed(() => {
  const activeSortKey = sortKey.value
  if (!activeSortKey) return filteredCandidates.value

  return [...filteredCandidates.value].sort((left, right) =>
    compareNullableValues(
      candidateSortValue(left, activeSortKey),
      candidateSortValue(right, activeSortKey),
      sortDirection.value,
    ))
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedCandidates.value.length / pageSize)),
)
const pageStart = computed(() => {
  if (sortedCandidates.value.length === 0) return 0
  return (page.value - 1) * pageSize + 1
})
const pageEnd = computed(() => {
  if (sortedCandidates.value.length === 0) return 0
  return Math.min(page.value * pageSize, sortedCandidates.value.length)
})
const pagedCandidates = computed(() => {
  const safePage = Math.min(Math.max(page.value, 1), totalPages.value)
  const start = (safePage - 1) * pageSize
  return sortedCandidates.value.slice(start, start + pageSize)
})

watch(
  [searchQuery, statusFilter, roleFilter, erfFilter, departmentFilter, applicationStart, applicationEnd],
  () => {
    page.value = 1
  },
)
watch(
  () => filteredCandidates.value.length,
  () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  },
)
watch(
  pagedCandidates,
  () => {
    void hydratePagedCandidateDetails()
  },
  { immediate: true },
)

onMounted(() => {
  for (const jobId of readPersistedExportJobIds()) {
    scheduleExportJobPoll(jobId)
  }
})

onBeforeUnmount(() => {
  for (const timerId of activeExportPollTimers.values()) {
    window.clearTimeout(timerId)
  }
  activeExportPollTimers.clear()
})

function normalize(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function isNonEmptyString(value: unknown): value is string {
  return String(value ?? '').trim().length > 0
}

function uniqueOptions(values: string[], labelResolver: (value: string) => string = (value) => value): SelectOption[] {
  return Array.from(new Set(values))
    .sort((left, right) => labelResolver(left).localeCompare(labelResolver(right)))
    .map((value) => ({ value, label: labelResolver(value) }))
}

function optionLabel(options: SelectOption[], value: string) {
  if (!value) return ''
  return options.find((option) => option.value === value)?.label ?? value
}

function fallback(value: unknown) {
  const normalizedValue = String(value ?? '').trim()
  return normalizedValue || '-'
}

function dateKey(value: string | null | undefined) {
  const formatted = formatDateDisplay(value)
  return /^\d{4}-\d{2}-\d{2}$/.test(formatted) ? formatted : ''
}

function candidateName(candidate: CandidateForm) {
  const detail = candidateDetail(candidate)
  return fallback(
    detail.full_name ||
    [detail.first_name, detail.middle_name, detail.last_name].filter(Boolean).join(' '),
  )
}

function candidateStatusLabel(status: string | null | undefined) {
  return resolveCandidateStatusLabel(text, status)
}

function candidateRoleLabel(candidate: CandidateForm) {
  return resolveCandidateRoleLabel(candidate)
}

function candidateRoleBadge(candidate: CandidateForm) {
  return resolveCandidateRoleBadge(candidate)
}

function candidateSourceLabel(source: string | null | undefined) {
  return source === 'candidate_service'
    ? text('recruitmentCandidates.source.candidateService')
    : text('recruitmentCandidates.source.local')
}

function latestEducation(candidate: CandidateForm) {
  const education = [...(candidateDetail(candidate).education ?? [])]
    .sort((left, right) => (right.to_year ?? 0) - (left.to_year ?? 0))[0]

  if (!education) return '-'
  return [education.level, education.institution, education.major].filter(Boolean).join(' - ') || '-'
}

function latestWork(candidate: CandidateForm) {
  const work = [...(candidateDetail(candidate).work_history ?? [])]
    .sort((left, right) => (right.to_year ?? 0) - (left.to_year ?? 0))[0]

  if (!work) return '-'
  return [work.position, work.company].filter(Boolean).join(' - ') || '-'
}

function rowNumber(index: number) {
  return (page.value - 1) * pageSize + index + 1
}

function toggleSort(key: CandidateDatabaseSortKey) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = key
  sortDirection.value = ['application_date', 'available_start_date'].includes(key) ? 'desc' : 'asc'
}

function sortIndicator(key: CandidateDatabaseSortKey) {
  if (sortKey.value !== key) return '↑↓'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

function resetFilters() {
  searchQuery.value = ''
  statusFilter.value = ''
  roleFilter.value = ''
  erfFilter.value = ''
  departmentFilter.value = ''
  applicationStart.value = ''
  applicationEnd.value = ''
}

function readPersistedExportJobIds() {
  if (typeof window === 'undefined') {
    return [] as string[]
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(candidateFormExportJobStorageKey) ?? '[]')
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : []
  } catch {
    return []
  }
}

function writePersistedExportJobIds(jobIds: string[]) {
  if (typeof window === 'undefined') {
    return
  }

  if (jobIds.length === 0) {
    window.localStorage.removeItem(candidateFormExportJobStorageKey)
    return
  }

  window.localStorage.setItem(candidateFormExportJobStorageKey, JSON.stringify(jobIds))
}

function persistExportJob(jobId: string) {
  const nextJobIds = new Set(readPersistedExportJobIds())
  nextJobIds.add(jobId)
  writePersistedExportJobIds(Array.from(nextJobIds))
}

function forgetPersistedExportJob(jobId: string) {
  const nextJobIds = readPersistedExportJobIds().filter((item) => item !== jobId)
  writePersistedExportJobIds(nextJobIds)
}

function clearFilter(key: FilterKey) {
  const filterMap: Record<FilterKey, () => void> = {
    search: () => {
      searchQuery.value = ''
    },
    status: () => {
      statusFilter.value = ''
    },
    role: () => {
      roleFilter.value = ''
    },
    erf: () => {
      erfFilter.value = ''
    },
    department: () => {
      departmentFilter.value = ''
    },
    applicationStart: () => {
      applicationStart.value = ''
    },
    applicationEnd: () => {
      applicationEnd.value = ''
    },
  }

  filterMap[key]()
}

async function handleBulkExportExcel() {
  if (!canExportCandidateFormExcel.value) {
    appToast.error(text('candidateForms.list.toasts.exportPermissionDenied'))
    return
  }

  bulkExportLoading.value = true
  try {
    await enqueueExcelExportJob(filteredCandidates.value.map((candidate) => candidate.id))
  } catch (err) {
    const message = err instanceof Error ? err.message : text('candidateForms.list.errors.exportExcelFailed')
    appToast.error(message)
  } finally {
    bulkExportLoading.value = false
  }
}

function scheduleExportJobPoll(jobId: string) {
  const timerId = window.setTimeout(() => {
    void pollExportJob(jobId)
  }, 1500)

  activeExportPollTimers.set(jobId, timerId)
}

function clearExportJobPoll(jobId: string) {
  const timerId = activeExportPollTimers.get(jobId)
  if (timerId) {
    window.clearTimeout(timerId)
  }
  activeExportPollTimers.delete(jobId)
  forgetPersistedExportJob(jobId)
}

function resolveDownloadFilename(contentDisposition: string | null, fallbackFilename: string | null) {
  const match = contentDisposition?.match(/filename="([^"]+)"/i)
  return match?.[1]?.trim() || fallbackFilename || 'candidate-forms-export.xlsx'
}

async function triggerExportJobDownload(jobId: string, fallbackFilename: string | null) {
  const response = await fetchBackendApi(
    `/api/candidate-forms/export-jobs/${encodeURIComponent(jobId)}/download`,
  )
  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = resolveDownloadFilename(response.headers.get('Content-Disposition'), fallbackFilename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(downloadUrl)
}

async function pollExportJob(jobId: string) {
  try {
    const response = await callBackendApi<{
      export_job: ExportJob
    }>(`/api/candidate-forms/export-jobs/${encodeURIComponent(jobId)}`)
    const job = response.export_job

    if (job.status === 'queued' || job.status === 'processing') {
      scheduleExportJobPoll(jobId)
      return
    }

    clearExportJobPoll(jobId)

    if (job.status === 'failed') {
      appToast.error(job.error || text('candidateForms.list.errors.exportExcelFailed'))
      return
    }

    await triggerExportJobDownload(jobId, job.filename)
    appToast.success(text('candidateForms.list.toasts.exportedExcel'))
  } catch (err) {
    clearExportJobPoll(jobId)
    const message = err instanceof Error ? err.message : text('candidateForms.list.errors.exportExcelFailed')
    appToast.error(message)
  }
}

async function enqueueExcelExportJob(candidateFormIds: string[]) {
  const normalizedCandidateFormIds = Array.from(new Set(candidateFormIds.filter(Boolean)))

  if (!normalizedCandidateFormIds.length) {
    throw new Error(text('candidateForms.list.errors.exportExcelFailed'))
  }

  const response = await callBackendApi<{
    export_job: ExportJob
  }>('/api/candidate-forms/export-jobs', {
    method: 'POST',
    body: JSON.stringify({
      candidate_form_ids: normalizedCandidateFormIds,
    }),
  })

  appToast.success(text('candidateForms.list.toasts.exportQueued'))
  persistExportJob(response.export_job.id)
  scheduleExportJobPoll(response.export_job.id)
}

function goToCandidateDetail(id: string) {
  void router.push(`/candidate-forms/${id}`)
}

function candidateDetail(candidate: CandidateForm) {
  return candidateDetailById.value[candidate.id] ?? candidate
}

async function hydratePagedCandidateDetails() {
  const ids = pagedCandidates.value
    .map((candidate) => candidate.id)
    .filter((id) => !candidateDetailById.value[id] && !pendingDetailIds.has(id))

  if (ids.length === 0) return

  ids.forEach((id) => pendingDetailIds.add(id))

  try {
    const details: Array<CandidateForm | null> = await Promise.all(
      ids.map(async (id) => {
        try {
          return await getById(id)
        } catch (err) {
          console.error('Failed to load recruitment candidate detail:', err)
          return null
        }
      }),
    )

    candidateDetailById.value = {
      ...candidateDetailById.value,
      ...Object.fromEntries(
        details
          .filter((candidate): candidate is CandidateForm => Boolean(candidate))
          .map((candidate) => [candidate.id, candidate]),
      ),
    }
  } finally {
    ids.forEach((id) => pendingDetailIds.delete(id))
  }
}
</script>
