# 🚀 Merchant Web - Lancheria (Versão Lojista)

Aplicativo web para lojistas gerenciarem produtos, categorias, pedidos e outras funcionalidades da Lancheria.

## ✨ Funcionalidades Implementadas

### 📦 Gestão de Produtos

#### CRUD Completo
- ✅ Criar novos produtos
- ✅ Visualizar lista de produtos com imagens
- ✅ Editar produtos existentes
- ✅ Excluir produtos (com confirmação)

#### Recursos Visuais
- **Miniaturas na Lista**: Exibe foto 50x50px de cada produto na tabela
- **Preview Grande no Modal**: Imagem 200x200px ao editar/criar produto
- **Placeholder**: Ícone "image-off" para produtos sem foto
- **Indicador de Carregamento**: Spinner durante upload de imagem
- **Aviso de Dimensões**: Recomendação de imagens quadradas (1:1) - 800x800px ou 1024x1024px

#### Ordenação Inteligente
- 🔄 Ordenar por **Nome** (A-Z / Z-A)
- 🔄 Ordenar por **Categoria** (A-Z / Z-A)  
- 🔄 Ordenar por **Preço** (Menor-Maior / Maior-Menor)
- 📊 Ícones visuais indicando direção da ordenação

### 🏷️ Gestão de Categorias

#### CRUD de Categorias
- ✅ Criar categorias personalizadas
- ✅ Editar nome e ícone
- ✅ Excluir categorias
- ✅ Categorias padrão: Comidas 🍔, Bebidas ☕

#### Ícones Disponíveis
- `food` - Comida genérica
- `cup` - Bebida/Xícara
- `pizza` - Pizza
- `hamburger` - Hambúrguer
- `ice-cream` - Sorvete
- `coffee` - Café
- `glass-cocktail` - Drinks
- `food-apple` - Frutas
- `cake` - Sobremesas
- `silverware-fork-knife` - Restaurante
- `bottle-soda` - Refrigerante
- `beer` - Cerveja
- `tea` - Chá

#### Visualização
- **Chips com Ícones**: Cada categoria exibe seu ícone na lista de produtos
- **Seleção Visual**: Grid de ícones para escolha fácil
- **Integração**: Acesso direto ao gerenciador dentro do formulário de produto

## 🔧 Instalação e Configuração

### 1. Instalar Dependências

```bash
cd merchant-web
npm install
```

### 2. Configuração do Firebase

O projeto usa a mesma configuração do Firebase do app cliente (Lancheria). A configuração está em:
```
config/firebaseConfig.ts
```

### 3. Popular Banco de Dados

#### Automático (Recomendado)
As categorias são criadas automaticamente na primeira execução quando você tenta carregá-las.

#### Manual (Script Bash)
```bash
cd merchant-web
./scripts/populate-categories.sh
```

## 🎯 Como Usar

### Executar o Aplicativo

```bash
# Web (Recomendado para desktop)
npm run web

# Android
npm run android

# iOS
npm run ios
```

### Gerenciar Produtos

1. **Adicionar Produto**
   - Clique em "Novo Produto"
   - Preencha nome, descrição e preço
   - Selecione categoria (ou crie nova)
   - Adicione imagem (aguarde o carregamento)
   - Clique em "Salvar"

2. **Editar Produto**
   - Clique no ícone de lápis ✏️
   - Modifique os campos desejados
   - Clique em "Atualizar"

3. **Excluir Produto**
   - Clique no ícone de lixeira 🗑️
   - Confirme a exclusão

### Gerenciar Categorias

1. **Pelo Botão Principal**
   - Clique em "Categorias" no topo
   - Modal de gerenciamento abre

2. **Pelo Formulário de Produto**
   - Ao selecionar categoria
   - Clique em "Gerenciar Categorias" no menu

3. **Criar/Editar Categoria**
   - Digite o nome
   - Selecione um ícone visual
   - Clique em "Salvar"

## 📁 Estrutura do Projeto

```
merchant-web/
├── app/
│   └── products.tsx         # Tela principal de produtos
├── config/
│   └── firebaseConfig.ts    # Configuração Firebase Web SDK
├── services/
│   ├── products.ts          # Serviço CRUD de produtos
│   └── categories.ts        # Serviço CRUD de categorias
├── types/
│   └── index.ts             # Definições TypeScript
├── scripts/
│   └── populate-categories.sh  # Script de população
└── components/              # Componentes reutilizáveis
```

## 🎨 Componentes Principais

### ProductForm
- Modal para criar/editar produtos
- Upload de imagem com preview
- Seleção de categoria com ícones
- Validações de formulário

### CategoryModal
- Modal para gerenciar categorias
- Grid de seleção de ícones
- CRUD completo de categorias

### DataTable
- Lista de produtos com miniaturas
- Ordenação clicável por coluna
- Ações de editar/excluir

## 🔐 Dados Persistidos

### Produto (Firestore)
```typescript
{
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageBase64?: string;  // Imagem em base64
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Categoria (Firestore)
```typescript
{
  id: string;
  name: string;
  icon?: string;         // Nome do ícone
  createdAt: Timestamp;
}
```

## 🚀 Próximas Funcionalidades

- [ ] Gestão de pedidos em tempo real
- [ ] Dashboard com estatísticas
- [ ] Autenticação de lojista
- [ ] Notificações push
- [ ] Relatórios e analytics
- [ ] Upload para Firebase Storage (opcional)
- [ ] Histórico de alterações

## 🛠️ Tecnologias

- **Framework**: Expo + React Native
- **UI**: React Native Paper
- **Backend**: Firebase Firestore
- **Linguagem**: TypeScript
- **Navegação**: Expo Router
- **Ícones**: Material Community Icons

## 📝 Notas Importantes

- Imagens são armazenadas em **base64** diretamente no Firestore
- Tamanho recomendado de imagem: **800x800px** ou **1024x1024px**
- Qualidade de compressão: **70%** para otimizar espaço
- Categorias são compartilhadas entre app cliente e lojista

## 🐛 Troubleshooting

### Categorias não aparecem
Execute o script de população:
```bash
./scripts/populate-categories.sh
```

### Imagens não carregam
- Verifique permissões de galeria
- Aguarde o indicador de carregamento
- Imagens muito grandes podem demorar

### Erro ao salvar produto
- Verifique conexão com internet
- Confirme credenciais Firebase
- Veja console para detalhes

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação do Firebase e Expo.

---

**Desenvolvido para o projeto Lancheria** 🍔☕
