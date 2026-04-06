# Livi — Deep Discussion & Pre-Build Audit Skill
> Load this file BEFORE starting any new feature or backend work.
> Purpose: audit what already exists → discuss & conclude → produce a blueprint ready to execute.

---

## When to Load This Skill

```
✅ Before building any new feature (backend or frontend)
✅ Before writing any new controller, model, migration, or component
✅ When Silvia says "kita mau buat fitur X" or "next kita tackle Y"
✅ When the scope of work is unclear or touches multiple system parts
✅ After a long break from the project — re-orient before doing anything

❌ Not needed for: small bug fixes, typo corrections, config tweaks
```

---

## Phase 1 — Audit What Already Exists

Before proposing anything new, Livi must understand the current state.
**Never assume. Always ask for the actual files.**

### 1A. Codebase Audit Checklist
```
Ask Silvia to share (or confirm from context):
  [ ] Relevant migration files → actual column names, types, constraints
  [ ] Relevant model files → fillable, relations, observers, scopes
  [ ] Relevant controller files → what's already handled, what's missing
  [ ] Relevant route definitions → existing routes, middleware applied
  [ ] Relevant frontend pages/components → what's already built
  [ ] Current branch → confirm we're working in the right place
```

### 1B. Questions Livi Must Answer Before Moving On
```
1. What tables/columns exist that are relevant to this feature?
2. What relations are already defined (hasOne, hasMany, belongsTo)?
3. What observers are watching these models? What do they trigger?
4. What routes already exist for this domain?
5. What frontend components already consume this data?
6. Is there any existing partial implementation we'd be building on top of?
7. Are there any known bugs or pending fixes in this area?
   → Check 02_status.md Pending section first
```

### 1C. Dependency Map
```
Before touching anything, map out:

  [This feature] depends on:
    → Table/model X (exists? ✅/❌)
    → Observer Y (exists? triggers what?)
    → Route Z (exists? middleware?)
    → Component A (exists? what props does it expect?)

  [This feature] will be depended on by:
    → Future feature P
    → Existing page Q

Rule: if a dependency is missing or broken → fix it first, don't build on top of it.
```

---

## Phase 2 — Discussion & Analysis

Once the audit is complete, Livi synthesizes findings and opens discussion.

### 2A. Livi's Synthesis Format
```
After audit, Livi presents:

  WHAT EXISTS:
  - [list what's already built and relevant]

  WHAT'S MISSING:
  - [list gaps, missing pieces, incomplete implementations]

  RISKS & CONFLICTS:
  - [anything that could break if we proceed naively]
  - [schema conflicts, observer side effects, route ordering issues]

  OPEN QUESTIONS FOR SILVIA:
  - [max 2 questions — the most critical ones only]
```

### 2B. Flow Mapping
```
For every feature, map the complete data flow:

  User action
    → Frontend component (which one?)
    → Inertia/Axios request (route? method? payload?)
    → Controller (which method? what validation?)
    → Model/Observer (what side effects?)
    → Database (which tables? what changes?)
    → Response (Inertia redirect? JSON? back()?)
    → Frontend update (props refresh? toast? redirect?)

If any step in this chain is unclear → stop and clarify before blueprinting.
```

### 2C. Edge Cases to Always Consider
```
Authentication & Authorization:
  → Is the user authenticated? Which role?
  → Can this user access this candidate's data? (IDOR check)
  → What happens if they try to access someone else's data?

Data Integrity:
  → What if the related record doesn't exist yet?
  → What if the user submits twice (double submit)?
  → What if a required relation is null?

Observer Side Effects:
  → Does saving this model trigger an observer?
  → Could the observer cause a loop? (use updateQuietly?)
  → Does the observer's checkAndSubmit() get triggered unintentionally?

File Uploads (if applicable):
  → All 4 security layers accounted for?
  → Private storage path correct?
  → Serve route exists with auth middleware?

Mobile & UX:
  → What does the loading state look like?
  → What does the empty state look like?
  → What happens on save failure — does the user know?
```

---

## Phase 3 — Blueprint

Only after Phase 1 and Phase 2 are complete does Livi produce a blueprint.
**No code yet — just structure.**

### 3A. Blueprint Template
```
FEATURE: [Feature name]
BRANCH:  [Confirm with Silvia]

DATABASE:
  → New migration needed? [Yes/No]
  → Tables affected: [list]
  → New columns: [name | type | nullable? | default]
  → New relations: [model → model via what]

BACKEND:
  → New controller method(s): [ControllerName@method]
  → New routes: [METHOD /path → controller@method | middleware]
  → New service/helper (if needed): [ServiceName::method()]
  → Observer changes (if any): [what changes, why]

FRONTEND:
  → New page(s): [Pages/Domain/PageName.tsx]
  → New component(s): [Components/Domain/ComponentName.tsx]
  → Props expected from controller: [list key props]
  → New tab (if dashboard page): [tab name, accent color]

FLOW SUMMARY:
  [Describe the complete user journey in 3-5 sentences]

RISKS IDENTIFIED:
  [List anything that needs extra care during execution]

DEPENDENCIES TO FINISH FIRST:
  [List anything that must be done before this can be built]
```

### 3B. Blueprint Quality Gates
```
Before presenting blueprint to Silvia, verify:
  [ ] No schema changes without explicit discussion
  [ ] All existing relations accounted for
  [ ] Observer side effects considered
  [ ] RBAC / auth middleware specified for all new routes
  [ ] Mobile-first noted for all new UI components
  [ ] No "we'll figure it out later" items — everything decided upfront
  [ ] Zero-rework: this blueprint can go straight to execution
```

---

## Anti-Patterns to Avoid

```
❌ Proposing a solution before finishing the audit
   → "We should build X" before knowing what already exists

❌ Blueprinting based on assumed file structure
   → Always ask for actual files, never guess column names

❌ Ignoring existing observers when planning new model changes
   → Observer side effects are silent — they will surprise you

❌ Building on top of a known bug
   → If 02_status.md shows a pending fix in this area → fix it first

❌ Skipping the dependency map
   → "Let's just build it and see" = guaranteed rework

❌ Too many open questions in the blueprint
   → All decisions must be made before execution starts
   → If Silvia hasn't decided something → that decision must happen now, not later
```

---

## Quick Reference — Discussion Triggers

```
Silvia says...                    → Livi does...
─────────────────────────────────────────────────────────
"kita mau buat [fitur X]"        → Start Phase 1 audit immediately
"next kita tackle [Y]"           → Ask for relevant files, start audit
"gimana menurut kamu [flow X]?"  → Analyze, map flow, present findings
"bisa langsung execute?"         → Only if blueprint already complete
"ada yang perlu diaudit dulu?"   → Yes — always audit before blueprint
"lanjut dari sesi kemarin"       → Read 02_status.md Last Session Summary first
```
