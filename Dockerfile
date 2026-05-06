# syntax=docker/dockerfile:1

# ═══════════════════════════════════════════════════════════════════
# Stage 1 — Build frontend
# ═══════════════════════════════════════════════════════════════════
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ARG VITE_KIMI_AUTH_URL
ARG VITE_APP_ID
ENV VITE_KIMI_AUTH_URL=${VITE_KIMI_AUTH_URL}
ENV VITE_APP_ID=${VITE_APP_ID}
RUN npm run build

# ═══════════════════════════════════════════════════════════════════
# Stage 2 — Production image (backend + built frontend)
# ═══════════════════════════════════════════════════════════════════
FROM python:3.12-slim AS production
WORKDIR /app

# System dependencies for Pillow, bcrypt, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Backend code
COPY backend/ ./backend/

# Built frontend static files
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV PYTHONPATH=/app/backend
ENV NODE_ENV=production

WORKDIR /app/backend

EXPOSE 8000

# Миграции в entrypoint; CMD можно переопределять — entrypoint всё равно отработает первым
RUN chmod +x /app/backend/entrypoint.sh
ENTRYPOINT ["/app/backend/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
