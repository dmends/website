# Teste de Renderização PlantUML

Este arquivo serve para testar a renderização de diagramas PlantUML no Markdown Viewer.

## Exemplo de bloco PlantUML

```plantuml
@startuml
Alice -> Bob: Olá Bob!
Bob --> Alice: Olá Alice!
@enduml
```

## Exemplo de bloco plantuml C4_Context

```plantuml
@startuml
    !include <C4/C4_Deployment>

    Person(user, "Customer", "People that need products", $sprite="users")
    Container(spa, "SPA", "angular", "The main interface that the customer interacts with", $sprite="angular")
    Container(api, "API", "java", "Handles all business logic", $sprite="java")
    ContainerDb(db, "Database", "Microsoft SQL", "Holds product, order and invoice information", $sprite="msql_server")

    Rel(user, spa, "Uses", "https")
    Rel(spa, api, "Uses", "https")
    Rel_R(api, db, "Reads/Writes")
@enduml
```

Se o suporte estiver funcionando, o diagrama acima será renderizado como uma imagem SVG gerada pelo PlantUML Server.
