// URLs de Integração com o Power Automate (Webhooks)
        const URL_POST_CANDIDATURA = "https://2b2e0ccd5c01ef24818a8be52d3158.eb.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/30/workflows/7ade87ae3b7f4079823c597758e267b8/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=weyuO3TTygCRrJfEAu4IngKbqwC0LXtOZdqZBN_QMbk";
        const URL_GET_VAGAS = "https://2b2e0ccd5c01ef24818a8be52d3158.eb.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/05/workflows/e206451b012d406884d08dd1cf321be6/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=dMeJXVfl6VolLpAwW9RXYCc1yszF8HC2Z_hFXIT3Cj8";
        const URL_UPDATE_STATUS = "https://2b2e0ccd5c01ef24818a8be52d3158.eb.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/26/workflows/a196e823230f4af79673ea2db5e699ff/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wcbG8mOArkByeDr5omic-J1z2NcR1LLZQVCjLDCfQTE";

        // Variáveis Globais de Estado (Filtros e Paginação)
        let todasVagas = [];
        let cacheVagasValido = false;
        let vagasFiltradas = [];
        let paginaAtual = 1;
        const ITENS_POR_PAGINA = 9;
        const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutos de validade no cache de sessão

        // Gerenciamento de Cache de Sessão (Evita consumo excessivo de vCore-segundos no Azure SQL)
        function obterCacheSessao() {
            try {
                const raw = sessionStorage.getItem('jobtracker_vagas_cache');
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                if (!parsed.timestamp || !Array.isArray(parsed.data)) return null;
                if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
                    sessionStorage.removeItem('jobtracker_vagas_cache');
                    return null;
                }
                return parsed.data;
            } catch (e) {
                return null;
            }
        }

        function salvarCacheSessao(dados) {
            try {
                sessionStorage.setItem('jobtracker_vagas_cache', JSON.stringify({
                    timestamp: Date.now(),
                    data: dados
                }));
            } catch (e) {}
        }

        function invalidarCacheSessao() {
            cacheVagasValido = false;
            try {
                sessionStorage.removeItem('jobtracker_vagas_cache');
            } catch (e) {}
        }

        function alternarTema() {
            const body = document.body;
            const btn = document.getElementById("themeToggle");
            
            if (body.getAttribute("data-theme") === "light") {
                body.removeAttribute("data-theme");
                btn.innerHTML = "☀️ Modo Claro";
            } else {
                body.setAttribute("data-theme", "light");
                btn.innerHTML = "🌙 Modo Escuro";
            }
        }

        // Navegação por Abas
        function alternarAba(abaDestino) {
            const abas = ['nova', 'ativas', 'dashboard'];
            
            // 1. Remove a classe active de todas as abas e views
            abas.forEach(aba => {
                document.getElementById('tab-' + aba).classList.remove('active');
                document.getElementById('view-' + aba).classList.remove('active');
            });
            
            // 2. Adiciona a classe active apenas no alvo clicado
            document.getElementById('tab-' + abaDestino).classList.add('active');
            document.getElementById('view-' + abaDestino).classList.add('active');

            // 3. Verifica o Cache (Memória ou SessionStorage antes de acionar o Azure SQL)
            if(abaDestino === 'ativas') {
                if (cacheVagasValido && todasVagas.length > 0) {
                    renderizarPagina();
                    return;
                }
                const cached = obterCacheSessao();
                if (cached && cached.length > 0) {
                    todasVagas = cached;
                    cacheVagasValido = true;
                    document.getElementById('controls-bar').style.display = 'flex';
                    aplicarFiltros();
                    return;
                }
                carregarVagas();
            }
        }

        document.addEventListener("DOMContentLoaded", () => {
            definirDataHoje();

            document.querySelectorAll('input, select').forEach(el => {
                el.addEventListener('input', () => {
                    el.classList.remove('input-error');
                });
            });
        });

        function definirDataHoje() {
            const dataHoje = new Date().toISOString().split('T')[0];
            document.getElementById('data').value = dataHoje;
        }

        // ==========================================
        // FLUXO: CREATE (INSERIR NOVA CANDIDATURA)
        // ==========================================
        async function salvarCandidatura() {
            const dataEl = document.getElementById('data');
            const empresaEl = document.getElementById('empresa');
            const setorEl = document.getElementById('setor');
            const tamanhoEl = document.getElementById('tamanho');
            const urlSiteEl = document.getElementById('urlSite');
            const vagaEl = document.getElementById('vaga');
            const plataformaEl = document.getElementById('plataforma');
            const pretensaoEl = document.getElementById('pretensao');
            
            const data = dataEl.value;
            const empresa = empresaEl.value.trim();
            const setor = setorEl.value.trim();
            const tamanho = tamanhoEl.value;
            const urlSite = urlSiteEl.value.trim();
            const vaga = vagaEl.value;
            const plataforma = plataformaEl.value;
            const pretensao = pretensaoEl.value;
            
            const notif = document.getElementById('notification');
            notif.style.display = 'block';

            dataEl.classList.remove('input-error');
            empresaEl.classList.remove('input-error');
            setorEl.classList.remove('input-error');
            tamanhoEl.classList.remove('input-error');
            urlSiteEl.classList.remove('input-error');
            vagaEl.classList.remove('input-error');
            plataformaEl.classList.remove('input-error');

            let hasError = false;

            if (!data) { dataEl.classList.add('input-error'); hasError = true; }
            if (!empresa) { empresaEl.classList.add('input-error'); hasError = true; }
            if (!setor) { setorEl.classList.add('input-error'); hasError = true; }
            if (!tamanho) { tamanhoEl.classList.add('input-error'); hasError = true; }
            if (!urlSite) { urlSiteEl.classList.add('input-error'); hasError = true; }
            if (!vaga) { vagaEl.classList.add('input-error'); hasError = true; }
            if (!plataforma) { plataformaEl.classList.add('input-error'); hasError = true; }

            if (hasError) {
                notif.className = 'notification notify-error full-width';
                notif.innerText = 'Por favor, preencha os campos obrigatórios destacados.';
                setTimeout(() => { notif.style.display = 'none'; }, 4000);
                return;
            }

            notif.className = 'notification full-width';
            notif.style.backgroundColor = 'rgba(234, 179, 8, 0.9)'; 
            notif.innerText = 'Enviando candidatura para o servidor...';
            document.getElementById('btnSalvar').disabled = true;

            const payload = {
                DataCandidatura: data,
                NomeEmpresaDigitado: empresa,
                Setor: setor,
                Tamanho: tamanho,
                UrlSite: urlSite,
                IdVaga: parseInt(vaga),
                IdStatus: 1, // Status inicial: Aplicado
                IdPlataforma: parseInt(plataforma),
                PretensaoSalarial: pretensao ? parseFloat(pretensao) : 0
            };

            try {
                const response = await fetch(URL_POST_CANDIDATURA, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

                notif.className = 'notification notify-success full-width';
                notif.style.backgroundColor = ''; 
                notif.innerText = 'Candidatura registrada com sucesso no Banco de Dados!';
                invalidarCacheSessao();
                
                document.getElementById('empresa').value = '';
                document.getElementById('setor').value = '';
                document.getElementById('tamanho').value = '';
                document.getElementById('urlSite').value = '';
                document.getElementById('vaga').value = '';
                document.getElementById('plataforma').value = '';
                document.getElementById('pretensao').value = '';
                definirDataHoje();

            } catch (error) {
                console.error("Falha ao salvar candidatura:", error);
                notif.className = 'notification notify-error full-width';
                notif.style.backgroundColor = '';
                notif.innerText = 'Falha de conexão com o orquestrador. Verifique o console.';
            } finally {
                document.getElementById('btnSalvar').disabled = false;
                setTimeout(() => { notif.style.display = 'none'; }, 5000);
            }
        }

        // ==========================================
        // FLUXO: READ (CARREGAR VAGAS ATIVAS)
        // ==========================================
        async function carregarVagas(forcarAtualizacao = false) {
            const container = document.getElementById('cards-container');
            const spinner = document.getElementById('loading-spinner');
            const controlsBar = document.getElementById('controls-bar');
            const paginationBar = document.getElementById('pagination-bar');
            
            // Se não for forçado, checa se temos dados salvos no cache de sessão
            if (!forcarAtualizacao) {
                const cached = obterCacheSessao();
                if (cached && cached.length > 0) {
                    todasVagas = cached;
                    cacheVagasValido = true;
                    controlsBar.style.display = 'flex';
                    aplicarFiltros();
                    return;
                }
            }

            container.innerHTML = '';
            spinner.style.display = 'block';
            controlsBar.style.display = 'none';
            if (paginationBar) paginationBar.style.display = 'none';

            try {
                const response = await fetch(URL_GET_VAGAS);
                if(!response.ok) throw new Error("Erro ao buscar vagas no Azure SQL");
                
                todasVagas = await response.json();
                cacheVagasValido = true;
                salvarCacheSessao(todasVagas);

                // Ordena por data (mais recentes primeiro)
                todasVagas.sort((a, b) => {
                    const dataA = a.Data ? new Date(a.Data.split('T')[0]) : new Date(0);
                    const dataB = b.Data ? new Date(b.Data.split('T')[0]) : new Date(0);
                    return dataB - dataA;
                });

                spinner.style.display = 'none';

                if(todasVagas.length === 0) {
                    container.innerHTML = '<p style="text-align:center; width:100%; grid-column:1/-1; opacity:0.7;">Nenhum processo ativo encontrado no Banco de Dados.</p>';
                    return;
                }

                // Exibe a barra de controles e aciona os filtros (que vão renderizar a página 1)
                controlsBar.style.display = 'flex';
                aplicarFiltros();

            } catch (error) {
                spinner.style.display = 'none';
                console.error("Falha ao comunicar com o Azure SQL / Power Automate:", error);
                renderizarFallbackBanco(container);
            }
        }

        // ==========================================
        // RESILIÊNCIA SERVERLESS & MODO DEMONSTRAÇÃO
        // ==========================================
        function renderizarFallbackBanco(container) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; max-width: 620px; margin: 30px auto; background: var(--card-bg); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 12px; padding: 28px; text-align: center; box-shadow: var(--card-shadow);">
                    <div style="font-size: 2.2rem; margin-bottom: 12px;">☁️⚡</div>
                    <h3 style="color: #ef4444; margin-bottom: 10px; font-size: 1.25rem; font-weight: 700;">Banco em Repouso ou Limite Mensal Atingido</h3>
                    <p style="color: var(--text-color); opacity: 0.88; font-size: 0.92rem; line-height: 1.6; margin-bottom: 22px;">
                        Esta aplicação opera <strong>100% Serverless no Azure SQL</strong>. Para garantir <strong>custo zero</strong>, a instância entra em repouso automático (auto-pause) ou pausa ao atingir a cota da camada gratuita mensal da Azure.
                    </p>
                    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="carregarVagas(true)" class="btn-update" style="padding: 10px 18px; font-size: 0.85rem; border-color: var(--primary-btn); color: var(--primary-btn);">
                            🔄 Tentar Novamente
                        </button>
                        <button onclick="carregarModoDemonstracao()" class="btn-copy-link" style="padding: 10px 18px; font-size: 0.85rem; border-color: #10b981; color: #10b981;">
                            🎯 Ativar Modo Demonstração
                        </button>
                    </div>
                </div>
            `;
        }

        function carregarModoDemonstracao() {
            todasVagas = [
                {
                    ID_Fato: 901,
                    Empresa: "Nubank",
                    Vaga: "Engenheiro de Dados - Pleno",
                    Senioridade: "Pleno",
                    Data: "2026-10-25T00:00:00.000Z",
                    StatusID: 2,
                    UrlSite: "https://nubank.com.br/carreiras",
                    Plataforma: "LinkedIn"
                },
                {
                    ID_Fato: 902,
                    Empresa: "Itaú Unibanco",
                    Vaga: "Analista de BI - Sênior",
                    Senioridade: "Sênior",
                    Data: "2026-10-23T00:00:00.000Z",
                    StatusID: 3,
                    UrlSite: "https://itau.com.br/carreiras",
                    Plataforma: "Gupy"
                },
                {
                    ID_Fato: 903,
                    Empresa: "Mercado Livre",
                    Vaga: "Analytics Engineer - Pleno",
                    Senioridade: "Pleno",
                    Data: "2026-10-21T00:00:00.000Z",
                    StatusID: 1,
                    UrlSite: "https://mercadolivre.com.br",
                    Plataforma: "LinkedIn"
                },
                {
                    ID_Fato: 904,
                    Empresa: "Stone",
                    Vaga: "Analista de Dados - Júnior",
                    Senioridade: "Júnior",
                    Data: "2026-10-19T00:00:00.000Z",
                    StatusID: 4,
                    UrlSite: "https://stone.com.br",
                    Plataforma: "Gupy"
                },
                {
                    ID_Fato: 905,
                    Empresa: "Ambev Tech",
                    Vaga: "Engenheiro de Dados - Pleno",
                    Senioridade: "Pleno",
                    Data: "2026-10-16T00:00:00.000Z",
                    StatusID: 5,
                    UrlSite: "https://ambevtech.com.br",
                    Plataforma: "Site da Empresa"
                },
                {
                    ID_Fato: 906,
                    Empresa: "PicPay",
                    Vaga: "Analista de BI - Pleno",
                    Senioridade: "Pleno",
                    Data: "2026-10-12T00:00:00.000Z",
                    StatusID: 2,
                    UrlSite: "https://picpay.com",
                    Plataforma: "LinkedIn"
                }
            ];

            cacheVagasValido = true;
            salvarCacheSessao(todasVagas);
            document.getElementById('controls-bar').style.display = 'flex';
            aplicarFiltros();

            const notif = document.getElementById('notification');
            if (notif) {
                notif.className = 'notification full-width';
                notif.style.backgroundColor = 'rgba(16, 185, 129, 0.9)';
                notif.innerText = '🎯 Modo Demonstração ativo: dados de exemplo carregados com sucesso!';
                notif.style.display = 'block';
                setTimeout(() => { notif.style.display = 'none'; }, 4000);
            }
        }

        // ==========================================
        // FILTROS E PAGINAÇÃO
        // ==========================================
        function aplicarFiltros() {
            const termoBusca = document.getElementById('filtro-empresa').value.toLowerCase();
            const statusFiltro = document.getElementById('filtro-status').value;

            vagasFiltradas = todasVagas.filter(vaga => {
                const empresa = vaga.Empresa ? vaga.Empresa.toLowerCase() : '';
                const matchEmpresa = empresa.includes(termoBusca);
                const matchStatus = statusFiltro ? (vaga.StatusID == statusFiltro) : true;
                return matchEmpresa && matchStatus;
            });

            paginaAtual = 1; // Reseta para a primeira página ao alterar o filtro
            renderizarPagina();
        }

        function mudarPagina(direcao) {
            paginaAtual += direcao;
            renderizarPagina();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function atualizarContadorVagas() {
            const counterEl = document.getElementById('vagas-counter-text');
            if (!counterEl) return;

            const termoBusca = document.getElementById('filtro-empresa').value.trim();
            const statusFiltro = document.getElementById('filtro-status').value;

            // Total de vagas ativas (não rejeitadas, StatusID != 5)
            const ativasGeral = todasVagas.filter(v => v.StatusID != 5).length;

            if (!termoBusca && !statusFiltro) {
                counterEl.innerHTML = `<span class="counter-badge-number">${ativasGeral}</span> ${ativasGeral === 1 ? 'Vaga Ativa' : 'Vagas Ativas'}`;
            } else {
                const ativasFiltradas = vagasFiltradas.filter(v => v.StatusID != 5).length;
                if (statusFiltro === "5") {
                    counterEl.innerHTML = `<span class="counter-badge-number">${vagasFiltradas.length}</span> ${vagasFiltradas.length === 1 ? 'Rejeitado' : 'Rejeitados'}`;
                } else {
                    counterEl.innerHTML = `<span class="counter-badge-number">${ativasFiltradas}</span> ${ativasFiltradas === 1 ? 'Ativo' : 'Ativos'} <span style="opacity:0.6; font-size:0.85rem;">(${vagasFiltradas.length} total)</span>`;
                }
            }
        }

        function renderizarPagina() {
            const container = document.getElementById('cards-container');
            const paginationBar = document.getElementById('pagination-bar');
            container.innerHTML = '';

            atualizarContadorVagas();

            const totalPaginas = Math.ceil(vagasFiltradas.length / ITENS_POR_PAGINA) || 1;
            
            // Trava de segurança para limites de página
            if (paginaAtual < 1) paginaAtual = 1;
            if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

            // Atualiza botões e texto da paginação
            document.getElementById('page-info').innerText = `Página ${paginaAtual} de ${totalPaginas}`;
            document.getElementById('btn-prev').disabled = (paginaAtual === 1);
            document.getElementById('btn-next').disabled = (paginaAtual === totalPaginas);

            if (vagasFiltradas.length === 0) {
                container.innerHTML = '<p style="text-align:center; width:100%; grid-column:1/-1; opacity:0.7;">Nenhuma vaga corresponde aos filtros informados.</p>';
                if (paginationBar) paginationBar.style.display = 'none';
                return;
            }

            if (paginationBar) paginationBar.style.display = 'flex';

            // Fatia o array (Slice) com base na página atual
            const indexInicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
            const vagasPagina = vagasFiltradas.slice(indexInicio, indexInicio + ITENS_POR_PAGINA);

            // Renderiza apenas os cards fatiados
            vagasPagina.forEach(vaga => {
                // Formatação da data: remove o horário (T00:00:00) e inverte para o padrão BR (DD/MM/YYYY)
                let dataFormatada = vaga.Data ? vaga.Data.split('T')[0] : '';
                if (dataFormatada.includes('-')) {
                    const partes = dataFormatada.split('-');
                    if (partes.length === 3) dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
                }

                // Identificação e formatação da Senioridade
                let cargoNome = vaga.Vaga || '';
                let nivelNome = vaga.Senioridade || vaga.Nivel || vaga.Seniority || vaga.Nivel_Vaga || '';

                if (!nivelNome && cargoNome.includes(' - ')) {
                    const partes = cargoNome.split(' - ');
                    if (partes.length >= 2) {
                        cargoNome = partes[0].trim();
                        nivelNome = partes[1].trim();
                    }
                }

                let badgeHtml = '';
                if (nivelNome) {
                    const nivelClean = nivelNome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
                    let classeBadge = 'badge-default';
                    if (nivelClean.includes('junior')) classeBadge = 'badge-junior';
                    else if (nivelClean.includes('pleno')) classeBadge = 'badge-pleno';
                    else if (nivelClean.includes('senior')) classeBadge = 'badge-senior';
                    else if (nivelClean.includes('trainee') || nivelClean.includes('estagio')) classeBadge = 'badge-trainee';
                    else if (nivelClean.includes('lead') || nivelClean.includes('especialista')) classeBadge = 'badge-lead';

                    badgeHtml = `<span class="seniority-badge ${classeBadge}">${nivelNome}</span>`;
                }

                const card = document.createElement('div');
                card.className = 'job-card';
                card.innerHTML = `
                    <div class="job-card-header">
                        <h3>${vaga.Empresa}</h3>
                        <div class="job-card-role-row">
                            <p>${cargoNome}</p>
                            ${badgeHtml}
                        </div>
                        <span class="date-tag">Aplicado em: ${dataFormatada}</span>
                    </div>
                    <div class="job-card-body">
                        <label>Status do Processo</label>
                        <select id="status-card-${vaga.ID_Fato}">
                            <option value="1" ${vaga.StatusID == 1 ? 'selected' : ''}>Aplicado</option>
                            <option value="2" ${vaga.StatusID == 2 ? 'selected' : ''}>Entrevista</option>
                            <option value="3" ${vaga.StatusID == 3 ? 'selected' : ''}>Teste Técnico</option>
                            <option value="4" ${vaga.StatusID == 4 ? 'selected' : ''}>Proposta</option>
                            <option value="5" ${vaga.StatusID == 5 ? 'selected' : ''}>Rejeitado</option>
                        </select>
                        <div class="job-card-actions">
                            <button class="btn-copy-link" id="btn-copy-${vaga.ID_Fato}" onclick="copiarLinkVaga(${vaga.ID_Fato})" title="Copiar link da vaga">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                <span>Copiar Link</span>
                            </button>
                            <button class="btn-update" onclick="atualizarStatus(${vaga.ID_Fato})">Atualizar Status</button>
                        </div>
                        <div id="notif-card-${vaga.ID_Fato}" style="display:none; font-size:0.85rem; margin-top:8px; text-align:center; font-weight:bold;"></div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // ==========================================
        // FLUXO: COPIAR LINK DA VAGA
        // ==========================================
        async function copiarLinkVaga(idFato) {
            const vaga = todasVagas.find(v => v.ID_Fato == idFato);
            const link = vaga ? (vaga.Url || vaga.URL_Site || vaga.UrlSite || vaga.Link || vaga.URL || vaga.LinkVaga) : null;
            const btn = document.getElementById(`btn-copy-${idFato}`);
            const notifEl = document.getElementById(`notif-card-${idFato}`);

            if (!link || link === 'undefined' || link.trim() === '') {
                if (notifEl) {
                    notifEl.style.display = 'block';
                    notifEl.style.color = '#eab308';
                    notifEl.innerText = '⚠️ Link não disponível no banco.';
                    setTimeout(() => notifEl.style.display = 'none', 3000);
                }
                return;
            }

            try {
                await navigator.clipboard.writeText(link.trim());
                if (btn) {
                    const originalHtml = btn.innerHTML;
                    btn.classList.add('copied');
                    btn.innerHTML = '✓ Copiado!';
                    setTimeout(() => {
                        btn.innerHTML = originalHtml;
                        btn.classList.remove('copied');
                    }, 2000);
                }
                if (notifEl) {
                    notifEl.style.display = 'block';
                    notifEl.style.color = '#10b981';
                    notifEl.innerText = '✓ Link copiado!';
                    setTimeout(() => notifEl.style.display = 'none', 2000);
                }
            } catch (err) {
                // Fallback para navegadores sem permissão direta de clipboard
                const tempInput = document.createElement('textarea');
                tempInput.value = link.trim();
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);

                if (btn) {
                    const originalHtml = btn.innerHTML;
                    btn.classList.add('copied');
                    btn.innerHTML = '✓ Copiado!';
                    setTimeout(() => {
                        btn.innerHTML = originalHtml;
                        btn.classList.remove('copied');
                    }, 2000);
                }
            }
        }

        // ==========================================
        // FLUXO: UPDATE (ATUALIZAR STATUS DA VAGA)
        // ==========================================
        async function atualizarStatus(idFato) {
            const selectEl = document.getElementById(`status-card-${idFato}`);
            const novoStatus = parseInt(selectEl.value);
            const notifEl = document.getElementById(`notif-card-${idFato}`);

            notifEl.style.display = 'block';
            notifEl.style.color = 'var(--text-color)';
            notifEl.innerText = 'Sincronizando com Banco...';

            // Suporte interativo ao Modo Demonstração
            if (idFato >= 900) {
                setTimeout(() => {
                    const vagaAlvo = todasVagas.find(v => v.ID_Fato == idFato);
                    if (vagaAlvo) vagaAlvo.StatusID = novoStatus;
                    salvarCacheSessao(todasVagas);
                    notifEl.style.color = '#10b981';
                    notifEl.innerText = '✓ Status atualizado (Modo Demo)!';
                    atualizarContadorVagas();
                    setTimeout(() => notifEl.style.display = 'none', 2500);
                }, 300);
                return;
            }

            try {
                const response = await fetch(URL_UPDATE_STATUS, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ID_Fato: idFato, NovoStatus: novoStatus })
                });

                if(!response.ok) throw new Error('Falha no update da API');

                notifEl.style.color = '#10b981';
                notifEl.innerText = '✓ Status atualizado!';
                
                const vagaAlvo = todasVagas.find(v => v.ID_Fato == idFato);
                if (vagaAlvo) {
                    vagaAlvo.StatusID = novoStatus;
                    salvarCacheSessao(todasVagas);
                }
                atualizarContadorVagas();
                
            } catch (error) {
                notifEl.style.color = '#ef4444';
                notifEl.innerText = 'Erro ao atualizar status.';
                console.error(error);
            } finally {
                setTimeout(() => notifEl.style.display = 'none', 3000);
            }
        }

// ==========================================
// ARQUITETURA SERVERLESS: LAZY LOADING
// ==========================================
// As requisições ao Azure SQL ocorrem exclusivamente sob demanda
// quando o usuário acessa a aba 'Processos Ativos', respeitando
// a cota gratuita mensal de 100.000 vCore-segundos.
