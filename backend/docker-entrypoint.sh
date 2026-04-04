#!/bin/sh
set -e

OLLAMA_URL="${OLLAMA_URL:-http://ollama:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-qwen2.5-coder:3b}"

echo "⏳ Waiting for Ollama at $OLLAMA_URL..."
OLAMA_READY=false
for i in $(seq 1 60); do
  if curl -sf "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
    OLLAMA_READY=true
    echo "✅ Ollama is ready!"
    break
  fi
  echo "   Waiting... ($i/60)"
  sleep 2
done

if [ "$OLLAMA_READY" = "false" ]; then
  echo "❌ Ollama not available after 2 minutes. Exiting."
  exit 1
fi

# Check if model is already pulled (parse JSON properly)
MODELS=$(curl -sf "$OLLAMA_URL/api/tags" || echo '{"models":[]}')
HAS_MODEL=$(echo "$MODELS" | grep -o "\"name\":\"$OLLAMA_MODEL\"" || true)

if [ -z "$HAS_MODEL" ]; then
  echo "📥 Pulling Ollama model: $OLLAMA_MODEL (this may take a while...)"
  PULL_RESULT=$(curl -sf -X POST "$OLLAMA_URL/api/pull" -d "{\"name\": \"$OLLAMA_MODEL\"}" 2>&1 || true)
  if echo "$PULL_RESULT" | grep -q "error"; then
    echo "⚠️  Model pull may have failed: $PULL_RESULT"
    echo "   Server will start anyway — fallback mode will activate"
  else
    echo "✅ Model pulled!"
  fi
else
  echo "✅ Model $OLLAMA_MODEL already available"
fi

# Run Prisma migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Start the server
echo "🔥 Starting backend server..."
exec node dist/index.js
