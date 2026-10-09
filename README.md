# Vinícola Online — painel administrativo

Projeto didático usando Node.js, Express, EJS e SQLite.

## Como executar
1. Instale o Node.js (versão LTS).
2. Abra esta pasta no VS Code.
3. No terminal, execute `npm install`.
4. Execute `npm start`.
5. Acesse `http://localhost:3000/admin/index`.

O banco SQLite é criado automaticamente em `banco/ecommerce.db` quando o servidor inicia. Cadastre primeiro uma categoria e depois os vinhos. As fotos são opcionais e devem ter até 5 MB.

## Funcionalidades
- Cadastro, listagem, edição e exclusão de categorias.
- Cadastro, listagem, edição e exclusão de vinhos.
- Upload opcional de imagem, preço, estoque e descrição.

**Observação:** o formulário de login é demonstrativo e ainda não faz autenticação real; não use como segurança de produção.


## Dados demonstrativos da vinícola

Na primeira execução com banco vazio, o sistema cadastra automaticamente categorias e seis vinhos de exemplo. As imagens SVG são ilustrações locais incluídas em `public/uploads`. Preços, estoques e descrições são fictícios para demonstração. Regiões/países são informativos e podem ser editados no painel. Dados existentes não são apagados nem duplicados.
