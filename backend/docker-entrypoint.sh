#!/bin/sh
set -e

echo "⏳ Waiting for database..."
for i in $(seq 1 30); do
  if npx prisma migrate status > /dev/null 2>&1; then
    echo "✅ Database is ready!"
    break
  fi
  echo "   Waiting for database... ($i/30)"
  sleep 2
done

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🔥 Starting backend server..."
exec node dist/index.js
