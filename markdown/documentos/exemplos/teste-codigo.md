# Teste de Código - Markdown Viewer

Este documento demonstra o syntax highlighting para várias linguagens de programação.

## JavaScript

### Exemplo Básico

```javascript
// Função para calcular fibonacci
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
```

### Exemplo com Classes ES6

```javascript
class Usuario {
    constructor(nome, email) {
        this.nome = nome;
        this.email = email;
        this.ativo = true;
    }

    // Método para desativar usuário
    desativar() {
        this.ativo = false;
        console.log(`${this.nome} foi desativado`);
    }

    // Getter para informações
    get info() {
        return `${this.nome} (${this.email}) - ${this.ativo ? 'Ativo' : 'Inativo'}`;
    }
}

const usuario = new Usuario('João Silva', 'joao@example.com');
console.log(usuario.info);
```

### Exemplo Assíncrono

```javascript
// Função async/await
async function buscarDados(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        throw error;
    }
}

// Uso com Promise
buscarDados('https://api.example.com/dados')
    .then(data => console.log(data))
    .catch(error => console.error(error));
```

## Python

### Exemplo Básico

```python
# Função para calcular fatorial
def fatorial(n):
    if n == 0 or n == 1:
        return 1
    return n * fatorial(n - 1)

print(f"Fatorial de 5: {fatorial(5)}")  # 120
```

### Exemplo com Classes

```python
class Pessoa:
    def __init__(self, nome, idade):
        self.nome = nome
        self.idade = idade
    
    def apresentar(self):
        return f"Olá, meu nome é {self.nome} e tenho {self.idade} anos."
    
    @property
    def e_maior_idade(self):
        return self.idade >= 18

# Criando instância
pessoa = Pessoa("Maria", 25)
print(pessoa.apresentar())
print(f"Maior de idade: {pessoa.e_maior_idade}")
```

### Exemplo com List Comprehension

```python
# List comprehension
numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
pares = [n for n in numeros if n % 2 == 0]
quadrados = [n**2 for n in numeros]

print(f"Números pares: {pares}")
print(f"Quadrados: {quadrados}")

# Dictionary comprehension
quadrados_dict = {n: n**2 for n in numeros}
print(f"Dicionário de quadrados: {quadrados_dict}")
```

## Java

### Exemplo com Interface e Classe

```java
// Interface
public interface Calculadora {
    double calcular(double a, double b);
}

// Implementação
public class Soma implements Calculadora {
    @Override
    public double calcular(double a, double b) {
        return a + b;
    }
}

// Uso
public class Main {
    public static void main(String[] args) {
        Calculadora calc = new Soma();
        double resultado = calc.calcular(10, 20);
        System.out.println("Resultado: " + resultado);
    }
}
```

### Exemplo com Streams

```java
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class StreamExample {
    public static void main(String[] args) {
        List<Integer> numeros = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        
        // Filtrar números pares e multiplicar por 2
        List<Integer> resultado = numeros.stream()
            .filter(n -> n % 2 == 0)
            .map(n -> n * 2)
            .collect(Collectors.toList());
        
        System.out.println("Resultado: " + resultado);
    }
}
```

## TypeScript

### Exemplo com Tipos

```typescript
// Definindo tipos
interface Usuario {
    id: number;
    nome: string;
    email: string;
    ativo?: boolean;
}

// Função com tipos
function criarUsuario(nome: string, email: string): Usuario {
    return {
        id: Math.floor(Math.random() * 1000),
        nome,
        email,
        ativo: true
    };
}

// Generics
function primeiroElemento<T>(arr: T[]): T | undefined {
    return arr[0];
}

const numeros = [1, 2, 3];
const primeiro = primeiroElemento(numeros); // tipo: number | undefined
```

## SQL

### Exemplo de Queries

```sql
-- Criar tabela
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados
INSERT INTO usuarios (nome, email) 
VALUES ('João Silva', 'joao@example.com');

-- Selecionar com JOIN
SELECT u.nome, p.titulo, p.conteudo
FROM usuarios u
INNER JOIN posts p ON u.id = p.usuario_id
WHERE u.ativo = TRUE
ORDER BY p.data_criacao DESC
LIMIT 10;

-- Atualizar
UPDATE usuarios 
SET ativo = FALSE 
WHERE data_ultimo_acesso < DATE_SUB(NOW(), INTERVAL 6 MONTH);
```

## CSS

### Exemplo com Variáveis e Grid

```css
/* Variáveis CSS */
:root {
    --primary-color: #3498db;
    --secondary-color: #2ecc71;
    --text-color: #333;
    --spacing: 1rem;
}

/* Grid Layout */
.container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing);
    padding: var(--spacing);
}

/* Flexbox */
.card {
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Media Query */
@media (max-width: 768px) {
    .container {
        grid-template-columns: 1fr;
    }
}
```

## JSON

### Exemplo de Configuração

```json
{
  "nome": "Markdown Viewer",
  "versao": "2.4.2",
  "descricao": "Visualizador de Markdown com suporte a Mermaid",
  "autor": {
    "nome": "dmends",
    "github": "https://github.com/dmends"
  },
  "dependencias": {
    "marked": "^9.0.0",
    "mermaid": "^10.6.1",
    "highlight.js": "^11.9.0",
    "html2pdf.js": "^0.10.1"
  },
  "funcionalidades": [
    "Renderização Markdown",
    "Diagramas Mermaid",
    "Syntax Highlighting",
    "Exportação PDF",
    "Temas (claro/escuro)"
  ]
}
```

## HTML

### Exemplo Semântico

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exemplo HTML5</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <nav>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#sobre">Sobre</a></li>
                <li><a href="#contato">Contato</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <article>
            <h1>Título do Artigo</h1>
            <section>
                <p>Conteúdo do artigo...</p>
            </section>
        </article>
    </main>
    
    <footer>
        <p>&copy; 2025 Todos os direitos reservados</p>
    </footer>
</body>
</html>
```

## Bash

### Exemplo de Scripts

```bash
#!/bin/bash

# Variáveis
NOME="Markdown Viewer"
VERSAO="2.4.2"

# Função
function saudar() {
    echo "Olá, $1!"
}

# Condicionais
if [ -f "package.json" ]; then
    echo "Arquivo package.json encontrado"
else
    echo "Arquivo package.json não encontrado"
fi

# Loop
for arquivo in *.md; do
    echo "Processando: $arquivo"
    # Processar arquivo
done

# Array
arquivos=("teste-simples.md" "teste-codigo.md" "teste-mermaid.md")
for arquivo in "${arquivos[@]}"; do
    echo "Arquivo: $arquivo"
done
```

## Conclusão

Este documento demonstrou o syntax highlighting para diversas linguagens de programação suportadas pelo Markdown Viewer.

### Linguagens Demonstradas

- ✅ JavaScript (ES6+)
- ✅ Python
- ✅ Java
- ✅ TypeScript
- ✅ SQL
- ✅ CSS
- ✅ JSON
- ✅ HTML
- ✅ Bash

---

**Dica:** O Highlight.js suporta mais de 190 linguagens! Experimente com outras linguagens como Ruby, PHP, Go, Rust, etc.
