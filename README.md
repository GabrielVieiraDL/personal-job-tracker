<h1 align="center">
  <br>
  Personal JobTracker 🎯
  <br>
</h1>

<h4 align="center">Uma aplicação Full-Stack serverless corporativa para gestão estratégica de candidaturas, integrada a Analytics e Business Intelligence.</h4>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/Middleware-Power_Automate-0078D4?style=for-the-badge&logo=powerautomate&logoColor=white">
  <img src="https://img.shields.io/badge/Database-Azure_SQL-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white">
  <img src="https://img.shields.io/badge/BI-Power_BI-F2C811?style=for-the-badge&logo=Power%20BI&logoColor=black">
</p>

<!-- ========================================== -->
<!-- 📸 IMAGEM 1: COLOQUE A FOTO DA TELA INICIAL (FORMULÁRIO) NESTE LINK ABAIXO -->
<!-- ========================================== -->
<p align="center">
  <img src="https://via.placeholder.com/800x400.png?text=Cole+o+link+da+sua+Screenshot+do+Site+Aqui" alt="Tela Inicial do Personal JobTracker" width="850">
</p>

<p align="center">
  <a href="#-sobre-o-projeto">Sobre</a> •
  <a href="#-arquitetura">Arquitetura</a> •
  <a href="#-features">Features</a> •
  <a href="#-tecnologias">Tecnologias</a> •
  <a href="#-power-bi-e-analytics">Power BI</a> •
  <a href="#-como-executar">Como Executar</a>
</p>

---

## 💡 Sobre o Projeto

O **Personal JobTracker** nasceu da necessidade de gerenciar o alto volume de aplicações em vagas de tecnologia de forma estruturada, saindo de planilhas convencionais para uma solução **API-First** guiada a dados. 

Projetado com princípios de **Clean Code** e **Separation of Concerns**, o sistema possui uma interface responsiva focada em UX (Glassmorphism e Dark Theme), enquanto o back-end roda de forma 100% serverless, utilizando gatilhos HTTP do Power Automate como API Gateway para interagir com procedures no Azure SQL. O consumo final dos dados é realizado por um Dashboard avançado em Power BI.

## 🏗️ Arquitetura

O ecossistema foi construído visando baixo custo de manutenção, alta disponibilidade e segurança, separando completamente a camada de apresentação, a regra de negócio e a camada de analytics.

```mermaid
graph LR
    A[Frontend SPA<br>Vanilla JS] -- Fetch API<br>(POST / GET) --> B((Power Automate<br>HTTP Webhooks))
    B -- Stored Procedures --> C[(Azure SQL Database)]
    C -- Retorna Payload JSON --> B
    B -- HTTP 200 OK --> A
    
    C -. Direct Query / Import .-> D[Dashboard<br>Power BI]
    
    style A fill:#0B1120,stroke:#00E5FF,stroke-width:2px,color:#F8FAFC
    style B fill:#0078D4,stroke:#005A9E,stroke-width:2px,color:#FFFFFF
    style C fill:#0089D6,stroke:#004578,stroke-width:2px,color:#FFFFFF
    style D fill:#F2C811,stroke:#D1A300,stroke-width:2px,color:#000000
```

## 📊 Power BI e Analytics

A aplicação conta com um modelo semântico rico lido nativamente pelo Power BI. O arquivo `.pbix` está disponível na pasta `/powerbi` deste repositório para consulta.

**Destaques do Dashboard:**
- Modelagem multidimensional (Star Schema) conectada diretamente ao Azure SQL.
- Truque de UX Avançado: Botão de **Modo Claro / Modo Escuro** (Dark/Light Theme toggle) integrado à navegação de bookmarks no report.
- Acompanhamento da taxa de conversão (Funil de Status) e volumetria por plataforma e tamanho de empresa.

<!-- ========================================== -->
<!-- 📸 IMAGEM 2: COLOQUE A FOTO DO SEU DASHBOARD DO POWER BI NESTE LINK ABAIXO -->
<!-- ========================================== -->
<p align="center">
  <img src="https://via.placeholder.com/800x400.png?text=Cole+o+link+da+sua+Screenshot+do+PowerBI+Aqui" alt="Dashboard do Power BI" width="850">
</p>

## ✨ Features do Web App

- **Padrão SPA (Single Page Application):** Navegação fluida via abas entre o formulário de cadastro e a dashboard de acompanhamento, sem recarregar a página.
- **Governança de Dados Front-End:**
  - Sistema de paginação assíncrona (Client-side) configurado para exibição limpa em grid.
  - Filtros dinâmicos cruzados: Busca por *Nome da Empresa* (Text-match) e *Status do Processo* (Dropdown).
- **Operações CRUD Assíncronas:**
  - **Create:** Cadastro de nova vaga com validação severa de DOM (Required Fields).
  - **Read:** Sincronização em tempo real de vagas ativas no banco.
  - **Update:** Mudança de etapa do processo seletivo via requisição `PATCH/POST` acionada diretamente de dentro do Card.
- **UI/UX Premium:** Design imersivo corporativo, suporte a Dark/Light Mode nativo, e plano de fundo tático interativo renderizado em SVG (Radar Tecnológico de SP).

<!-- ========================================== -->
<!-- 📸 IMAGEM 3: COLOQUE A FOTO DOS CARDS (PROCESSOS ATIVOS) NESTE LINK ABAIXO -->
<!-- ========================================== -->
<p align="center">
  <img src="https://via.placeholder.com/800x400.png?text=Cole+o+link+da+sua+Screenshot+dos+Cards+Aqui" alt="Tela de Processos Ativos" width="850">
</p>

## 🚀 Tecnologias

- **Front-End:** HTML5 Semântico, CSS3 (CSS Grid, Flexbox, Variáveis nativas, Animações e Glassmorphism), e JavaScript Vanilla (ES6+, Async/Await, Fetch API).
- **Middleware:** Microsoft Power Automate (Fluxos de Nuvem com Triggers HTTP Request/Response).
- **Back-End/Database:** Microsoft Azure SQL Database.
- **Linguagem de Banco:** T-SQL (Stored Procedures com controle de transação, funções condicionais e captura de `SCOPE_IDENTITY()`).
- **Analytics:** Microsoft Power BI (DAX, Power Query).

## 🗄️ Modelagem de Dados (Azure SQL)

O banco foi estruturado utilizando o modelo multidimensional (Star Schema) para facilitar integrações de BI.
- **Fato_Candidaturas:** Armazena as métricas do processo (Pretensão Salarial, Data, ID_Status, etc).
- **Dimensões:** `Dim_Empresa` (com lógica SCD Tipo 1 via Stored Procedure para Upsert automático), `Dim_Status`, `Dim_Plataforma`, etc.

## 🛠️ Como Executar

Por ser uma aplicação baseada em Cloud (Serverless), o back-end está hospedado no Azure. Para rodar a camada de visualização localmente:

1. Clone o repositório:
```bash
git clone https://github.com/SeuUsuario/personal-jobtracker.git
```
2. Abra a pasta do projeto.
3. Como os arquivos estão desacoplados (`index.html`, `style.css` e `app.js`), você pode abrir o `index.html` diretamente no seu navegador, ou utilizar uma extensão como o *Live Server* no VS Code.
4. Para acessar a modelagem de dados, abra o arquivo `/powerbi/dashboard.pbix` no seu Power BI Desktop.

---

<p align="center">
  <b>Desenvolvido por Gabriel Vieira</b><br>
  <i>Gestão de Dados e Engenharia de Software</i>
</p>
