set PROJECT /home/silinux/Documents/MyPlaygraund/Laravel-Project/sentinel-admission

echo '# Prompt Template - Sentinel Admission

## WAJIB - Selalu pakai di setiap sesi
@docs-ai/CORE_CONTEXT.md

## Tambahkan sesuai kebutuhan task:

### Saat task Frontend
@docs-ai/compressed/04_skill_frontend.md

### Saat task Backend
@docs-ai/compressed/05_skill_backend.md

### Saat task Auth/Login
@docs-ai/compressed/blueprint_auth_staff_admin.md

### Saat task Dashboard
@docs-ai/compressed/blueprint_staff_admin_dashboard.md

### Saat task Infra/Deploy
@docs-ai/compressed/06_skill_infra.md

### Saat cek progress project
@docs-ai/compressed/02_status.md

### Saat diskusi mendalam
@docs-ai/compressed/07_skill_deep_discussion.md' > $PROJECT/docs-ai/PROMPT_TEMPLATE.md