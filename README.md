# Resumer

Resumer é um aplicativo web que utiliza Inteligência Artificial para gerar resumos inteligentes de matérias jornalísticas a partir de URLs fornecidas. O sistema processa o conteúdo da página, remove imagens e outras informações desnecessárias, e então gera um resumo otimizado.

## Funcionalidades

- Inserção de URL de matérias jornalísticas
- Remoção de imagens e conteúdo irrelevante
- Resumo automatizado utilizando Inteligência Artificial
- Exibição do título, resumo e conteúdo processado
- Copy to clipboard

## Tecnologias Utilizadas

- **Next.js 14**: Framework de React para a criação da interface de usuário.
- **Tailwind CSS**: Utilizado para estilização da aplicação.
- **TypeScript**: Para tipagem estática no código.
- **Axios**: Para realizar requisições HTTP.
- **JSDOM**: Para manipulação de DOM no lado do servidor.
- **Mozilla Readability**: Para processar e extrair o conteúdo da página.
- **GOOGLE GEMINI 2.5 PRO**: IA usada para gerar o resumo das matérias.

## Estrutura do Projeto

- ```app/api/fetch-url-content/route.ts:```: Lida com a obtenção e processamento do conteúdo da URL.
- ```app/components/main-content.tsx:```: Componente principal que renderiza o formulário de entrada e exibe o conteúdo resumido.
- ```styles:```: Estilização da interface com Tailwind CSS.

## Futuras Implementações

- Integração com outras fontes de conteúdo além de URLs.
- Melhorar a exibição do resumo com formatação mais rica.
- Implementar suporte a múltiplos idiomas no resumo.

## Licença

Este projeto é licenciado sob a [Licença MIT](https://choosealicense.com/licenses/mit/)