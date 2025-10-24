/**
 * Módulo responsável pelo processamento de arquivos Markdown
 * e conversão para HTML formatado
 */

class MarkdownProcessor {
    constructor() {
        this.cache = new Map();
        this.currentContent = '';
        this.currentFile = null;
        
        // Configurações do marked.js
        this.markedOptions = {
            headerIds: true,
            mangle: false,
            breaks: true,
            gfm: true, // GitHub Flavored Markdown
            sanitize: false,
            smartypants: true,
            pedantic: false
        };
        
        this.init();
    }
    
    /**
     * Inicializa o processador de Markdown
     */
    init() {
        this.configureMarked();
        this.configureMermaid();
        this.configureSwagger();
        this.configureHighlightJs();
        this.setupEventListeners();
    }
    
    /**
     * Configura o Swagger UI
     */
    configureSwagger() {
        if (typeof SwaggerUIBundle === 'undefined') {
            console.warn('⚠️ SwaggerUIBundle não está disponível');
            return;
        }
        console.log('✅ Swagger UI disponível');
    }
    
    /**
     * Configura o Highlight.js
     */
    configureHighlightJs() {
        if (typeof hljs === 'undefined') {
            return;
        }
        
        // Atualiza tema baseado no tema atual
        this.updateHighlightTheme();
    }
    
    /**
     * Atualiza o tema do Highlight.js
     */
    updateHighlightTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const themeLink = document.querySelector('#highlight-theme');
        
        if (themeLink) {
            const newTheme = isDark 
                ? 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/atom-one-dark.min.css'
                : 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/atom-one-light.min.css';
            
            if (themeLink.href !== newTheme) {
                themeLink.href = newTheme;
            }
        }
    }
    
    /**
     * Configura o Mermaid
     */
    configureMermaid() {
        if (typeof mermaid === 'undefined') {
            return;
        }
        
        const config = {
            startOnLoad: false,
            theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default',
            securityLevel: 'loose',
            logLevel: 'error', // Reduz logs desnecessários
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            },
            sequence: {
                useMaxWidth: true,
                diagramMarginX: 50,
                diagramMarginY: 10
            },
            gantt: {
                useMaxWidth: true
            },
            er: {
                useMaxWidth: true
            },
            pie: {
                useMaxWidth: true
            }
        };

        try {
            mermaid.initialize(config);
        } catch (error) {
            // Erro silencioso - Mermaid não crítico para aplicação
        }
        
        // Adiciona listener para mudança de tema
        document.addEventListener('themeChanged', (e) => {
            const newTheme = e.detail?.theme === 'dark' ? 'dark' : 'default';
            try {
                mermaid.initialize({ ...config, theme: newTheme });
                this.rerenderMermaidDiagrams();
            } catch (error) {
                // Erro silencioso
            }
            this.updateHighlightTheme();
        });
    }    /**
     * Configura a biblioteca marked.js
     */
    configureMarked() {
        if (typeof marked !== 'undefined') {
            marked.setOptions(this.markedOptions);
            
            // Configuração de renderer personalizado
            const renderer = new marked.Renderer();
            
            // Personalizar renderização de links
            renderer.link = ({href, title, text}) => {
                const hrefStr = String(href || '');
                const isExternal = hrefStr.startsWith('http') || hrefStr.startsWith('//');
                const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
                const titleAttr = title ? ` title="${title}"` : '';
                return `<a href="${hrefStr}"${titleAttr}${target}>${text}</a>`;
            };
            
            // Personalizar renderização de imagens
            renderer.image = ({href, title, text}) => {
                const titleAttr = title ? ` title="${title}"` : '';
                const altAttr = text ? ` alt="${text}"` : '';
                return `<img src="${href}"${altAttr}${titleAttr} loading="lazy">`;
            };
            
            // Personalizar renderização de tabelas
            renderer.table = (token) => {
                
                // O Marked.js passa: { header: Array, rows: Array, align: Array }
                // Cada célula tem tokens que precisam ser processados para renderizar formatação (negrito, código, etc)
                
                let tableHTML = '<thead><tr>';
                
                // Renderiza header (array de células)
                if (token.header && Array.isArray(token.header)) {
                    for (const cell of token.header) {
                        // Usa parser para processar os tokens e renderizar formatação (**negrito**, `código`, etc)
                        const cellContent = cell.tokens 
                            ? marked.parser([{ type: 'paragraph', tokens: cell.tokens }]).replace(/<\/?p>/g, '')
                            : (cell.text || cell.raw || '');
                        const align = cell.align ? ` style="text-align: ${cell.align}"` : '';
                        tableHTML += `<th${align}>${cellContent}</th>`;
                    }
                }
                
                tableHTML += '</tr></thead><tbody>';
                
                // Renderiza rows (array de linhas, cada linha é array de células)
                if (token.rows && Array.isArray(token.rows)) {
                    for (const row of token.rows) {
                        tableHTML += '<tr>';
                        if (Array.isArray(row)) {
                            for (const cell of row) {
                                // Usa parser para processar os tokens e renderizar formatação
                                const cellContent = cell.tokens 
                                    ? marked.parser([{ type: 'paragraph', tokens: cell.tokens }]).replace(/<\/?p>/g, '')
                                    : (cell.text || cell.raw || '');
                                const align = cell.align ? ` style="text-align: ${cell.align}"` : '';
                                tableHTML += `<td${align}>${cellContent}</td>`;
                            }
                        }
                        tableHTML += '</tr>';
                    }
                }
                
                tableHTML += '</tbody>';
                
                return `<div class="table-container"><table class="markdown-table">${tableHTML}</table></div>`;
            };
            
            // Personalizar renderização de código
            renderer.code = ({text, lang, escaped}) => {
                // Mermaid já foi extraído no preprocessamento, não chegará aqui
                // Manter código normal de syntax highlighting
                
                const validLanguage = lang && this.isValidLanguage(lang) ? lang : 'text';
                // Para outros códigos, escapar HTML para evitar XSS
                const codeContent = escaped ? text : this.escapeHtml(text);
                
                return `<pre><code class="language-${validLanguage}">${codeContent}</code></pre>`;
            };
            
            marked.setOptions({ renderer });
        }
    }
    
    /**
     * Configura listeners de eventos
     */
    setupEventListeners() {
        // Escuta seleção de arquivos
        document.addEventListener('fileSelected', (event) => {
            this.loadAndProcessFile(event.detail.file);
        });
    }
    
    /**
     * Carrega e processa um arquivo Markdown
     */
    async loadAndProcessFile(file) {
        try {
            // Define o arquivo atual para permitir funcionalidade de reload
            this.currentFile = file;
            this.showLoading();
            
            // Verifica cache primeiro
            const cached = this.cache.get(file.path);
            if (cached) {
                this.displayContent(cached.html, file);
                return;
            }
            
            // Carrega o conteúdo do arquivo
            const content = await this.loadFileContent(file.path);
            
            if (!content) {
                this.showError('Arquivo não encontrado ou não pôde ser carregado');
                return;
            }
            
            // Processa o Markdown
            const html = this.processMarkdown(content);
            
            // Salva no cache
            this.cache.set(file.path, { html, content, timestamp: Date.now() });
            
            // Exibe o conteúdo
            this.displayContent(html, file);
            
        } catch (error) {
            this.showError('Erro ao processar o arquivo Markdown');
        }
    }
    
    /**
     * Carrega o conteúdo de um arquivo
     */
    async loadFileContent(filePath) {
        try {
            const fileManager = window.fileManager;
            
            if (fileManager && fileManager.useDynamicLoader && fileManager.dynamicLoader) {
                try {
                    return await this.loadDynamicFileContent(filePath, fileManager.dynamicLoader);
                } catch (dynamicError) {
                    throw new Error(`Não foi possível carregar o arquivo "${filePath}" do sistema de arquivos local.`);
                }
            }
            
            // Modo estático: carregamento via fetch
            try {
                const response = await fetch(filePath);
                if (response.ok) {
                    return await response.text();
                }
            } catch (fetchError) {
                // Silencioso
            }
            
            // Último recurso: conteúdo de exemplo
            return this.getExampleContent(filePath);
            
        } catch (error) {
            console.error(`❌ Erro ao carregar arquivo ${filePath}:`, error);
            
            // Se erro específico de permissão, mostra mensagem mais útil
            if (error.message.includes('permissão')) {
                return `# ⚠️ Erro de Permissão

Não foi possível acessar o arquivo: **${filePath}**

**Possíveis causas:**
- Você negou a permissão de acesso à pasta
- A permissão expirou (navegador)
- A pasta foi movida ou renomeada

**Solução:**
1. Clique no botão 🔄 Refresh
2. Escolha "Selecionar Pasta Local" novamente
3. Autorize o acesso quando solicitado

---

*Este é um arquivo de erro gerado automaticamente.*`;
            }
            
            // Retorna conteúdo de exemplo em caso de erro
            return this.getExampleContent(filePath);
        }
    }
    
    /**
     * Carrega conteúdo de arquivo usando o carregador dinâmico
     */
    async loadDynamicFileContent(filePath, dynamicLoader) {
        try {
            // Encontra o arquivo na estrutura
            const fileItem = dynamicLoader.findFileByPath(filePath);
            
            if (!fileItem || !fileItem.handle) {
                throw new Error(`Arquivo não encontrado: ${filePath}`);
            }
            
            // Carrega o conteúdo usando o handle
            const content = await dynamicLoader.loadFileContent(fileItem.handle);
            console.log(`✅ Conteúdo carregado dinamicamente: ${filePath}`);
            
            return content;
            
        } catch (error) {
            console.error(`Erro ao carregar arquivo dinâmico: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Gera conteúdo de exemplo para demonstração
     */
    getExampleContent(filePath) {
        const fileName = filePath.split('/').pop().replace('.md', '');
        
        const examples = {
            'README': `# Markdown Viewer

Bem-vindo ao **Markdown Viewer**, um visualizador de arquivos Markdown moderno e responsivo!

## Características

- ✨ Interface moderna e limpa
- 📱 Design totalmente responsivo
- 🔍 Busca de arquivos integrada
- 🌙 Suporte a tema escuro/claro
- 📂 Navegação hierárquica de pastas
- ⚡ Carregamento rápido com cache

## Como usar

1. Navegue pelos arquivos no menu lateral
2. Clique em um arquivo para visualizar seu conteúdo
3. Use a busca para encontrar arquivos específicos
4. Alterne entre temas claro/escuro conforme preferir

## Suporte a Markdown

Este visualizador suporta todas as funcionalidades padrão do Markdown:

### Texto formatado
- **Negrito**
- *Itálico*
- \`Código inline\`
- ~~Riscado~~

### Listas
- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2

### Links e imagens
[Link para GitHub](https://github.com)

### Código
\`\`\`javascript
function hello() {
    console.log("Hello, World!");
}
\`\`\`

> Este é um blockquote de exemplo

---

Aproveite o Markdown Viewer! 🚀`,

            'introducao': `# Introdução ao Markdown Viewer

O **Markdown Viewer** é uma ferramenta web moderna para visualização de arquivos Markdown.

## O que é Markdown?

Markdown é uma linguagem de marcação leve que permite formatar texto usando uma sintaxe simples e legível.

### Vantagens do Markdown:
- Fácil de aprender
- Legível em formato de texto puro
- Amplamente suportado
- Ideal para documentação

## Funcionalidades do Viewer

### 🔍 Busca Inteligente
Encontre rapidamente qualquer arquivo usando a busca integrada.

### 📂 Navegação Hierárquica
Organize seus documentos em pastas e subpastas.

### 🎨 Temas Personalizáveis
Alterne entre temas claro e escuro conforme sua preferência.

### 📱 Design Responsivo
Interface que se adapta a qualquer tamanho de tela.`,

            'instalacao': `# Instalação e Configuração

Siga estes passos para configurar o Markdown Viewer em seu ambiente.

## Pré-requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (opcional, mas recomendado)

## Instalação

### Opção 1: Live Server (Recomendado)

1. Instale a extensão "Live Server" no VS Code
2. Abra a pasta do projeto no VS Code
3. Clique com botão direito no \`index.html\`
4. Selecione "Open with Live Server"

### Opção 2: Python HTTP Server

\`\`\`bash
# Navegue até a pasta do projeto
cd markdown-viewer

# Execute o servidor (Python 3)
python -m http.server 8000

# Ou Python 2
python -m SimpleHTTPServer 8000
\`\`\`

### Opção 3: Node.js HTTP Server

\`\`\`bash
# Instale o http-server globalmente
npm install -g http-server

# Execute na pasta do projeto
http-server -p 8000
\`\`\`

## Configuração

### Estrutura de Arquivos

Organize seus arquivos Markdown na pasta \`documentos/\`:

\`\`\`
documentos/
├── README.md
├── guia-inicio/
│   ├── introducao.md
│   └── instalacao.md
└── tutoriais/
    └── javascript/
        └── fundamentos.md
\`\`\`

### Arquivo de Configuração (Opcional)

Crie \`documentos/structure.json\` para definir uma estrutura personalizada:

\`\`\`json
{
  "README.md": {
    "type": "file",
    "path": "documentos/README.md",
    "name": "README.md"
  },
  "guia": {
    "type": "folder",
    "name": "guia",
    "children": {
      "introducao.md": {
        "type": "file",
        "path": "documentos/guia/introducao.md",
        "name": "introducao.md"
      }
    }
  }
}
\`\`\``,

            'fundamentos': `# Fundamentos do JavaScript

Aprenda os conceitos básicos do JavaScript para desenvolvimento web.

## Variáveis e Tipos de Dados

### Declaração de Variáveis

\`\`\`javascript
// ES6+ - Recomendado
let nome = "João";
const idade = 25;

// Evite var em código moderno
var sobrenome = "Silva"; // ❌ Não recomendado
\`\`\`

### Tipos Primitivos

\`\`\`javascript
// String
let texto = "Hello, World!";
let template = \`Olá, \${nome}!\`;

// Number
let inteiro = 42;
let decimal = 3.14;

// Boolean
let verdadeiro = true;
let falso = false;

// Undefined e Null
let indefinido;
let nulo = null;
\`\`\`

## Funções

### Declaração de Função

\`\`\`javascript
// Função tradicional
function somar(a, b) {
    return a + b;
}

// Arrow function
const multiplicar = (a, b) => a * b;

// Função anônima
const dividir = function(a, b) {
    return a / b;
};
\`\`\`

### Parâmetros Padrão

\`\`\`javascript
function cumprimentar(nome = "Visitante") {
    return \`Olá, \${nome}!\`;
}

console.log(cumprimentar()); // "Olá, Visitante!"
console.log(cumprimentar("Maria")); // "Olá, Maria!"
\`\`\`

## Arrays e Objetos

### Arrays

\`\`\`javascript
const frutas = ["maçã", "banana", "laranja"];

// Métodos úteis
frutas.push("uva"); // Adiciona ao final
frutas.pop(); // Remove do final
frutas.forEach(fruta => console.log(fruta));

// Array methods
const numeros = [1, 2, 3, 4, 5];
const dobrados = numeros.map(n => n * 2);
const pares = numeros.filter(n => n % 2 === 0);
\`\`\`

### Objetos

\`\`\`javascript
const pessoa = {
    nome: "Ana",
    idade: 30,
    profissao: "Desenvolvedora",
    falar() {
        return \`Olá, eu sou \${this.nome}\`;
    }
};

// Destructuring
const { nome, idade } = pessoa;

// Spread operator
const novaPessoa = { ...pessoa, cidade: "São Paulo" };
\`\`\`

## Estruturas de Controle

### Condicionais

\`\`\`javascript
// if/else
if (idade >= 18) {
    console.log("Maior de idade");
} else {
    console.log("Menor de idade");
}

// Ternário
const status = idade >= 18 ? "adulto" : "menor";

// Switch
switch (dia) {
    case "segunda":
        console.log("Início da semana");
        break;
    case "sexta":
        console.log("Quase fim de semana!");
        break;
    default:
        console.log("Dia normal");
}
\`\`\`

### Loops

\`\`\`javascript
// for clássico
for (let i = 0; i < 5; i++) {
    console.log(i);
}

// for...of (arrays)
for (const fruta of frutas) {
    console.log(fruta);
}

// for...in (objetos)
for (const chave in pessoa) {
    console.log(\`\${chave}: \${pessoa[chave]}\`);
}

// while
let contador = 0;
while (contador < 3) {
    console.log(contador);
    contador++;
}
\`\`\`

## ES6+ Features

### Template Literals

\`\`\`javascript
const nome = "Pedro";
const idade = 25;

const mensagem = \`
    Nome: \${nome}
    Idade: \${idade}
    Ano de nascimento: \${2024 - idade}
\`;
\`\`\`

### Destructuring

\`\`\`javascript
// Array destructuring
const [primeiro, segundo] = ["a", "b", "c"];

// Object destructuring
const { nome: nomeCompleto, idade: anos } = pessoa;
\`\`\`

### Spread e Rest

\`\`\`javascript
// Spread
const array1 = [1, 2, 3];
const array2 = [...array1, 4, 5]; // [1, 2, 3, 4, 5]

// Rest
function somar(...numeros) {
    return numeros.reduce((acc, num) => acc + num, 0);
}
\`\`\`

## Exercícios Práticos

1. Crie uma função que calcule a média de um array de números
2. Implemente um contador que incremente a cada clique
3. Faça um filtro de busca em uma lista de itens

Próximo: [DOM Manipulation](dom-manipulation.md)`
        };
        
        return examples[fileName] || this.getDefaultExampleContent(fileName);
    }
    
    /**
     * Conteúdo padrão quando não há exemplo específico
     */
    getDefaultExampleContent(fileName) {
        return `# ${fileName.charAt(0).toUpperCase() + fileName.slice(1)}

Este é um arquivo de exemplo para demonstrar o **Markdown Viewer**.

## Funcionalidades Demonstradas

### Formatação de Texto
- **Texto em negrito**
- *Texto em itálico*
- \`Código inline\`
- ~~Texto riscado~~

### Listas

#### Lista não ordenada:
- Item 1
- Item 2
- Item 3

#### Lista ordenada:
1. Primeiro item
2. Segundo item
3. Terceiro item

### Links e Código

Visite nossa [documentação](README.md) para mais informações.

\`\`\`javascript
// Exemplo de código JavaScript
function exemplo() {
    console.log("Este é um exemplo de código!");
    return "Markdown Viewer";
}
\`\`\`

### Citação
> "O conhecimento é poder." - Francis Bacon

### Tabela
| Coluna 1 | Coluna 2 | Coluna 3 |
|----------|----------|----------|
| Dado 1   | Dado 2   | Dado 3   |
| Dado 4   | Dado 5   | Dado 6   |

---

Este arquivo foi gerado automaticamente para demonstração.`;
    }
    
    /**
     * Processa conteúdo Markdown e converte para HTML
     */
    processMarkdown(content) {
        if (typeof marked === 'undefined') {
            throw new Error('Biblioteca marked.js não está carregada');
        }
        
        try {
            // Pré-processa o conteúdo
            const processedContent = this.preprocessContent(content);
            
            // Converte para HTML
            const html = marked.parse(processedContent);
            
            // Pós-processa o HTML
            return this.postprocessHTML(html);
            
        } catch (error) {
            console.error('Erro ao processar Markdown:', error);
            return `<div class="error">Erro ao processar o conteúdo Markdown: ${error.message}</div>`;
        }
    }
    
    /**
     * Pré-processa o conteúdo Markdown antes da conversão
     */
    preprocessContent(content) {
        // Remove BOM se presente
        content = content.replace(/^\uFEFF/, '');

        // Normaliza quebras de linha
        content = content.replace(/\r\n/g, '\n');

        // Extrai e armazena blocos Mermaid temporariamente
        this.mermaidBlocks = [];
        let mermaidIndex = 0;
        content = content.replace(/```mermaid\s*\n?([\s\S]*?)```/g, (match, code) => {
            const placeholder = `<!--MERMAID_BLOCK_${mermaidIndex}-->`;
            this.mermaidBlocks[mermaidIndex] = code.trim();
            mermaidIndex++;
            return placeholder;
        });

        // Extrai e armazena blocos PlantUML e PUML temporariamente
        this.plantumlBlocks = [];
        let plantumlIndex = 0;
        // Regex padrão igual ao do mermaid
        content = content.replace(/```(plantuml|puml)\s*\n([\s\S]*?)\n[ \t]*```[ \t]*\n?/g, (match, lang, code) => {
            const placeholder = `<!--PLANTUML_BLOCK_${plantumlIndex}-->`;
            this.plantumlBlocks[plantumlIndex] = code;
            plantumlIndex++;
            return placeholder;
        });

        // Extrai e armazena blocos Swagger temporariamente
        this.swaggerBlocks = [];
        let swaggerIndex = 0;
        content = content.replace(/```swagger\s*\n?([\s\S]*?)```/g, (match, code) => {
            const placeholder = `<!--SWAGGER_BLOCK_${swaggerIndex}-->`;
            this.swaggerBlocks[swaggerIndex] = code.trim();
            swaggerIndex++;
            return placeholder;
        });

        // Processa custom containers (alertas, callouts, etc.)
        content = this.processCustomContainers(content);

        return content;
    }
    
    /**
     * Processa containers customizados (alertas, callouts)
     */
    processCustomContainers(content) {
        // Processa alertas tipo GitHub/GitLab
        const alertPatterns = [
            { pattern: /^\[!NOTE\]\s*$/gm, class: 'alert-note', icon: 'info-circle' },
            { pattern: /^\[!TIP\]\s*$/gm, class: 'alert-tip', icon: 'lightbulb' },
            { pattern: /^\[!WARNING\]\s*$/gm, class: 'alert-warning', icon: 'exclamation-triangle' },
            { pattern: /^\[!CAUTION\]\s*$/gm, class: 'alert-caution', icon: 'exclamation-circle' },
            { pattern: /^\[!IMPORTANT\]\s*$/gm, class: 'alert-important', icon: 'exclamation' }
        ];
        
        alertPatterns.forEach(({ pattern, class: className, icon }) => {
            content = content.replace(pattern, `<div class="alert ${className}"><i class="fas fa-${icon}"></i>`);
        });
        
        return content;
    }
    
    /**
     * Pós-processa o HTML gerado
     */
    postprocessHTML(html) {
        // Adiciona classes para tabelas
        html = html.replace(/<table>/g, '<div class="table-wrapper"><table class="markdown-table">');
        html = html.replace(/<\/table>/g, '</table></div>');
        
        // Adiciona classes para códigos
        html = html.replace(/<pre><code>/g, '<pre><code class="hljs">');
        
        // Processa checkboxes em listas
        html = html.replace(/^\s*\[ \]/gm, '<input type="checkbox" disabled>');
        html = html.replace(/^\s*\[x\]/gm, '<input type="checkbox" checked disabled>');
        
        // Restaura blocos Mermaid
        if (this.mermaidBlocks && this.mermaidBlocks.length > 0) {
            this.mermaidBlocks.forEach((code, index) => {
                const placeholder = `<!--MERMAID_BLOCK_${index}-->`;
                const id = `mermaid-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
                // Escapa < e > para HTML (Mermaid fará unescape ao renderizar)
                const escapedCode = code
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                const mermaidHTML = `<div class="mermaid-container">
                    <div class="mermaid" id="${id}">${escapedCode}</div>
                </div>`;
                html = html.replace(placeholder, mermaidHTML);
            });
        }

        // Restaura blocos PlantUML
        if (this.plantumlBlocks && this.plantumlBlocks.length > 0) {
            this.plantumlBlocks.forEach((code, index) => {
                const placeholder = `<!--PLANTUML_BLOCK_${index}-->`;
                const id = `plantuml-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
                // Escapa < e > para HTML
                const escapedCode = code
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                // Armazena o código original em <pre> oculto, sem atributo data-plantuml-code
                const plantumlHTML = `<div class="plantuml-container"><div class="plantuml" id="${id}"><pre style="display:none;">${this.escapeHtml(code)}</pre>${escapedCode}</div></div>`;
                html = html.replace(placeholder, plantumlHTML);
            });
        }

        // Restaura blocos Swagger
        if (this.swaggerBlocks && this.swaggerBlocks.length > 0) {
            this.swaggerBlocks.forEach((code, index) => {
                const placeholder = `<!--SWAGGER_BLOCK_${index}-->`;
                const id = `swagger-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
                // Armazena o código em um atributo data-* (escapado para HTML)
                const escapedCode = this.escapeHtml(code);
                const swaggerHTML = `<div class="swagger-container" id="${id}"><pre style="display:none;" data-swagger-spec>${escapedCode}</pre></div>`;
                html = html.replace(placeholder, swaggerHTML);
            });
        }

        return html;
    }
    
    /**
     * Exibe o conteúdo processado
     */
    async displayContent(html, file) {
        const contentArea = document.getElementById('content-display');
        if (!contentArea) {
            console.error('Elemento #content-display não encontrado');
            return;
        }

    // Garante que o conteúdo fique dentro de .markdown-content
    contentArea.innerHTML = `<div class="markdown-content">${html}</div>`;
    this.currentContent = html;
    this.currentFile = file;

        // Aplica syntax highlighting em blocos de código
        this.highlightAll();
        
        // Atualiza o título da página
        this.updateTitle(file);
        
        // Adiciona eventos pós-renderização (botões de copiar, etc)
        this.addPostRenderEvents(contentArea);
        
        // Renderiza documentação Swagger se existir
        await this.renderSwaggerDocs(contentArea);
        
        // Renderiza diagramas Mermaid se existirem
        const mermaidElements = contentArea.querySelectorAll('.mermaid');
        if (mermaidElements.length > 0 && typeof mermaid !== 'undefined') {
            try {
                let successCount = 0;
                let errorCount = 0;
                for (const el of mermaidElements) {
                    try {
                        const code = el.textContent;
                        if (!code || code.trim() === '') continue;
                        el.setAttribute('data-original-code', code);
                        const isValid = await mermaid.parse(code, { suppressErrors: true });
                        if (!isValid) throw new Error('Sintaxe inválida no diagrama Mermaid');
                        await mermaid.run({ nodes: [el], suppressErrors: false });
                        successCount++;
                        if (el.querySelector('svg')) {
                            this.addMermaidZoomButton(el);
                        }
                    } catch (diagramError) {
                        errorCount++;
                        el.innerHTML = `<div class="mermaid-error" style="padding: 1rem; background: var(--error-bg, #fee); border: 1px solid var(--error-border, #fcc); border-radius: var(--border-radius, 4px); color: var(--error-text, #c33);"><i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i><strong>Erro no diagrama Mermaid</strong><details style="margin-top: 0.5rem;"><summary style="cursor: pointer; user-select: none;">Ver detalhes do erro</summary><pre style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(0,0,0,0.1); border-radius: 4px; font-size: 0.875rem; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;">${this.escapeHtml(diagramError.message || diagramError.toString())}</pre><p style="margin-top: 0.5rem; font-size: 0.875rem;">💡 <strong>Dica:</strong> Verifique a sintaxe do diagrama no arquivo original.<a href="https://mermaid.js.org/intro/" target="_blank" style="color: var(--primary-color);">Documentação Mermaid</a></p></details></div>`;
                    }
                }
            } catch (error) {
                console.error('❌ Erro geral ao processar diagramas Mermaid:', error);
                mermaidElements.forEach(el => {
                    if (!el.querySelector('svg')) {
                        el.innerHTML = `<div class="mermaid-error" style="padding: 1rem; background: var(--error-bg, #fee); border: 1px solid var(--error-border, #fcc); border-radius: var(--border-radius, 4px); color: var(--error-text, #c33);"><i class="fas fa-exclamation-triangle"></i><p><strong>Erro ao processar diagrama Mermaid</strong></p><details style="margin-top: 0.5rem;"><summary style="cursor: pointer;">Ver detalhes</summary><pre style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(0,0,0,0.1); border-radius: 4px; font-size: 0.875rem; overflow-x: auto;">${this.escapeHtml(error.message || error.toString())}</pre></details></div>`;
                    }
                });
            }
        }

        // Renderiza diagramas PlantUML se existirem
        const plantumlElements = contentArea.querySelectorAll('.plantuml');
        if (plantumlElements.length > 0) {
            await this.renderPlantUMLDiagrams(plantumlElements);
        }

        // Oculta loading
        this.hideLoading();
    }
    /**
     * Renderiza diagramas PlantUML usando serviço externo
     */
    async renderPlantUMLDiagrams(plantumlElements) {
        for (const el of plantumlElements) {
            try {
                // Recupera o código do <pre> oculto
                const pre = el.querySelector('pre');
                const code = pre ? pre.textContent : el.textContent;
                if (!code || code.trim() === '') continue;

                // Codifica o código PlantUML para o serviço online
                const encoded = this.encodePlantUML(code);
                const imgUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`;

                // Cria o elemento de imagem SVG diretamente
                el.innerHTML = `<img src="${imgUrl}" alt="Diagrama PlantUML" style="max-width:100%;" loading="lazy">`;
            } catch (error) {
                el.innerHTML = `<div class="plantuml-error" style="padding:1rem;background:#fee;border:1px solid #fcc;border-radius:4px;color:#c33;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Erro ao renderizar PlantUML</strong>
                    <pre style="margin-top:0.5rem;padding:0.5rem;background:rgba(0,0,0,0.1);border-radius:4px;font-size:0.875rem;overflow-x:auto;">${this.escapeHtml(error.message || error.toString())}</pre>
                </div>`;
            }
        }
    }

    /**
     * Codifica o código PlantUML para URL (deflate + base64)
     * Utiliza algoritmo compatível com plantuml.com
     */
    encodePlantUML(text) {
        // Algoritmo compatível com PlantUML Server (plantuml-encoder)
        // https://github.com/plantuml/plantuml-encoder/blob/master/lib/encoder.js
        function encode6bit(b) {
            if (b < 10) return String.fromCharCode(48 + b);
            b -= 10;
            if (b < 26) return String.fromCharCode(65 + b);
            b -= 26;
            if (b < 26) return String.fromCharCode(97 + b);
            b -= 26;
            if (b === 0) return '-';
            if (b === 1) return '_';
            return '?';
        }
        function append3bytes(b1, b2, b3) {
            let c1 = b1 >> 2;
            let c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
            let c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
            let c4 = b3 & 0x3F;
            return '' + encode6bit(c1 & 0x3F) + encode6bit(c2 & 0x3F) + encode6bit(c3 & 0x3F) + encode6bit(c4 & 0x3F);
        }
        function encode64(data) {
            let r = '';
            for (let i = 0; i < data.length; i += 3) {
                if (i + 2 < data.length) {
                    r += append3bytes(data[i], data[i + 1], data[i + 2]);
                } else if (i + 1 < data.length) {
                    r += append3bytes(data[i], data[i + 1], 0);
                } else {
                    r += append3bytes(data[i], 0, 0);
                }
            }
            return r;
        }
        // Log do bloco PUML/PlantUML antes de comprimir
        if (window && window.console) {
            console.log('[PlantUML] Bloco a ser encriptado:', text);
        }
        let deflated;
        if (window.pako) {
            // Modo RAW DEFLATE (compatível com PlantUML Server)
            deflated = window.pako.deflate(text, { level: 9, raw: true });
            if (!(deflated instanceof Uint8Array)) {
                deflated = new Uint8Array(deflated);
            }
        } else {
            console.warn('pako.js não disponível, PlantUML pode não renderizar corretamente.');
            return '';
        }
        // Converte para array de números
        const byteArray = Array.from(deflated);
        return encode64(byteArray);
    }

    /**
     * Atualiza o título da página com o nome do arquivo atual
     */
    updateTitle(file) {
        document.title = file.name.replace('.md', '') + ' - Markdown Viewer';
    }

    /**
     * Atualiza o breadcrumb
     */
    updateBreadcrumb(file) {
        const breadcrumbList = document.getElementById('breadcrumb-list');
        if (!breadcrumbList) return;
        
        const breadcrumbs = window.fileManager?.getBreadcrumbPath(file.path) || [];
        
        breadcrumbList.innerHTML = '';
        
        breadcrumbs.forEach((crumb, index) => {
            const li = document.createElement('li');
            li.className = 'breadcrumb-item';
            li.textContent = crumb.name;
            
            if (index === breadcrumbs.length - 1) {
                li.classList.add('active');
            }
            
            breadcrumbList.appendChild(li);
        });
        
        // Adiciona o arquivo atual
        const fileLi = document.createElement('li');
        fileLi.className = 'breadcrumb-item active';
        fileLi.textContent = file.name.replace('.md', '');
        breadcrumbList.appendChild(fileLi);
    }
    
    /**
     * Adiciona eventos após renderização
     */
    addPostRenderEvents(container) {
        // Adiciona eventos para links internos
        const links = container.querySelectorAll('a[href$=".md"]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Aqui você poderia implementar navegação interna
                console.log('Navegação interna para:', link.href);
            });
        });
        
        // Adiciona copy button para blocos de código
        const codeBlocks = container.querySelectorAll('pre code');
        codeBlocks.forEach(this.addCopyButton.bind(this));
    }
    
    /**
     * Renderiza documentação Swagger
     */
    async renderSwaggerDocs(container) {
        const swaggerContainers = container.querySelectorAll('.swagger-container');
        
        if (swaggerContainers.length === 0) return;
        
        if (typeof SwaggerUIBundle === 'undefined') {
            console.error('❌ SwaggerUIBundle não está disponível');
            swaggerContainers.forEach(el => {
                el.innerHTML = `
                    <div class="swagger-error" style="
                        padding: 1rem;
                        background: var(--error-bg, #fee);
                        border: 1px solid var(--error-border, #fcc);
                        border-radius: var(--border-radius, 4px);
                        color: var(--error-text, #c33);
                    ">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Swagger UI não disponível</strong>
                        <p style="margin-top: 0.5rem; font-size: 0.875rem;">
                            Não foi possível carregar a biblioteca Swagger UI.
                        </p>
                    </div>
                `;
            });
            return;
        }
        
        console.log(`🔍 Encontrados ${swaggerContainers.length} blocos Swagger`);
        
        for (const swaggerContainer of swaggerContainers) {
            try {
                // Busca o <pre> dentro do container
                const preElement = swaggerContainer.querySelector('pre[data-swagger-spec]');
                
                if (!preElement) {
                    throw new Error('Elemento <pre> com especificação não encontrado');
                }
                
                const specData = preElement.textContent || preElement.innerText;
                
                if (!specData || !specData.trim()) {
                    throw new Error('Especificação Swagger vazia');
                }
                
                console.log('📄 Dados da especificação:', specData.substring(0, 200) + '...');
                
                // Os dados já estão desescapados pelo browser ao ler textContent
                const unescapedData = specData.trim();
                
                // Parse do JSON ou YAML
                let spec;
                let specUrl;
                
                try {
                    // Tenta parsear como JSON
                    spec = JSON.parse(unescapedData);
                    console.log('✅ Parsed como JSON:', spec);
                } catch (jsonError) {
                    console.log('❌ Não é JSON válido, usando spec como string YAML...');
                    // Para YAML, vamos criar um blob URL e deixar o Swagger UI parsear
                    const blob = new Blob([unescapedData], { type: 'text/yaml' });
                    specUrl = URL.createObjectURL(blob);
                    console.log('📋 Criado blob URL para YAML:', specUrl);
                }
                
                // Se não temos spec como objeto nem URL, erro
                if (!spec && !specUrl) {
                    throw new Error('Especificação inválida - não foi possível parsear');
                }
                
                // Se temos spec como objeto, valida campos obrigatórios
                if (spec && (!spec.openapi && !spec.swagger)) {
                    throw new Error('Especificação deve conter campo "openapi" ou "swagger"');
                }
                
                // Configuração base do Swagger UI
                const swaggerConfig = {
                    dom_id: `#${swaggerContainer.id}`,
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIBundle.SwaggerUIStandalonePreset
                    ],
                    plugins: [
                        SwaggerUIBundle.plugins.DownloadUrl
                    ],
                    layout: "BaseLayout",
                    defaultModelsExpandDepth: 1,
                    defaultModelExpandDepth: 1,
                    docExpansion: "list",
                    filter: true,
                    showRequestHeaders: true,
                    syntaxHighlight: {
                        activate: true,
                        theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'monokai' : 'agate'
                    }
                };
                
                // Adiciona spec ou url dependendo do que temos
                if (spec) {
                    swaggerConfig.spec = spec;
                } else if (specUrl) {
                    swaggerConfig.url = specUrl;
                }
                
                // Inicializa o Swagger UI
                SwaggerUIBundle(swaggerConfig);
                
                console.log(`✅ Swagger UI renderizado: ${swaggerContainer.id}`);
                
            } catch (error) {
                console.error('❌ Erro ao renderizar Swagger:', error);
                swaggerContainer.innerHTML = `
                    <div class="swagger-error" style="
                        padding: 1rem;
                        background: var(--error-bg, #fee);
                        border: 1px solid var(--error-border, #fcc);
                        border-radius: var(--border-radius, 4px);
                        color: var(--error-text, #c33);
                    ">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Erro ao renderizar Swagger</strong>
                        <details style="margin-top: 0.5rem;">
                            <summary style="cursor: pointer;">Ver detalhes</summary>
                            <pre style="
                                margin-top: 0.5rem;
                                padding: 0.5rem;
                                background: rgba(0,0,0,0.1);
                                border-radius: 4px;
                                font-size: 0.875rem;
                                overflow-x: auto;
                                white-space: pre-wrap;
                                word-wrap: break-word;
                            ">${this.escapeHtml(error.message || error.toString())}</pre>
                            <p style="margin-top: 0.5rem; font-size: 0.875rem;">
                                💡 <strong>Dica:</strong> Verifique se a especificação está em formato JSON ou YAML válido.
                            </p>
                        </details>
                    </div>
                `;
            }
        }
    }
    
    /**
     * Parser simples de YAML para objeto JavaScript (suporta apenas estruturas básicas)
     */
    parseSimpleYaml(yamlStr) {
        const lines = yamlStr.split('\n');
        const result = {};
        const stack = [{ obj: result, indent: -1 }];
        
        for (let line of lines) {
            // Remove comentários
            line = line.replace(/#.*$/, '').trimEnd();
            if (!line.trim()) continue;
            
            const indent = line.search(/\S/);
            const trimmed = line.trim();
            
            // Ajusta a pilha baseado na indentação
            while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
                stack.pop();
            }
            
            const current = stack[stack.length - 1].obj;
            
            if (trimmed.includes(':')) {
                const [key, ...valueParts] = trimmed.split(':');
                const value = valueParts.join(':').trim();
                const cleanKey = key.trim().replace(/^-\s*/, '');
                
                if (value) {
                    // Valor inline
                    let parsedValue = value;
                    if (value === 'true') parsedValue = true;
                    else if (value === 'false') parsedValue = false;
                    else if (!isNaN(value) && value !== '') parsedValue = Number(value);
                    else if (value.startsWith("'") || value.startsWith('"')) {
                        parsedValue = value.slice(1, -1);
                    }
                    current[cleanKey] = parsedValue;
                } else {
                    // Objeto aninhado
                    current[cleanKey] = {};
                    stack.push({ obj: current[cleanKey], indent });
                }
            } else if (trimmed.startsWith('-')) {
                // Item de array
                const value = trimmed.substring(1).trim();
                if (!Array.isArray(current)) {
                    // Converte para array se necessário
                    const lastKey = Object.keys(stack[stack.length - 2].obj).pop();
                    stack[stack.length - 2].obj[lastKey] = [current];
                }
            }
        }
        
        return result;
    }
    
    /**
     * Re-renderiza todos os diagramas Mermaid na página
     */
    async rerenderMermaidDiagrams() {
        const contentArea = document.getElementById('content-display');
        if (!contentArea || typeof mermaid === 'undefined') return;
        
        const mermaidElements = contentArea.querySelectorAll('.mermaid');
        if (mermaidElements.length === 0) return;
        
        console.log('Re-renderizando diagramas Mermaid devido à mudança de tema...');
        
        // Remove os SVGs existentes e restaura o texto original
        mermaidElements.forEach(el => {
            const svg = el.querySelector('svg');
            if (svg) {
                // Guarda o código original se existir
                const originalCode = el.getAttribute('data-original-code');
                if (originalCode) {
                    el.innerHTML = originalCode;
                }
            }
        });
        
        // Renderiza novamente
        try {
            await mermaid.run({ nodes: mermaidElements });
            console.log('✅ Diagramas re-renderizados com sucesso');
        } catch (error) {
            console.error('❌ Erro ao re-renderizar diagramas:', error);
        }
    }
    
    /**
     * Adiciona botão de zoom para diagramas Mermaid
     */
    addMermaidZoomButton(mermaidElement) {
        // Verifica se já tem botão
        const existingButton = mermaidElement.parentElement?.querySelector('.mermaid-zoom-button');
        if (existingButton) return;
        
        // Verifica se tem um SVG renderizado
        const svg = mermaidElement.querySelector('svg');
        if (!svg) return;
        
        // Cria container se não existir
        let container = mermaidElement.parentElement;
        if (!container?.classList.contains('mermaid-container')) {
            const newContainer = document.createElement('div');
            newContainer.className = 'mermaid-container';
            mermaidElement.parentNode.insertBefore(newContainer, mermaidElement);
            newContainer.appendChild(mermaidElement);
            container = newContainer;
        }
        
        const zoomButton = document.createElement('button');
        zoomButton.className = 'mermaid-zoom-button';
        zoomButton.innerHTML = '<i class="fas fa-expand"></i>';
        zoomButton.title = 'Ampliar diagrama';
        zoomButton.setAttribute('aria-label', 'Ampliar diagrama');
        
        zoomButton.addEventListener('click', () => {
            this.openMermaidModal(mermaidElement);
        });
        
        container.appendChild(zoomButton);
    }
    
    /**
     * Abre modal com diagrama Mermaid em tamanho grande
     */
    openMermaidModal(mermaidElement) {
    // Estado do zoom - inicia em 100% para diagramas padrão
    let currentZoom = 1;
        const minZoom = 0.5;
        const maxZoom = 10;
        
        // Encontra todos os diagramas Mermaid na página
        const contentArea = document.getElementById('content-display');
        const allMermaidElements = Array.from(contentArea.querySelectorAll('.mermaid'));
        const currentIndex = allMermaidElements.indexOf(mermaidElement);
        const totalDiagrams = allMermaidElements.length;
        
        // Criar modal
        const modal = document.createElement('div');
        modal.className = 'mermaid-modal';
        modal.innerHTML = `
            <div class="mermaid-modal-content">
                <div class="mermaid-modal-header">
                    <h3>Diagrama <span class="diagram-counter">${currentIndex + 1} de ${totalDiagrams}</span></h3>
                    <div class="mermaid-modal-controls">
                        <button class="mermaid-nav-btn" data-action="prev" title="Diagrama anterior (←)" ${currentIndex === 0 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="mermaid-nav-btn" data-action="next" title="Próximo diagrama (→)" ${currentIndex === totalDiagrams - 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="divider"></div>
                        <button class="mermaid-zoom-btn" data-action="zoom-out" title="Diminuir zoom (Ctrl + -)">
                            <i class="fas fa-search-minus"></i>
                        </button>
                        <span class="mermaid-zoom-level">100%</span>
                        <button class="mermaid-zoom-btn" data-action="zoom-in" title="Aumentar zoom (Ctrl + +)">
                            <i class="fas fa-search-plus"></i>
                        </button>
                        <button class="mermaid-zoom-btn" data-action="zoom-reset" title="Resetar zoom (Ctrl + 0)">
                            <i class="fas fa-compress"></i>
                        </button>
                        <button class="mermaid-zoom-btn" data-action="fullscreen" title="Tela cheia (F)">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="mermaid-modal-close" title="Fechar (ESC)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="mermaid-modal-body">
                    <div class="mermaid-modal-diagram-wrapper">
                        ${mermaidElement.outerHTML}
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar ao DOM
        document.body.appendChild(modal);
        
        // Referências
        const diagramWrapper = modal.querySelector('.mermaid-modal-diagram-wrapper');
        const zoomLevel = modal.querySelector('.mermaid-zoom-level');
        const content = modal.querySelector('.mermaid-modal-content');
        const diagramCounter = modal.querySelector('.diagram-counter');
        const prevBtn = modal.querySelector('[data-action="prev"]');
        const nextBtn = modal.querySelector('[data-action="next"]');
        
        // Variável para rastrear o índice atual
        let currentDiagramIndex = currentIndex;
        
        // Função para atualizar o diagrama exibido
        const updateDiagram = (index) => {
            if (index < 0 || index >= totalDiagrams) return;
            
            currentDiagramIndex = index;
            const newMermaidElement = allMermaidElements[index];
            
            // Atualiza o conteúdo do diagrama
            diagramWrapper.innerHTML = newMermaidElement.outerHTML;
            
            // Atualiza o contador
            diagramCounter.textContent = `${index + 1} de ${totalDiagrams}`;
            
            // Atualiza os botões de navegação
            prevBtn.disabled = index === 0;
            nextBtn.disabled = index === totalDiagrams - 1;
            
            // Reseta o zoom
            updateZoom(2);
            
            // Reseta a posição do scroll
            const modalBody = modal.querySelector('.mermaid-modal-body');
            if (modalBody) {
                modalBody.scrollLeft = 0;
                modalBody.scrollTop = 0;
            }
        };
        
        // Função para calcular o passo de zoom baseado no nível atual
        const getZoomStep = (zoom) => {
            if (zoom < 2) {
                return 0.5; // 50% de incremento até 200%
            } else {
                return 1; // 100% de incremento de 200% até 1000%
            }
        };
        
        // Função para atualizar zoom
        const updateZoom = (newZoom) => {
            currentZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
            diagramWrapper.style.transform = `scale(${currentZoom})`;
            zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
        };
        
        // Botões de navegação entre diagramas
        prevBtn.addEventListener('click', () => {
            updateDiagram(currentDiagramIndex - 1);
        });
        
        nextBtn.addEventListener('click', () => {
            updateDiagram(currentDiagramIndex + 1);
        });
        
        // Botões de zoom
        modal.querySelector('[data-action="zoom-in"]').addEventListener('click', () => {
            const step = getZoomStep(currentZoom);
            updateZoom(currentZoom + step);
        });
        
        modal.querySelector('[data-action="zoom-out"]').addEventListener('click', () => {
            const step = getZoomStep(currentZoom - 0.1); // Usa o nível anterior para calcular
            updateZoom(currentZoom - step);
        });
        
        modal.querySelector('[data-action="zoom-reset"]').addEventListener('click', () => {
            updateZoom(1);
        });
        
        modal.querySelector('[data-action="fullscreen"]').addEventListener('click', () => {
            if (!document.fullscreenElement) {
                content.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });
        
        // Fechar modal
        const closeModal = () => {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
            modal.remove();
            document.removeEventListener('keydown', handleKeyboard);
        };
        
        modal.querySelector('.mermaid-modal-close').addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Atalhos de teclado
        const handleKeyboard = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (currentDiagramIndex > 0) {
                    updateDiagram(currentDiagramIndex - 1);
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (currentDiagramIndex < totalDiagrams - 1) {
                    updateDiagram(currentDiagramIndex + 1);
                }
            } else if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                modal.querySelector('[data-action="fullscreen"]').click();
            } else if (e.ctrlKey || e.metaKey) {
                if (e.key === '+' || e.key === '=') {
                    e.preventDefault();
                    const step = getZoomStep(currentZoom);
                    updateZoom(currentZoom + step);
                } else if (e.key === '-') {
                    e.preventDefault();
                    const step = getZoomStep(currentZoom - 0.1);
                    updateZoom(currentZoom - step);
                } else if (e.key === '0') {
                    e.preventDefault();
                    updateZoom(2);
                }
            }
        };
        document.addEventListener('keydown', handleKeyboard);
        
        // Garante que o scroll comece no topo (0,0)
        setTimeout(() => {
            modalBody.scrollLeft = 0;
            modalBody.scrollTop = 0;
        }, 100);
        
        // Zoom com scroll do mouse
        diagramWrapper.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const step = getZoomStep(currentZoom);
                const delta = e.deltaY > 0 ? -step : step;
                updateZoom(currentZoom + delta);
            }
        });
        
        // Drag para mover o diagrama
        const modalBody = modal.querySelector('.mermaid-modal-body');
        let isDragging = false;
        let startX, startY, scrollLeft, scrollTop;
        
        modalBody.addEventListener('mousedown', (e) => {
            // Não ativar drag se clicar em botões ou SVG interativo
            if (e.target.closest('button') || e.target.closest('a')) return;
            
            isDragging = true;
            modalBody.style.cursor = 'grabbing';
            modalBody.style.userSelect = 'none';
            
            startX = e.pageX - modalBody.offsetLeft;
            startY = e.pageY - modalBody.offsetTop;
            scrollLeft = modalBody.scrollLeft;
            scrollTop = modalBody.scrollTop;
        });
        
        modalBody.addEventListener('mouseleave', () => {
            isDragging = false;
            modalBody.style.cursor = 'grab';
            modalBody.style.userSelect = '';
        });
        
        modalBody.addEventListener('mouseup', () => {
            isDragging = false;
            modalBody.style.cursor = 'grab';
            modalBody.style.userSelect = '';
        });
        
        modalBody.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const x = e.pageX - modalBody.offsetLeft;
            const y = e.pageY - modalBody.offsetTop;
            const walkX = (x - startX) * 1.5; // Multiplicador para tornar o drag mais responsivo
            const walkY = (y - startY) * 1.5;
            
            modalBody.scrollLeft = scrollLeft - walkX;
            modalBody.scrollTop = scrollTop - walkY;
        });
        
        // Touch support para mobile
        let touchStartX, touchStartY;
        
        modalBody.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].pageX - modalBody.offsetLeft;
                touchStartY = e.touches[0].pageY - modalBody.offsetTop;
                scrollLeft = modalBody.scrollLeft;
                scrollTop = modalBody.scrollTop;
            }
        });
        
        modalBody.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                e.preventDefault();
                const x = e.touches[0].pageX - modalBody.offsetLeft;
                const y = e.touches[0].pageY - modalBody.offsetTop;
                const walkX = (x - touchStartX) * 1.5;
                const walkY = (y - touchStartY) * 1.5;
                
                modalBody.scrollLeft = scrollLeft - walkX;
                modalBody.scrollTop = scrollTop - walkY;
            }
        });
    }
    
    /**
     * Adiciona botão de copiar para blocos de código
     */
    addCopyButton(codeElement) {
        const pre = codeElement.parentElement;
        if (pre.querySelector('.copy-button')) return; // Já tem botão
        
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.innerHTML = '<i class="fas fa-copy"></i>';
        button.title = 'Copiar código';
        
        button.addEventListener('click', () => {
            navigator.clipboard.writeText(codeElement.textContent).then(() => {
                button.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            });
        });
        
        pre.style.position = 'relative';
        pre.appendChild(button);
    }
    
    /**
     * Mostra estado de carregamento
     */
    showLoading() {
        const contentDisplay = document.getElementById('content-display');
        if (contentDisplay) {
            contentDisplay.innerHTML = `
                <div class="loading-state" style="display: flex; align-items: center; justify-content: center; min-height: 200px; color: var(--text-muted);">
                    <i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem; font-size: 1.5rem;"></i>
                    Carregando conteúdo...
                </div>
            `;
        }
    }
    
    /**
     * Oculta o estado de carregamento
     */
    hideLoading() {
        const loadingElement = document.querySelector('.loading-state');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    /**
     * Mostra mensagem de erro
     */
    showError(message) {
        const contentDisplay = document.getElementById('content-display');
        if (contentDisplay) {
            contentDisplay.innerHTML = `
                <div class="error-state" style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: #ef4444;"></i>
                    <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Ops! Algo deu errado</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Recarregar página
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Realça todos os blocos de código no conteúdo exibido
     */
    highlightAll() {
        // Verifica se hljs está disponível
        if (typeof hljs === 'undefined') {
            // Tenta novamente após um pequeno delay
            if (!this.highlightRetryCount) {
                this.highlightRetryCount = 0;
            }
            
            if (this.highlightRetryCount < 5) {
                this.highlightRetryCount++;
                console.log(`⏳ Aguardando Highlight.js carregar... (tentativa ${this.highlightRetryCount}/5)`);
                setTimeout(() => this.highlightAll(), 200);
                return;
            }
            
            if (!this.highlightWarningShown) {
                console.error('❌ Highlight.js não foi carregado após 5 tentativas. Verifique a conexão com a CDN.');
                this.highlightWarningShown = true;
            }
            
            // Mesmo sem highlight, adiciona números de linha
            const codeBlocks = document.querySelectorAll('pre code');
            codeBlocks.forEach((block) => {
                this.addLineNumbers(block);
            });
            return;
        }
        
        console.log('✅ Highlight.js disponível, aplicando syntax highlighting...');
        
        const codeBlocks = document.querySelectorAll('pre code');
        codeBlocks.forEach((block) => {
            // Remove classes anteriores se existirem
            block.className = block.className.replace(/\bhljs\b/g, '').trim();
            
            try {
                // Aplica highlight
                hljs.highlightElement(block);
                
                // Aplica números de linha com o plugin
                if (typeof hljs.lineNumbersBlock === 'function') {
                    hljs.lineNumbersBlock(block);
                }
            } catch (error) {
                console.error('Erro ao aplicar highlight:', error);
            }
        });
        
        console.log('✅ Syntax highlighting e números de linha aplicados');
    }

    /**
     * Valida se a linguagem é válida
     */
    isValidLanguage(language) {
        const validLanguages = [
            'javascript', 'js', 'typescript', 'ts', 'html', 'css', 'python', 'java',
            'cpp', 'c', 'php', 'ruby', 'go', 'rust', 'kotlin', 'swift', 'bash',
            'shell', 'json', 'xml', 'yaml', 'yml', 'markdown', 'md', 'sql', 'mermaid'
        ];
        return validLanguages.includes(language.toLowerCase());
    }
    
    /**
     * Escapa HTML para evitar XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Limpa o cache
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * Obtém estatísticas do cache
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Torna a classe disponível globalmente
window.MarkdownProcessor = MarkdownProcessor;
