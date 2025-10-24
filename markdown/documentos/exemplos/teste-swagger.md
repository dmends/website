# Teste de Swagger/OpenAPI - Markdown Viewer

Este documento demonstra a renderização de especificações OpenAPI/Swagger tanto em formato YAML quanto JSON.

## Exemplo 1: API de E-commerce (YAML)

Especificação completa de uma API REST para e-commerce com autenticação, CRUD de produtos, carrinho e pedidos.

```swagger
openapi: 3.0.3
info:
  title: E-commerce API
  version: 2.1.0
  description: |
    API REST completa para gerenciamento de e-commerce.
    
    **Funcionalidades:**
    - Autenticação JWT
    - Gestão de produtos e categorias
    - Carrinho de compras
    - Processamento de pedidos
    - Gestão de usuários
  contact:
    name: Suporte API
    email: api@ecommerce.com
    url: https://ecommerce.com/support
  license:
    name: Apache 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0.html

servers:
  - url: https://api.ecommerce.com/v2
    description: Servidor de Produção
  - url: https://staging-api.ecommerce.com/v2
    description: Servidor de Staging
  - url: http://localhost:3000/v2
    description: Desenvolvimento Local

tags:
  - name: Auth
    description: Operações de autenticação e autorização
  - name: Products
    description: Gestão de produtos
  - name: Categories
    description: Gestão de categorias
  - name: Cart
    description: Carrinho de compras
  - name: Orders
    description: Pedidos e checkout
  - name: Users
    description: Gestão de usuários

paths:
  /auth/login:
    post:
      tags:
        - Auth
      summary: Login de usuário
      description: Autentica um usuário e retorna um token JWT
      operationId: login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                  format: email
                  example: user@example.com
                password:
                  type: string
                  format: password
                  example: senha123
      responses:
        '200':
          description: Login realizado com sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '401':
          description: Credenciais inválidas
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /auth/register:
    post:
      tags:
        - Auth
      summary: Registro de novo usuário
      description: Cria uma nova conta de usuário
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserRegistration'
      responses:
        '201':
          description: Usuário criado com sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: Dados inválidos
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /products:
    get:
      tags:
        - Products
      summary: Lista todos os produtos
      description: Retorna uma lista paginada de produtos com filtros opcionais
      parameters:
        - name: page
          in: query
          description: Número da página
          schema:
            type: integer
            default: 1
            minimum: 1
        - name: limit
          in: query
          description: Itens por página
          schema:
            type: integer
            default: 20
            minimum: 1
            maximum: 100
        - name: category
          in: query
          description: Filtrar por categoria
          schema:
            type: string
        - name: minPrice
          in: query
          description: Preço mínimo
          schema:
            type: number
            format: float
        - name: maxPrice
          in: query
          description: Preço máximo
          schema:
            type: number
            format: float
        - name: search
          in: query
          description: Busca por nome ou descrição
          schema:
            type: string
      responses:
        '200':
          description: Lista de produtos
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Product'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
    
    post:
      tags:
        - Products
      summary: Cria um novo produto
      description: Adiciona um novo produto ao catálogo (requer autenticação de admin)
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductInput'
      responses:
        '201':
          description: Produto criado com sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'

  /products/{productId}:
    get:
      tags:
        - Products
      summary: Obtém detalhes de um produto
      parameters:
        - $ref: '#/components/parameters/ProductId'
      responses:
        '200':
          description: Detalhes do produto
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'
        '404':
          $ref: '#/components/responses/NotFoundError'
    
    put:
      tags:
        - Products
      summary: Atualiza um produto
      security:
        - BearerAuth: []
      parameters:
        - $ref: '#/components/parameters/ProductId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductInput'
      responses:
        '200':
          description: Produto atualizado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'
    
    delete:
      tags:
        - Products
      summary: Remove um produto
      security:
        - BearerAuth: []
      parameters:
        - $ref: '#/components/parameters/ProductId'
      responses:
        '204':
          description: Produto removido com sucesso
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /cart:
    get:
      tags:
        - Cart
      summary: Obtém o carrinho do usuário
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Carrinho do usuário
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Cart'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
    
    post:
      tags:
        - Cart
      summary: Adiciona item ao carrinho
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - productId
                - quantity
              properties:
                productId:
                  type: string
                  format: uuid
                quantity:
                  type: integer
                  minimum: 1
      responses:
        '200':
          description: Item adicionado ao carrinho
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Cart'

  /orders:
    get:
      tags:
        - Orders
      summary: Lista pedidos do usuário
      security:
        - BearerAuth: []
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [pending, processing, shipped, delivered, cancelled]
      responses:
        '200':
          description: Lista de pedidos
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Order'
    
    post:
      tags:
        - Orders
      summary: Cria um novo pedido (checkout)
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OrderInput'
      responses:
        '201':
          description: Pedido criado com sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  parameters:
    ProductId:
      name: productId
      in: path
      required: true
      description: ID único do produto
      schema:
        type: string
        format: uuid

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        role:
          type: string
          enum: [customer, admin]
        createdAt:
          type: string
          format: date-time

    UserRegistration:
      type: object
      required:
        - email
        - password
        - name
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          format: password
          minLength: 8
        name:
          type: string
          minLength: 2

    AuthResponse:
      type: object
      properties:
        token:
          type: string
          description: JWT token
        user:
          $ref: '#/components/schemas/User'
        expiresIn:
          type: integer
          description: Token expiration time in seconds

    Product:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        price:
          type: number
          format: float
        category:
          type: string
        imageUrl:
          type: string
          format: uri
        stock:
          type: integer
        rating:
          type: number
          format: float
          minimum: 0
          maximum: 5
        createdAt:
          type: string
          format: date-time

    ProductInput:
      type: object
      required:
        - name
        - price
        - category
      properties:
        name:
          type: string
        description:
          type: string
        price:
          type: number
          format: float
          minimum: 0
        category:
          type: string
        imageUrl:
          type: string
          format: uri
        stock:
          type: integer
          minimum: 0

    Cart:
      type: object
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        items:
          type: array
          items:
            $ref: '#/components/schemas/CartItem'
        total:
          type: number
          format: float

    CartItem:
      type: object
      properties:
        productId:
          type: string
          format: uuid
        product:
          $ref: '#/components/schemas/Product'
        quantity:
          type: integer
        subtotal:
          type: number
          format: float

    Order:
      type: object
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        items:
          type: array
          items:
            $ref: '#/components/schemas/OrderItem'
        total:
          type: number
          format: float
        status:
          type: string
          enum: [pending, processing, shipped, delivered, cancelled]
        shippingAddress:
          $ref: '#/components/schemas/Address'
        createdAt:
          type: string
          format: date-time

    OrderItem:
      type: object
      properties:
        productId:
          type: string
        productName:
          type: string
        quantity:
          type: integer
        price:
          type: number
          format: float
        subtotal:
          type: number
          format: float

    OrderInput:
      type: object
      required:
        - shippingAddress
        - paymentMethod
      properties:
        shippingAddress:
          $ref: '#/components/schemas/Address'
        paymentMethod:
          type: string
          enum: [credit_card, debit_card, pix, boleto]

    Address:
      type: object
      required:
        - street
        - city
        - state
        - zipCode
      properties:
        street:
          type: string
        number:
          type: string
        complement:
          type: string
        city:
          type: string
        state:
          type: string
        zipCode:
          type: string

    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        totalPages:
          type: integer

    Error:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
        details:
          type: array
          items:
            type: object

  responses:
    UnauthorizedError:
      description: Token de autenticação ausente ou inválido
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    ForbiddenError:
      description: Sem permissão para acessar este recurso
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    NotFoundError:
      description: Recurso não encontrado
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
```

---

## Exemplo 2: API de Blog (JSON)

Especificação em formato JSON para uma API de blog com posts, comentários e usuários.

```swagger
{
  "openapi": "3.0.3",
  "info": {
    "title": "Blog API",
    "version": "1.5.0",
    "description": "API REST para plataforma de blog com posts, comentários, tags e gestão de usuários.\n\n**Recursos:**\n- CRUD de posts com Markdown\n- Sistema de comentários aninhados\n- Tags e categorias\n- Sistema de likes\n- Upload de imagens\n- Busca full-text",
    "contact": {
      "name": "Dev Team",
      "email": "dev@blog.com"
    }
  },
  "servers": [
    {
      "url": "https://api.blog.com/v1",
      "description": "Produção"
    },
    {
      "url": "https://dev-api.blog.com/v1",
      "description": "Desenvolvimento"
    }
  ],
  "tags": [
    {
      "name": "Posts",
      "description": "Operações com posts do blog"
    },
    {
      "name": "Comments",
      "description": "Sistema de comentários"
    },
    {
      "name": "Tags",
      "description": "Gestão de tags"
    },
    {
      "name": "Authors",
      "description": "Informações de autores"
    }
  ],
  "paths": {
    "/posts": {
      "get": {
        "tags": ["Posts"],
        "summary": "Lista todos os posts",
        "description": "Retorna posts publicados com paginação e filtros",
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "schema": {
              "type": "integer",
              "default": 1,
              "minimum": 1
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer",
              "default": 10,
              "minimum": 1,
              "maximum": 50
            }
          },
          {
            "name": "tag",
            "in": "query",
            "description": "Filtrar por tag",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "author",
            "in": "query",
            "description": "Filtrar por ID do autor",
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "search",
            "in": "query",
            "description": "Busca full-text no título e conteúdo",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Lista de posts",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "posts": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/Post"
                      }
                    },
                    "pagination": {
                      "$ref": "#/components/schemas/PaginationInfo"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": ["Posts"],
        "summary": "Cria um novo post",
        "security": [
          {
            "ApiKeyAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PostInput"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Post criado com sucesso",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Post"
                }
              }
            }
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          }
        }
      }
    },
    "/posts/{postId}": {
      "get": {
        "tags": ["Posts"],
        "summary": "Obtém um post específico",
        "parameters": [
          {
            "$ref": "#/components/parameters/PostId"
          }
        ],
        "responses": {
          "200": {
            "description": "Detalhes do post",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PostDetail"
                }
              }
            }
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          }
        }
      },
      "put": {
        "tags": ["Posts"],
        "summary": "Atualiza um post",
        "security": [
          {
            "ApiKeyAuth": []
          }
        ],
        "parameters": [
          {
            "$ref": "#/components/parameters/PostId"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PostInput"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Post atualizado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Post"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": ["Posts"],
        "summary": "Remove um post",
        "security": [
          {
            "ApiKeyAuth": []
          }
        ],
        "parameters": [
          {
            "$ref": "#/components/parameters/PostId"
          }
        ],
        "responses": {
          "204": {
            "description": "Post removido com sucesso"
          }
        }
      }
    },
    "/posts/{postId}/comments": {
      "get": {
        "tags": ["Comments"],
        "summary": "Lista comentários de um post",
        "parameters": [
          {
            "$ref": "#/components/parameters/PostId"
          }
        ],
        "responses": {
          "200": {
            "description": "Lista de comentários",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Comment"
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": ["Comments"],
        "summary": "Adiciona um comentário",
        "security": [
          {
            "ApiKeyAuth": []
          }
        ],
        "parameters": [
          {
            "$ref": "#/components/parameters/PostId"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CommentInput"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Comentário criado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Comment"
                }
              }
            }
          }
        }
      }
    },
    "/posts/{postId}/like": {
      "post": {
        "tags": ["Posts"],
        "summary": "Curte um post",
        "security": [
          {
            "ApiKeyAuth": []
          }
        ],
        "parameters": [
          {
            "$ref": "#/components/parameters/PostId"
          }
        ],
        "responses": {
          "200": {
            "description": "Like registrado",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "likes": {
                      "type": "integer"
                    },
                    "liked": {
                      "type": "boolean"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/tags": {
      "get": {
        "tags": ["Tags"],
        "summary": "Lista todas as tags",
        "responses": {
          "200": {
            "description": "Lista de tags",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Tag"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/authors/{authorId}": {
      "get": {
        "tags": ["Authors"],
        "summary": "Obtém perfil de um autor",
        "parameters": [
          {
            "name": "authorId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Perfil do autor",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Author"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "ApiKeyAuth": {
        "type": "apiKey",
        "in": "header",
        "name": "X-API-Key"
      }
    },
    "parameters": {
      "PostId": {
        "name": "postId",
        "in": "path",
        "required": true,
        "description": "ID único do post",
        "schema": {
          "type": "string",
          "format": "uuid"
        }
      }
    },
    "schemas": {
      "Post": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "title": {
            "type": "string"
          },
          "slug": {
            "type": "string"
          },
          "excerpt": {
            "type": "string",
            "description": "Resumo do post"
          },
          "coverImage": {
            "type": "string",
            "format": "uri"
          },
          "author": {
            "$ref": "#/components/schemas/Author"
          },
          "tags": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Tag"
            }
          },
          "publishedAt": {
            "type": "string",
            "format": "date-time"
          },
          "likes": {
            "type": "integer"
          },
          "commentsCount": {
            "type": "integer"
          }
        }
      },
      "PostDetail": {
        "allOf": [
          {
            "$ref": "#/components/schemas/Post"
          },
          {
            "type": "object",
            "properties": {
              "content": {
                "type": "string",
                "description": "Conteúdo completo em Markdown"
              },
              "readTime": {
                "type": "integer",
                "description": "Tempo de leitura estimado em minutos"
              }
            }
          }
        ]
      },
      "PostInput": {
        "type": "object",
        "required": ["title", "content"],
        "properties": {
          "title": {
            "type": "string",
            "minLength": 5,
            "maxLength": 200
          },
          "content": {
            "type": "string",
            "description": "Conteúdo em Markdown"
          },
          "excerpt": {
            "type": "string",
            "maxLength": 300
          },
          "coverImage": {
            "type": "string",
            "format": "uri"
          },
          "tags": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "published": {
            "type": "boolean",
            "default": false
          }
        }
      },
      "Author": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "username": {
            "type": "string"
          },
          "avatar": {
            "type": "string",
            "format": "uri"
          },
          "bio": {
            "type": "string"
          },
          "website": {
            "type": "string",
            "format": "uri"
          },
          "postsCount": {
            "type": "integer"
          }
        }
      },
      "Comment": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "content": {
            "type": "string"
          },
          "author": {
            "$ref": "#/components/schemas/Author"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "parentId": {
            "type": "string",
            "format": "uuid",
            "nullable": true,
            "description": "ID do comentário pai (para respostas)"
          },
          "replies": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Comment"
            }
          }
        }
      },
      "CommentInput": {
        "type": "object",
        "required": ["content"],
        "properties": {
          "content": {
            "type": "string",
            "minLength": 1,
            "maxLength": 1000
          },
          "parentId": {
            "type": "string",
            "format": "uuid",
            "description": "ID do comentário pai (para criar uma resposta)"
          }
        }
      },
      "Tag": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "name": {
            "type": "string"
          },
          "slug": {
            "type": "string"
          },
          "postsCount": {
            "type": "integer"
          }
        }
      },
      "PaginationInfo": {
        "type": "object",
        "properties": {
          "currentPage": {
            "type": "integer"
          },
          "totalPages": {
            "type": "integer"
          },
          "totalItems": {
            "type": "integer"
          },
          "itemsPerPage": {
            "type": "integer"
          }
        }
      },
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "error": {
            "type": "string"
          },
          "message": {
            "type": "string"
          },
          "statusCode": {
            "type": "integer"
          }
        }
      }
    },
    "responses": {
      "Unauthorized": {
        "description": "Autenticação necessária",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/ErrorResponse"
            }
          }
        }
      },
      "NotFound": {
        "description": "Recurso não encontrado",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/ErrorResponse"
            }
          }
        }
      }
    }
  }
}
```

---

## Comparação YAML vs JSON

### Vantagens do YAML:
- ✅ Mais legível e conciso
- ✅ Suporta comentários
- ✅ Menos verboso
- ✅ Ideal para documentação

### Vantagens do JSON:
- ✅ Mais fácil de parsear programaticamente
- ✅ Amplamente suportado
- ✅ Menos propenso a erros de indentação
- ✅ Melhor para geração automática

Ambos os formatos são totalmente compatíveis com o OpenAPI 3.0 e são renderizados perfeitamente pelo Swagger UI!

