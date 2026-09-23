# Personal JobTracker — architecture.md

## 1. Visão Arquitetural
Sistema transacional de entrada única para rastreamento de candidaturas, focado em alta performance analítica corporativa. A aplicação atua em nuvem 100% Serverless, onde a interface interativa (SPA) se comunica assincronamente com o Azure SQL Database através de uma camada de API Gateway (Power Automate Webhooks), culminando no consumo de Business Intelligence embutido.

## 2. Containers Principais (Stack)
- **Frontend (Apresentação & Governança):** Single Page Application (SPA) Nativa em Vanilla JS, hospedada globalmente no **Azure Static Web Apps** com pipeline CI/CD automático via **GitHub Actions**.
- **Backend (Orquestrador/API):** Microsoft Power Automate (Fluxos HTTP/Webhooks) responsável pelo parse seguro dos payloads JSON (POST, GET, PATCH) e orquestração do banco de dados.
- **Banco de Dados (Armazenamento):** Azure SQL Database estruturado rigorosamente em Star Schema.
- **Analytics (Consumo):** Power BI Service conectado ao Azure SQL via *Import* com *Scheduled Refresh* autônomo. O relatório é renderizado de forma embutida e nativa no site via iFrame.

## 3. Modelo de Dados (Star Schema - Azure SQL Database)
O banco de dados reflete o modelo em estrela (Star Schema) garantindo a integridade referencial:

### Tabelas Dimensão (Contexto)
- **Dim_Empresa:** `ID_Empresa` (INT, PK), `Nome_Empresa` (VARCHAR), `Setor` (VARCHAR), `Tamanho` (VARCHAR), `URL_Site` (VARCHAR).
- **Dim_Vaga:** `ID_Vaga` (INT, PK), `Titulo_Vaga` (VARCHAR), `Nivel` (VARCHAR), `Requisitos_Principais` (TEXT).
- **Dim_Status:** `ID_Status` (INT, PK), `Etapa` (VARCHAR).
- **Dim_Plataforma:** `ID_Plataforma` (INT, PK), `Nome_Plataforma` (VARCHAR).

### Tabela Fato (Eventos)
- **Fato_Candidaturas:** `ID_Fato` (INT, PK), `Data_Candidatura` (DATE), `ID_Empresa` (INT, FK), `ID_Vaga` (INT, FK), `ID_Status` (INT, FK), `ID_Plataforma` (INT, FK), `Qtd_Candidatura` (INT, DEFAULT 1), `Pretensao_Salarial` (DECIMAL).

## 4. Diretrizes de Front-End (Web/JS)
- **Roteamento SPA:** A arquitetura do template HTML foi dividida em 3 visões assíncronas: *Nova Candidatura* (Input), *Processos Ativos* (Gestão) e *Dashboard* (Analytics). Tudo carrega sem *page reload*.
- **Processamento Client-Side:** O painel de vagas ativas utiliza filtros nativos de Array em memória (JavaScript `Array.filter()`) para buscas cruzadas em tempo real (Nome x Status), aliviando o servidor.
- **Identidade Visual e Layout:** Interface guiada por Glassmorphism e Dark Theme corporativo. Uso de manipulação CSS (`breakout layout`) para expandir o dashboard horizontalmente, garantindo imersão analítica.

## 5. Regras de Integração (API/Fetch)
- **Criação (POST):** O botão "Salvar" valida o formulário, constrói o JSON e aciona a Fetch API. O backend executa a inserção garantindo atomicidade via *Stored Procedures* e `SCOPE_IDENTITY()`.
- **Leitura (GET):** Ao ativar a aba de Processos Ativos, um gatilho assíncrono consome o histórico relacional do Azure SQL para renderizar os cards em Grid na tela.
- **Atualização (PATCH):** Cliques diretos nos cards acionam requisições pontuais para promover o status do candidato, atualizando o banco em tempo real.