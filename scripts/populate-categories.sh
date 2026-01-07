#!/bin/bash

# Script para popular categorias no Firestore
# Para uso no Linux Mint

echo "========================================="
echo "  Script de População de Categorias"
echo "========================================="
echo ""

# Verifica se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    echo "Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verifica se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado!"
    echo "Por favor, instale o npm primeiro."
    exit 1
fi

echo "✅ Node.js e npm encontrados"
echo ""

# Verifica se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar dependências"
        exit 1
    fi
    echo "✅ Dependências instaladas com sucesso"
    echo ""
fi

# Cria o script Node.js temporário para popular o banco
TEMP_SCRIPT=$(mktemp /tmp/populate-categories.XXXXXX.js)

cat > "$TEMP_SCRIPT" << 'EOF'
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, Timestamp } = require('firebase/firestore');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "REDACTED_FIREBASE_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const DEFAULT_CATEGORIES = ['Comidas', 'Bebidas'];

async function populateCategories() {
  try {
    console.log('🔥 Conectando ao Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('📋 Verificando categorias existentes...');
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);

    if (!snapshot.empty) {
      console.log(`✅ Já existem ${snapshot.size} categoria(s) no banco:`);
      snapshot.forEach((doc) => {
        console.log(`   - ${doc.data().name} (ID: ${doc.id})`);
      });
      console.log('');
      console.log('ℹ️  Nenhuma ação necessária.');
      process.exit(0);
    }

    console.log('📝 Populando categorias padrão...');
    for (const categoryName of DEFAULT_CATEGORIES) {
      await addDoc(categoriesRef, {
        name: categoryName,
        createdAt: Timestamp.now(),
      });
      console.log(`   ✓ Categoria "${categoryName}" criada`);
    }

    console.log('');
    console.log('✅ Categorias populadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao popular categorias:', error.message);
    process.exit(1);
  }
}

populateCategories();
EOF

echo "🚀 Executando script de população..."
echo ""

node "$TEMP_SCRIPT"
EXIT_CODE=$?

# Remove o arquivo temporário
rm "$TEMP_SCRIPT"

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "========================================="
    echo "  ✅ Script executado com sucesso!"
    echo "========================================="
else
    echo "========================================="
    echo "  ❌ Erro na execução do script"
    echo "========================================="
fi

exit $EXIT_CODE
