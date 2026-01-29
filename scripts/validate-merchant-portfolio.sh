#!/bin/bash
set -e

echo "Validando merchant-web para release pública..."
ERRORS=0
WARN=0

# Verifica se o arquivo de configuração contém placeholders
if grep -q "AIza" config/firebaseConfig.ts 2>/dev/null || grep -q "lancheria-" config/firebaseConfig.ts 2>/dev/null; then
  echo "✗ firebaseConfig.ts contém chaves ou dados sensíveis"
  ERRORS=$((ERRORS+1))
else
  echo "✓ firebaseConfig.ts OK (sem chaves embutidas)"
fi

# Verifica .env
if [ -f ".env" ] || [ -f ".env.local" ]; then
  echo "✗ .env ou .env.local não devem existir no repositório"
  ERRORS=$((ERRORS+1))
else
  echo "✓ .env não presente"
fi

# Verifica arquivos firebase/ios/android
if git ls-files | grep -q "google-services.json"; then
  echo "✗ google-services.json está sendo rastreado por git"
  ERRORS=$((ERRORS+1))
else
  echo "✓ google-services.json não rastreado"
fi

if git ls-files | grep -q "GoogleService-Info.plist"; then
  echo "✗ GoogleService-Info.plist está sendo rastreado por git"
  ERRORS=$((ERRORS+1))
else
  echo "✓ GoogleService-Info.plist não rastreado"
fi

if [ $ERRORS -ne 0 ]; then
  echo "Encontrados problemas: $ERRORS\nCorrija antes de publicar."
  exit 1
fi

echo "Tudo OK para merchant-web public-portfolio branch." 
