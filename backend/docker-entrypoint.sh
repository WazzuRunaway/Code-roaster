#!/bin/sh
set -e

OLLAMA_URL="${OLLAMA_URL:-http://ollama:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-qwen2.5-coder:3b}"

echo "⏳ Waiting for Ollama at $OLLAMA_URL..."
for i in $(seq 1 60); do
  if curl -sf "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
    echo "✅ Ollama is ready!"
    break
  fi
  echo "   Waiting... ($i/60)"
  sleep 2
done

# Check if model is already pulled
if ! curl -sf "$OLLAMA_URL/api/tags" | grep -q "$OLLAMA_MODEL"; then
  echo "📥 Pulling Ollama model: $OLLAMA_MODEL (this may take a while...)"
  curl -sf -X POST "$OLLAMA_URL/api/pull" -d "{\"name\": \"$OLLAMA_MODEL\"}" > /dev/null 2>&1 || true
  echo "✅ Model pulled!"
else
  echo "✅ Model $OLLAMA_MODEL already available"
fi

# Run Prisma migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Start the server
echo "🔥 Starting backend server..."
exec node dist/index.js
