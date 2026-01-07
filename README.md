# Merchant Web - Aplicativo Lojista

Este é o aplicativo para lojistas gerenciarem seus produtos, pedidos e outras funcionalidades da Lancheria.

## Configuração Inicial

### 1. Instalação de Dependências

```bash
cd merchant-web
npm install
```

### 2. População do Banco de Dados

O aplicativo possui um sistema automático de população de categorias. As categorias serão criadas automaticamente na primeira vez que você tentar carregá-las na tela de produtos.

**Categorias Padrão:**
- Comidas
- Bebidas

#### Opção Manual (Script Bash)

Se preferir popular manualmente as categorias antes de usar o app, execute:

```bash
cd merchant-web
./scripts/populate-categories.sh
```

**Requisitos:**
- Node.js instalado
- npm instalado
- Conexão com a internet (para acessar o Firebase)

O script irá:
1. Verificar se já existem categorias no banco
2. Se não existirem, criar as categorias padrão
3. Se já existirem, apenas listar as categorias existentes

## Executando o Aplicativo

### Web
```bash
npm run web
```

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

## Funcionalidades Implementadas

### Tela de Produtos

- ✅ **CRUD Completo**: Criar, Ler, Atualizar e Deletar produtos
- ✅ **Conexão com Firebase**: Integração completa com Firestore
- ✅ **Categorias Dinâmicas**: Categorias carregadas do banco de dados
- ✅ **População Automática**: Categorias criadas automaticamente se não existirem
- ✅ **Upload de Imagens**: Suporte para adicionar imagens aos produtos
- ✅ **Aviso de Imagens**: Recomendação de usar imagens quadradas (1:1) - 800x800px ou 1024x1024px
- ✅ **Ordenação por Colunas**: Ordenar produtos por Nome, Categoria ou Preço (ascendente/descendente)
- ✅ **Interface Responsiva**: Design adaptável para diferentes tamanhos de tela

### Detalhes Técnicos

#### Estrutura de Dados - Produto
```typescript
{
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageBase64?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

#### Estrutura de Dados - Categoria
```typescript
{
  id: string;
  name: string;
  createdAt?: Timestamp;
}
```

## Serviços

### products.ts
- `getProducts()`: Busca todos os produtos
- `getProductById(id)`: Busca um produto específico
- `addProduct(product)`: Adiciona um novo produto
- `updateProduct(id, product)`: Atualiza um produto existente
- `deleteProduct(id)`: Remove um produto

### categories.ts
- `getCategories()`: Busca todas as categorias (cria automaticamente se não existirem)
- `addCategory(name)`: Adiciona uma nova categoria

## Configuração do Firebase

O aplicativo utiliza a mesma configuração do Firebase do projeto principal Lancheria (cliente), garantindo que ambos os aplicativos compartilhem o mesmo banco de dados.

**Arquivo de configuração:** `config/firebaseConfig.ts`

## Estrutura de Pastas

```
merchant-web/
├── app/              # Telas do aplicativo
├── components/       # Componentes reutilizáveis
├── config/          # Configurações (Firebase)
├── services/        # Serviços de API/Banco
├── scripts/         # Scripts utilitários
├── types/           # Definições TypeScript
└── assets/          # Recursos estáticos
```

## Próximos Passos

- [ ] Implementar tela de pedidos
- [ ] Implementar dashboard com estatísticas
- [ ] Adicionar autenticação de lojista
- [ ] Implementar notificações em tempo real
- [ ] Adicionar relatórios e analytics
