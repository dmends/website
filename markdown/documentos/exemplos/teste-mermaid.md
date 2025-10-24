# Teste de Diagramas Mermaid

Este documento demonstra diversos tipos de diagramas que podem ser criados com Mermaid.js.

## Como Usar

Clique em qualquer diagrama para abri-lo em um modal interativo com:
- � **Zoom automático** - diagrama abre ocupando o máximo espaço possível
- �🔍 Zoom manual de 50% a 1000%
- 🖱️ Arrastar para navegar
- ◀️ ▶️ **Navegação entre diagramas** (setas < > ou ← →)
- ⌨️ Atalhos de teclado (F para fullscreen, Esc para fechar)
- �️ Modo fullscreen
- 📊 Contador de diagramas (ex: "2 de 12")

---

## 1. Fluxograma (Flowchart)

### Exemplo Simples

```mermaid
graph TD
    A[Início] --> B{Decisão}
    B -->|Sim| C[Opção 1]
    B -->|Não| D[Opção 2]
    C --> E[Fim]
    D --> E
```

### Fluxograma de Processo

```mermaid
graph LR
    A[Cliente] -->|Faz Pedido| B[Sistema]
    B -->|Valida| C{Estoque?}
    C -->|Sim| D[Processa Pagamento]
    C -->|Não| E[Notifica Falta]
    D --> F[Envia Produto]
    E --> A
    F --> G[Cliente Recebe]
```

---

## 2. Diagrama de Sequência

### Interação Login

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    
    U->>F: Informa credenciais
    F->>B: POST /login
    B->>DB: Verifica usuário
    DB-->>B: Dados do usuário
    B-->>F: Token JWT
    F-->>U: Redireciona para home
```

### Fluxo de Pagamento

```mermaid
sequenceDiagram
    participant C as Cliente
    participant A as App
    participant P as Gateway Pagamento
    participant B as Banco
    
    C->>A: Confirma compra
    A->>P: Solicita pagamento
    P->>B: Processa transação
    B-->>P: Aprovado
    P-->>A: Confirmação
    A-->>C: Pedido confirmado
    
    Note over C,B: Pagamento processado em 2-3 segundos
```

---

## 3. Diagrama de Classes

### Sistema de E-commerce

```mermaid
classDiagram
    class Usuario {
        +int id
        +string nome
        +string email
        +login()
        +logout()
    }
    
    class Produto {
        +int id
        +string nome
        +float preco
        +int estoque
        +atualizar()
    }
    
    class Pedido {
        +int id
        +date data
        +string status
        +calcularTotal()
        +processar()
    }
    
    class ItemPedido {
        +int quantidade
        +float precoUnitario
        +calcularSubtotal()
    }
    
    Usuario "1" --> "*" Pedido : faz
    Pedido "1" --> "*" ItemPedido : contém
    Produto "1" --> "*" ItemPedido : referencia
```

---

## 5. Diagrama de Estados

### Ciclo de Vida de um Pedido

```mermaid
stateDiagram-v2
    [*] --> Pendente
    Pendente --> Processando : Pagamento Confirmado
    Processando --> Enviado : Preparação Concluída
    Processando --> Cancelado : Erro no Estoque
    Enviado --> EmTransito : Despachado
    EmTransito --> Entregue : Recebido
    Entregue --> [*]
    Cancelado --> [*]
    
    Pendente --> Cancelado : Cliente Cancela
```

---

## 6. Diagrama de Gantt

### Cronograma de Projeto

```mermaid
gantt
    title Projeto Markdown Viewer
    dateFormat YYYY-MM-DD
    section Planejamento
    Definir requisitos       :done, plan1, 2025-01-01, 5d
    Criar protótipo          :done, plan2, after plan1, 7d
    
    section Desenvolvimento
    Implementar parser MD    :done, dev1, 2025-01-15, 10d
    Adicionar Mermaid        :done, dev2, after dev1, 7d
    Implementar temas        :done, dev3, after dev2, 5d
    Adicionar export PDF     :done, dev4, after dev3, 5d
    
    section Testes
    Testes unitários         :active, test1, 2025-02-10, 5d
    Testes integração        :test2, after test1, 5d
    
    section Deploy
    Deploy produção          :milestone, deploy, 2025-02-25, 1d
```

---

## 7. Diagrama de Pizza (Pie Chart)

### Distribuição de Linguagens

```mermaid
pie title Linguagens do Projeto
    "JavaScript" : 45
    "CSS" : 25
    "HTML" : 20
    "JSON" : 10
```

---

## 8. Git Graph

### Histórico de Branches

```mermaid
gitGraph
    commit id: "Initial commit"
    commit id: "Add basic structure"
    branch develop
    checkout develop
    commit id: "Add markdown parser"
    commit id: "Add mermaid support"
    checkout main
    merge develop
    branch feature/pdf-export
    checkout feature/pdf-export
    commit id: "Implement PDF export"
    checkout develop
    merge feature/pdf-export
    checkout main
    merge develop
    commit id: "Release v2.4.0"
```

---

## 9. Diagrama com Tags HTML (Caso Especial)

Este exemplo demonstra o suporte a tags HTML em diagramas Mermaid:

```mermaid
graph LR
    A[<ProdutoEntity>] --> B[<ContratoEntity>]
    B --> C{Validação}
    C -->|OK| D[<ProcessoEntity>]
    C -->|Erro| E[<ErrorHandler>]
    D --> F[<ResultEntity>]
```

---

## 10. Diagrama de Jornada do Usuário

### Experiência de Compra

```mermaid
journey
    title Jornada de Compra Online
    section Descoberta
      Pesquisa no Google: 5: Cliente
      Visita site: 4: Cliente
      Navega produtos: 4: Cliente
    section Decisão
      Compara preços: 3: Cliente
      Lê avaliações: 4: Cliente
      Adiciona ao carrinho: 5: Cliente
    section Compra
      Faz checkout: 4: Cliente
      Preenche dados: 3: Cliente
      Confirma pagamento: 5: Cliente
    section Pós-Compra
      Recebe confirmação: 5: Cliente, Sistema
      Acompanha entrega: 4: Cliente, Sistema
      Recebe produto: 5: Cliente
```

---

## 11. Mindmap

### Estrutura do Projeto

```mermaid
mindmap
  root((Markdown Viewer))
    Frontend
      HTML
      CSS
        Temas
        Responsivo
      JavaScript
        Módulos
        Event Handlers
    Funcionalidades
      Parser Markdown
      Diagramas Mermaid
      Syntax Highlight
      Export PDF
    Documentação
      README
      Exemplos
      API Docs
```

---

## 12. Diagrama de Arquitetura

### Arquitetura da Aplicação

```mermaid
graph TB
    subgraph "Frontend"
        UI[Interface do Usuário]
        APP[App.js]
        UI_MGR[UI Manager]
        FILE_MGR[File Manager]
    end
    
    subgraph "Processamento"
        MD[Markdown Processor]
        MERMAID[Mermaid Renderer]
        HIGHLIGHT[Syntax Highlighter]
    end
    
    subgraph "Exportação"
        PDF[PDF Generator]
    end
    
    subgraph "Dados"
        FILES[Arquivos .md]
        STRUCT[structure.json]
    end
    
    UI --> UI_MGR
    UI_MGR --> APP
    APP --> FILE_MGR
    FILE_MGR --> FILES
    FILE_MGR --> STRUCT
    APP --> MD
    MD --> MERMAID
    MD --> HIGHLIGHT
    UI_MGR --> PDF
```

---

## Recursos Interativos

### Controles do Modal

Ao clicar em qualquer diagrama acima:

1. **Zoom Automático Inteligente** ⭐ NOVO!
   - 📐 Diagrama abre automaticamente no tamanho ideal para preencher a tela
   - 🎯 Calcula zoom baseado nas dimensões do diagrama e do modal
   - 📏 Mantém proporções e garante visibilidade completa
   - 🔄 Aplica zoom ótimo automaticamente ao trocar de diagrama

2. **Navegação entre Diagramas** ⭐ NOVO!
   - 🔘 Botões < e > no cabeçalho do modal
   - ⌨️ Setas do teclado (← →)
   - 📊 Contador mostra qual diagrama está visualizando (ex: "3 de 12")
   - 🔄 Troca automática de diagrama com reset de zoom e posição

3. **Zoom Manual**
   - 🖱️ Ctrl + Scroll do mouse
   - ⌨️ Ctrl + Plus/Minus
   - 🔘 Botões + e -
   - Incrementos: 50% até 200%, depois 100% até 1000%
   - Range: 50% (mínimo) até 1000% (máximo)

4. **Navegação no Diagrama**
   - 🖱️ Arrastar e soltar (drag & drop)
   - 📱 Suporte a touch em dispositivos móveis
   - Sensibilidade aumentada (1.5x)

5. **Atalhos de Teclado**
   - `←` `→` - Navegar entre diagramas
   - `F` - Alternar fullscreen
   - `Esc` - Fechar modal
   - `Ctrl+0` - Reset zoom para zoom ótimo automático
   - `Ctrl+` `+` - Aumentar zoom
   - `Ctrl+` `-` - Diminuir zoom

6. **Posicionamento**
   - Diagrama sempre visível do início (topo-esquerda)
   - Scroll automático para (0, 0) ao trocar de diagrama
   - Zoom automático calculado para aproveitar espaço máximo
   - Transform-origin otimizado

---

## Conclusão

O Markdown Viewer oferece suporte completo a diagramas Mermaid com uma experiência interativa e intuitiva. Experimente clicar nos diagramas acima e explorar todos os recursos!

### Tipos de Diagramas Suportados

- ✅ Fluxogramas (Flowchart)
- ✅ Diagramas de Sequência
- ✅ Diagramas de Classes
- ✅ Diagramas ERD
- ✅ Diagramas de Estados
- ✅ Gantt
- ✅ Gráficos de Pizza
- ✅ Git Graph
- ✅ Journey
- ✅ Mindmap
- ✅ E muito mais!

---

**Documentação Mermaid:** [mermaid.js.org](https://mermaid.js.org/)  
**Versão:** 10.6.1
