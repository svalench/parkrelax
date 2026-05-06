#!/bin/sh
set -e

# Миграции выполняются до любой команды (даже если в compose переопределён command).
echo "Applying database migrations..."
alembic upgrade head

echo "Starting application..."
if [ "$#" -eq 0 ]; then
  set -- uvicorn app.main:app --host 0.0.0.0 --port 8000
fi
exec "$@"
