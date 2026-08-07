# Graph Report - .  (2026-08-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 3006 nodes · 6209 edges · 232 communities (174 shown, 58 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 159 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f09f6a1f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Community 185
- Community 186
- Community 187
- Community 188
- Community 189
- Community 190
- Community 191
- Community 192
- Community 193
- Community 194
- Community 195
- Community 196
- Community 197
- Community 198
- Community 199
- Community 200
- Community 231

## God Nodes (most connected - your core abstractions)
1. `Candidate` - 197 edges
2. `Controller` - 99 edges
3. `Payment` - 87 edges
4. `User` - 81 edges
5. `ExamAttempt` - 73 edges
6. `StatusPendaftaranService` - 57 edges
7. `AdmissionWave` - 50 edges
8. `CandidateStatusService` - 49 edges
9. `ExamSession` - 45 edges
10. `ExamPackage` - 42 edges

## Surprising Connections (you probably didn't know these)
- `registrationDraft()` --calls--> `RegistrationDraft`  [INFERRED]
  tests/Feature/RegistrationDraftSecurityTest.php → app/Models/RegistrationDraft.php
- `verificationCandidate()` --calls--> `AdmissionWave`  [INFERRED]
  tests/Feature/CandidateVerificationChecklistTest.php → app/Models/AdmissionWave.php
- `examSecurityCandidate()` --calls--> `CandidateDocument`  [INFERRED]
  tests/Feature/OnlineSelectionExamSecurityTest.php → app/Models/CandidateDocument.php
- `gateSubmitCandidate()` --calls--> `Guardian`  [INFERRED]
  tests/Feature/CandidateFeatureGateTest.php → app/Models/Guardian.php
- `verificationCandidate()` --calls--> `Guardian`  [INFERRED]
  tests/Feature/CandidateVerificationChecklistTest.php → app/Models/Guardian.php

## Import Cycles
- None detected.

## Communities (232 total, 58 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (11): PackageController, Request, QuestionImportController, StoreExamPackageRequest, ExamQuestionWorkbookReader, ExamPackage, ExamPackageTemplateService, ExamQuestionImportService (+3 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (50): BackLink(), EmptyState(), FlashMessage(), inputClass, Metric(), PageHeader(), StatusPill(), AttemptSummary (+42 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (36): CandidateStatusSummaryCard(), Props, CompletionChecklist(), Props, LifecycleStepper(), Props, STEP_CLASS, NextActionPanel() (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (13): AuthenticatedSessionController, NewPasswordController, PasswordResetLinkController, Controller, CandidateController, StaffController, GuardianController, PaymentHistoryController (+5 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (7): ExamAuditLog, ExamImportBatch, Illuminate\Database\Eloquent\Model, Illuminate\Database\Eloquent\Relations\BelongsTo, Illuminate\Database\Eloquent\Relations\HasMany, Illuminate\Database\Eloquent\Relations\HasOne, Illuminate\Database\Eloquent\SoftDeletes

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (35): AgendaFormModal(), Props, CalendarHeader(), Props, CalendarPanel(), Props, CalendarSidebar(), Props (+27 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (39): actionChartLabels, ActionLoadPanel(), AttentionPanel(), BucketStat, ChartTooltip(), ChartTooltipProps, dominantPoint(), DonutChartPanel() (+31 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (8): SaveExamAnswer, StartExamAttempt, SubmitExamAttempt, PublicExamController, ExamAttempt, ExamAttemptAnswer, ExamAttemptService, Illuminate\Http\JsonResponse

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (10): RegisterController, ProfileController, RedirectResponse, ProfileController, SecureFileController, ProfileController, HandleInertiaRequests, PasswordResetLinkController (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (6): PublicSessionController, SessionController, StoreExamSessionRequest, ExamSession, ExamAuditLogger, ExamSessionService

### Community 10 - "Community 10"
Cohesion: 0.07
Nodes (13): User, CandidateGateService, Illuminate\Contracts\Auth\MustVerifyEmail, Illuminate\Foundation\Auth\User, Illuminate\Notifications\Notifiable, gateCandidate(), gateDocument(), gatePayment() (+5 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (37): AddressDetail, Props, TabAlamat(), DataChangeRequest, FIELD_LABELS, Props, RELIGION_OPTIONS, TabIdentitas() (+29 more)

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (32): EmptyState(), Props, Action, GoldPageHeader(), Props, GoldStatCard(), Props, PILL_CLASS (+24 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (34): MaskedData, ResumeModal(), ResumeModalProps, clearWizardStorage(), KEYS, readWizardStorage(), saveDraftId(), saveLastStep() (+26 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (34): AddressForm(), inputCls(), Props, inputCls(), PersonForm(), PersonPrefix, PersonPrefix2, Props (+26 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (9): Candidate, CandidateObserver, CandidateVerificationEvaluator, CandidateVerificationChecklist, paidTransferPayment(), verificationCandidate(), verificationDocument(), verificationStaff() (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (7): EmailVerificationController, IndexController, WaveController, ChangeRequestController, EmailVerificationController, Illuminate\Foundation\Auth\EmailVerificationRequest, Illuminate\Http\RedirectResponse

### Community 18 - "Community 18"
Cohesion: 0.06
Nodes (33): animejs, canvas-confetti, date-fns, flatpickr, @fullcalendar/daygrid, @fullcalendar/interaction, @fullcalendar/list, @fullcalendar/react (+25 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (3): DocumentController, CandidateDocument, SecureFileAccessService

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (18): EmptyField, FormState, Props, TabId, TabRangkuman(), EmptyField, FormState, HealthDocuments (+10 more)

### Community 21 - "Community 21"
Cohesion: 0.09
Nodes (25): OperationalQueue, OperationalQueuePanel(), Props, QueueItem, QueueStat, toneClass, DataCardProps, DataRequestCard() (+17 more)

### Community 22 - "Community 22"
Cohesion: 0.11
Nodes (3): SystemSettingsController, Extracurricular, PaymentConfig

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (22): formatAlamat(), formatTTL(), TabRangkuman(), EDUCATION_LABELS, EducationLevel, HOUSE_LABELS, HouseOwnership, INCOME_LABELS (+14 more)

### Community 24 - "Community 24"
Cohesion: 0.10
Nodes (20): DocumentCard(), mimeFromFilename(), Props, REQUIRED_CONFIG, RequiredLevel, STATUS_CONFIG, swalDark, TabAdministrasi (+12 more)

### Community 25 - "Community 25"
Cohesion: 0.07
Nodes (16): blankExtra, blankPayment, blankProgram, currency(), ExtracurricularRow, ExtraForm, PaymentConfigRow, PaymentForm (+8 more)

### Community 27 - "Community 27"
Cohesion: 0.14
Nodes (3): CandidateCompletionEvaluator, CandidateEvaluationResult, CandidateRequirement

### Community 28 - "Community 28"
Cohesion: 0.10
Nodes (22): AnimatedTextProps, CinematicShowcase(), externalMediaUrl(), FullSizePopupProps, img(), LightboxProps, MASTER_DATA, PLACEHOLDER_VIDEO_URLS (+14 more)

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (7): ExamQuestion, ExamScoringService, examSecurityAssignment(), examSecurityAttempt(), examSecurityPackage(), examSecurityQuestion(), examSecuritySession()

### Community 30 - "Community 30"
Cohesion: 0.12
Nodes (11): Guardian, GuardianObserver, CandidateSeeder, candidatePanelCandidate(), candidatePanelUser(), candidatePanelWave(), statusCenterCandidate(), statusCenterCompleteCore() (+3 more)

### Community 31 - "Community 31"
Cohesion: 0.07
Nodes (27): eslint, eslint-plugin-prettier, eslint-plugin-react, eslint-plugin-react-hooks, @inertiajs/react, devDependencies, eslint, eslint-plugin-prettier (+19 more)

### Community 32 - "Community 32"
Cohesion: 0.10
Nodes (23): buildQuery(), CandidateInspector(), CandidateStatus(), CandidateStatusList(), CandidateStatusRow, dotClass, Filters, LifecycleStep (+15 more)

### Community 33 - "Community 33"
Cohesion: 0.10
Nodes (21): buildQuery(), CHANNEL_OPTIONS, Filters, hasMismatch(), ManualStatus, Option, Paginated, PaginationLink (+13 more)

### Community 34 - "Community 34"
Cohesion: 0.14
Nodes (17): buildCandidateListQuery(), CandidateFilters(), FilterOption, Filters, Props, SELECT_CLASS, STATUS_OPTIONS, Wave (+9 more)

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (20): EmptyState(), InfoField(), InfoFieldProps, Pill(), SectionTitle(), SectionTitleProps, toneClass, HealthDocument (+12 more)

### Community 36 - "Community 36"
Cohesion: 0.13
Nodes (20): CandidateOperational, CandidateRow, Props, TABLE_HEADERS, ActionNeeded, ActionNeededBadge(), LifecycleBadge(), MiniMeter() (+12 more)

### Community 37 - "Community 37"
Cohesion: 0.12
Nodes (7): IndexController, SubjectController, AssignExamCandidatesRequest, ImportExamQuestionsRequest, StoreExamSubjectRequest, ExamSubject, Illuminate\Foundation\Http\FormRequest

### Community 39 - "Community 39"
Cohesion: 0.11
Nodes (4): HealthRecord, HealthRecordObserver, examSecurityCandidate(), examSecurityWave()

### Community 40 - "Community 40"
Cohesion: 0.09
Nodes (20): AdmissionWave, Program, Props, TabProgram(), AddressDetail, AdmissionWave, CandidateData, DataChangeRequest (+12 more)

### Community 41 - "Community 41"
Cohesion: 0.11
Nodes (19): TabTimKesehatan(), CandidateSidebar(), CandidateSnippet, DEFAULT_TIPS, pctColorDark(), pctColorLight(), progressBarCls(), Props (+11 more)

### Community 42 - "Community 42"
Cohesion: 0.11
Nodes (16): Props, RecentSubmission, RecentSubmissionsList(), buildCards(), Props, StatCard, Stats, StatsGrid() (+8 more)

### Community 43 - "Community 43"
Cohesion: 0.12
Nodes (3): DataDiriController, IndexController, CandidateRequestPresenter

### Community 44 - "Community 44"
Cohesion: 0.15
Nodes (4): DocumentSecurityService, Illuminate\Http\UploadedFile, gatePdfUpload(), UploadedFile

### Community 45 - "Community 45"
Cohesion: 0.16
Nodes (3): StaffPaymentOperationalService, Illuminate\Contracts\Pagination\LengthAwarePaginator, Illuminate\Database\Eloquent\Builder

### Community 46 - "Community 46"
Cohesion: 0.10
Nodes (20): env, browser, node, extends, parser, parserOptions, ecmaVersion, sourceType (+12 more)

### Community 47 - "Community 47"
Cohesion: 0.10
Nodes (20): resources/js/**/*.d.ts, resources/js/**/*.ts, resources/js/**/*.tsx, resources/js/types/global.d.ts, ./vendor/tightenco/ziggy, compilerOptions, allowJs, esModuleInterop (+12 more)

### Community 48 - "Community 48"
Cohesion: 0.12
Nodes (14): BackLink(), cardClass, ExamWorkspaceActive, PageHeader(), StatCard(), subtleCardClass, WorkflowRail(), Batch (+6 more)

### Community 49 - "Community 49"
Cohesion: 0.15
Nodes (16): EmptyState(), labelClass, StatusPill(), Assignment, Props, SessionAssignedTable, AssignmentForm, CandidateRow (+8 more)

### Community 50 - "Community 50"
Cohesion: 0.20
Nodes (16): Backdrop(), SidebarContext, SidebarContextType, SidebarProvider(), useSidebar(), ThemeProvider(), buildHtml(), formatTime() (+8 more)

### Community 51 - "Community 51"
Cohesion: 0.10
Nodes (15): Props, StaffSidebar(), StaffSidebarCandidate, statusClass, UserMini, StaffGuardian, TabWali(), CANDIDATE_STATUS_CLASS (+7 more)

### Community 52 - "Community 52"
Cohesion: 0.15
Nodes (17): ResizableCard(), ResizableCardProps, buildCalendarDays(), CalendarDay, formatDateValue(), getGreeting(), isSameDay(), monthNames (+9 more)

### Community 53 - "Community 53"
Cohesion: 0.13
Nodes (12): facilities, FacilitiesSection(), HighlightSection(), HowToRegisterSection(), steps, ProfileSection(), ProfileSectionProps, VideoModal() (+4 more)

### Community 54 - "Community 54"
Cohesion: 0.14
Nodes (5): self, static, self, RegistrationDraft, mailRegistrationDraft()

### Community 55 - "Community 55"
Cohesion: 0.18
Nodes (17): activeRuleMatches(), controlIdFor(), FlyoutState, itemKeyFor(), ParsedNavUrl, parseNavUrl(), pathMatches(), Props (+9 more)

### Community 57 - "Community 57"
Cohesion: 0.16
Nodes (4): StatusPendaftaranController, StatusPendaftaranController, CandidateStatusResult, CandidateStatusService

### Community 60 - "Community 60"
Cohesion: 0.12
Nodes (9): BSIBankCard(), CandidateInfo, Config, formatRupiah(), ManualCheckout(), Payment, ProofStatusBannerProps, Props (+1 more)

### Community 61 - "Community 61"
Cohesion: 0.14
Nodes (16): CHANNEL_LABEL, ConfigData, countdownBarCls(), countdownColorDark(), countdownColorLight(), CountdownSection(), formatRupiah(), formatWaveLabel() (+8 more)

### Community 62 - "Community 62"
Cohesion: 0.12
Nodes (10): DashboardSplitLayout(), AttemptRow, ExamMonitoring(), formatTime(), MonitoringSnapshot, Props, SessionRow, Props (+2 more)

### Community 63 - "Community 63"
Cohesion: 0.18
Nodes (11): dangerButtonClass, primaryButtonClass, PackageOption, Props, SessionForm, SessionFormCard, SessionRow, WaveOption (+3 more)

### Community 64 - "Community 64"
Cohesion: 0.18
Nodes (12): inputCls(), Props, TabProfilKeluarga(), HOUSE_OPTIONS, MARITAL_OPTIONS, VEHICLE_OPTIONS, Props, SubmissionTrendChart() (+4 more)

### Community 65 - "Community 65"
Cohesion: 0.15
Nodes (13): calcFee(), CardProps, ChannelSelection(), Config, formatDisplayName(), formatRupiah(), PaymentData, PROGRESS_STEPS (+5 more)

### Community 66 - "Community 66"
Cohesion: 0.12
Nodes (13): DraftGate(), Props, STEPS, CandidateData, CHECKOUT_NARASI, ConfigData, PageState, PaymentData (+5 more)

### Community 67 - "Community 67"
Cohesion: 0.26
Nodes (4): CalendarController, Carbon, CandidateCalendarEvent, Carbon\Carbon

### Community 69 - "Community 69"
Cohesion: 0.17
Nodes (4): AppServiceProvider, EmailDesignSystem, Illuminate\Notifications\Messages\MailMessage, Illuminate\Support\ServiceProvider

### Community 70 - "Community 70"
Cohesion: 0.14
Nodes (13): CandidateDashboardData, BannerAction, Props, RequestStatusBanner(), Tone, TONE_STYLES, Candidate, CandidateDashboard() (+5 more)

### Community 71 - "Community 71"
Cohesion: 0.18
Nodes (12): HeroSectionProps, ScheduleModal(), ScheduleModalProps, buildTickerItems(), FALLBACK_TICKER_ITEMS, SOCIAL_LINKS, SocialLink, TopBar() (+4 more)

### Community 72 - "Community 72"
Cohesion: 0.16
Nodes (10): AdminWaves(), blankForm, fromWave(), listToText(), Props, rupiah(), swalDark, textToList() (+2 more)

### Community 73 - "Community 73"
Cohesion: 0.20
Nodes (4): AdmissionWave, AdmissionWaveSeeder, staffCandidateV2Candidate(), staffCandidateV2Wave()

### Community 74 - "Community 74"
Cohesion: 0.39
Nodes (4): RoleMiddleware, RoleMiddleware, Closure, Symfony\Component\HttpFoundation\Response

### Community 75 - "Community 75"
Cohesion: 0.21
Nodes (3): MonitoringController, ExamMonitoringService, Illuminate\Support\Carbon

### Community 76 - "Community 76"
Cohesion: 0.18
Nodes (3): ResultController, ResultController, ExamResultPresenter

### Community 77 - "Community 77"
Cohesion: 0.18
Nodes (12): CandidateInfo, Config, formatDateTime(), formatExpiredLabel(), formatRupiah(), GatewayCheckout(), Payment, PAYMENT_METHODS (+4 more)

### Community 78 - "Community 78"
Cohesion: 0.19
Nodes (5): DatabaseSeeder, ExtracurricularSeeder, PaymentConfigSeeder, UserSeeder, Illuminate\Database\Seeder

### Community 80 - "Community 80"
Cohesion: 0.14
Nodes (13): autoload-dev, psr-4, description, extra, laravel, dont-discover, license, minimum-stability (+5 more)

### Community 81 - "Community 81"
Cohesion: 0.14
Nodes (14): scripts, dev, post-autoload-dump, post-update-cmd, pre-package-uninstall, test, Composer\\Config::disableProcessTimeout, Illuminate\\Foundation\\ComposerScripts::postAutoloadDump (+6 more)

### Community 82 - "Community 82"
Cohesion: 0.23
Nodes (12): FlashMessage(), ExamPackageShow(), formatToLocalDateTime(), Props, PublicAttemptItem, PublicSessionItem, PublicSessions(), PublicTokenItem (+4 more)

### Community 83 - "Community 83"
Cohesion: 0.23
Nodes (9): secondaryButtonClass, PackageForm, PackageFormCard, PackageRow, Props, SubjectOption, PackageListCard, Props (+1 more)

### Community 84 - "Community 84"
Cohesion: 0.18
Nodes (9): AvatarSection(), Props, Errors, ProfileEditForm(), Props, Props, StaffProfile(), swalDark (+1 more)

### Community 89 - "Community 89"
Cohesion: 0.19
Nodes (10): DocumentPaymentSummary(), Props, ProgressOverview(), ProgressRing, Props, DashboardProgress, DocumentsSummary, PaymentSummary (+2 more)

### Community 90 - "Community 90"
Cohesion: 0.18
Nodes (8): Props, Props, ActionTone, DashboardIdentity, NextAction, SectionState, stateClasses, toneClasses

### Community 93 - "Community 93"
Cohesion: 0.17
Nodes (12): post-create-project-cmd, post-root-package-install, setup, composer install, npm install, npm run build, @php artisan key:generate, @php artisan key:generate --ansi (+4 more)

### Community 94 - "Community 94"
Cohesion: 0.21
Nodes (9): inputClass, Props, QuestionBankTable, ImportForm, Props, ExamImportPreview, ExamPackageDetail, ExamQuestionPreview (+1 more)

### Community 95 - "Community 95"
Cohesion: 0.20
Nodes (9): ResizableSplitGrid(), ResizableSplitGridProps, ExportGroup, ExportState, groupIcon, groupTone, Props, ReportsExportSettings() (+1 more)

### Community 96 - "Community 96"
Cohesion: 0.17
Nodes (8): AdmissionWave, DataChangeRequest, FIELD_LABELS, Program, StaffCandidateData, TabDataDiri(), TabId, TABS

### Community 97 - "Community 97"
Cohesion: 0.24
Nodes (8): emptyForm, Props, Subject, SubjectForm, SubjectFormCard, Props, SubjectTable, Props

### Community 98 - "Community 98"
Cohesion: 0.24
Nodes (7): IdleCapableWindow, PublicWaveChannel, PublicWaveEcho, WaveCard(), WaveCardProps, Window, formatRupiah()

### Community 99 - "Community 99"
Cohesion: 0.21
Nodes (9): CandidateData, DataChangeRequestResult, EmailChangeRequest, ProfilePage(), Props, reviewedByLabel(), statusBadge(), statusLabel() (+1 more)

### Community 100 - "Community 100"
Cohesion: 0.18
Nodes (10): AttemptRow, CandidateSummary, decodePaginationLabel(), Filters, Paginated, PaginationLink, Props, SessionOption (+2 more)

### Community 102 - "Community 102"
Cohesion: 0.18
Nodes (11): require, ext-zip, guzzlehttp/guzzle, inertiajs/inertia-laravel, laravel/framework, laravel/sanctum, laravel/tinker, midtrans/midtrans-php (+3 more)

### Community 103 - "Community 103"
Cohesion: 0.20
Nodes (8): TrustCard, trustCards, TrustCooperationSection(), TrustCooperationSectionProps, EcosystemItem, ecosystemItems, ribbonItems, TrustEcosystemRibbon()

### Community 104 - "Community 104"
Cohesion: 0.20
Nodes (10): AttemptRow, CandidateSummary, decodePaginationLabel(), ExamResults(), Filters, Paginated, PaginationLink, Props (+2 more)

### Community 107 - "Community 107"
Cohesion: 0.20
Nodes (10): require-dev, fakerphp/faker, laravel/breeze, laravel/pail, laravel/pint, laravel/sail, mockery/mockery, nunomaduro/collision (+2 more)

### Community 108 - "Community 108"
Cohesion: 0.22
Nodes (8): ExamWorkspace(), textLinkClass, cards(), ExamAdminIndex(), ImportRow, Props, SessionRow, Stats

### Community 109 - "Community 109"
Cohesion: 0.29
Nodes (9): CONFETTI_COLORS, formatDate(), formatRupiah(), getChannelLabel(), launchConfetti(), PaidPayment, Particle, PaymentSuccess() (+1 more)

### Community 110 - "Community 110"
Cohesion: 0.27
Nodes (6): Props, PublicGuestIdentityForm, SessionPayload, Props, PublicTokenLoginForm, Props

### Community 111 - "Community 111"
Cohesion: 0.24
Nodes (7): Footer(), FooterProps, NAV_LINKS, Navbar(), NavbarProps, NavState, WelcomeProps

### Community 112 - "Community 112"
Cohesion: 0.33
Nodes (8): createTempUrl(), fetchMimeType(), FilePreviewModal(), IMAGE_TYPES, isImage(), isPdf(), mimeFromUrl(), Props

### Community 113 - "Community 113"
Cohesion: 0.24
Nodes (6): AttemptRow, formatTime(), MonitoringDisplay(), MonitoringSnapshot, Props, requestFullscreen()

### Community 114 - "Community 114"
Cohesion: 0.22
Nodes (9): ActiveWave, AdminIndex(), Props, RecentCandidate, StaffMember, statCards(), Stats, statusConfig (+1 more)

### Community 115 - "Community 115"
Cohesion: 0.33
Nodes (9): statusFlowCandidate(), statusFlowCompleteSubmittedCandidate(), statusFlowDocument(), statusFlowGuardian(), statusFlowHealth(), statusFlowPaidPayment(), statusFlowUser(), statusFlowVerifiedRequiredDocuments() (+1 more)

### Community 119 - "Community 119"
Cohesion: 0.22
Nodes (8): private, $schema, scripts, build, dev, dev-mode, lint, type

### Community 120 - "Community 120"
Cohesion: 0.28
Nodes (6): Props, stepClasses, AdmissionWave, ProgressSection, StatusSummary, TimelineStep

### Community 121 - "Community 121"
Cohesion: 0.22
Nodes (4): AnswerReview, AttemptDetail, CandidateSummary, Props

### Community 122 - "Community 122"
Cohesion: 0.39
Nodes (5): WaveUpdated, Illuminate\Broadcasting\InteractsWithSockets, Illuminate\Contracts\Broadcasting\ShouldBroadcastNow, Illuminate\Foundation\Events\Dispatchable, Illuminate\Queue\SerializesModels

### Community 123 - "Community 123"
Cohesion: 0.39
Nodes (3): static, UserFactory, Illuminate\Database\Eloquent\Factories\Factory

### Community 124 - "Community 124"
Cohesion: 0.29
Nodes (7): DOC_STATUS_CLASS, DOC_STATUS_LABEL, DOC_TABS, DocTabId, DocumentItem, Props, TabDokumen()

### Community 125 - "Community 125"
Cohesion: 0.36
Nodes (7): HERO_WORDS, HeroSection(), ScheduleModal, TypingPhase, usePrefersReducedMotion(), useTypingWords(), useViewportMatch()

### Community 126 - "Community 126"
Cohesion: 0.29
Nodes (7): pestphp/pest-plugin, php-http/discovery, config, allow-plugins, optimize-autoloader, preferred-install, sort-packages

### Community 127 - "Community 127"
Cohesion: 0.40
Nodes (5): desktopHeightClass, desktopSpanClass, GallerySection(), loadAnime(), photos

### Community 129 - "Community 129"
Cohesion: 0.40
Nodes (5): autoload, psr-4, App\\, Database\\Factories\\, Database\\Seeders\\

### Community 130 - "Community 130"
Cohesion: 0.80
Nodes (4): alterIncomeEnums(), down(), supportsEnumAlter(), up()

### Community 133 - "Community 133"
Cohesion: 0.50
Nodes (4): getSamePageAnchorTarget(), IdleCapableWindow, useLandingLenis(), Welcome()

### Community 134 - "Community 134"
Cohesion: 0.40
Nodes (4): AppConfig, FlashMessages, PageProps, User

### Community 135 - "Community 135"
Cohesion: 0.21
Nodes (4): PruneExpiredDrafts, ValidateDraftToken, Illuminate\Console\Command, registrationDraft()

### Community 137 - "Community 137"
Cohesion: 0.50
Nodes (3): @inertiajs/core, PageProps, Window

### Community 143 - "Community 143"
Cohesion: 0.67
Nodes (3): keywords, framework, laravel

### Community 197 - "Community 197"
Cohesion: 0.12
Nodes (3): ExamAccessException, ExamSessionToken, RuntimeException

## Knowledge Gaps
- **697 isolated node(s):** `browser`, `node`, `eslint:recommended`, `plugin:@typescript-eslint/recommended`, `plugin:react/recommended` (+692 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **58 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Candidate` connect `Community 16` to `Community 3`, `Community 4`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 13`, `Community 17`, `Community 19`, `Community 26`, `Community 27`, `Community 29`, `Community 30`, `Community 38`, `Community 39`, `Community 43`, `Community 44`, `Community 45`, `Community 54`, `Community 56`, `Community 57`, `Community 58`, `Community 59`, `Community 68`, `Community 69`, `Community 197`, `Community 73`, `Community 79`, `Community 87`, `Community 88`, `Community 101`, `Community 105`, `Community 106`, `Community 115`, `Community 116`, `Community 118`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `vite` connect `Community 198` to `Community 69`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 31` to `Community 192`, `Community 193`, `Community 194`, `Community 195`, `Community 196`, `Community 198`, `Community 231`, `Community 199`, `Community 182`, `Community 119`, `Community 184`, `Community 185`, `Community 186`, `Community 187`, `Community 188`, `Community 189`, `Community 190`, `Community 191`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `Candidate` (e.g. with `.store()` and `.index()`) actually correct?**
  _`Candidate` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `browser`, `node`, `eslint:recommended` to the rest of the system?**
  _697 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.053998632946001365 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.056265984654731455 - nodes in this community are weakly interconnected._