// URLs de Integração com o Power Automate (Webhooks)
        const URL_POST_CANDIDATURA = "https://2b2e0ccd5c01ef24818a8be52d3158.eb.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/30/workflows/7ade87ae3b7f4079823c597758e267b8/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=weyuO3TTygCRrJfEAu4IngKbqwC0LXtOZdqZBN_QMbk";
        const URL_GET_VAGAS = "https://2b2e0ccd5c01ef24818a8be52d3158.eb.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/31/workflows/768a383d3215454ebe933870084a2b76/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=L9LZNhg9E7bHf7qtzpi8Zvj4f5AbCATxPaodw6PsHAM";
        const URL_UPDATE_STATUS = "https://2b2e0ccd5c01ef24818a8be52d3158.eb.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/26/workflows/a196e823230f4af79673ea2db5e699ff/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wcbG8mOArkByeDr5omic-J1z2NcR1LLZQVCjLDCfQTE";

        // Variáveis Globais de Estado (Filtros e Paginação)
        let todasVagas = [];
let cacheVagasValido = false;
        let vagasFiltradas = [];
        let paginaAtual = 1;
        const ITENS_POR_PAGINA = 9;

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

            // 3. Verifica o Cache
            if(abaDestino === 'ativas') {
                if (!cacheVagasValido) {
                    carregarVagas();
                }
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
            const statusEl = document.getElementById('status');
            const plataformaEl = document.getElementById('plataforma');
            const pretensaoEl = document.getElementById('pretensao');
            
            const data = dataEl.value;
            const empresa = empresaEl.value.trim();
            const setor = setorEl.value.trim();
            const tamanho = tamanhoEl.value;
            const urlSite = urlSiteEl.value.trim();
            const vaga = vagaEl.value;
            const status = statusEl.value;
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
            statusEl.classList.remove('input-error');
            plataformaEl.classList.remove('input-error');

            let hasError = false;

            if (!data) { dataEl.classList.add('input-error'); hasError = true; }
            if (!empresa) { empresaEl.classList.add('input-error'); hasError = true; }
            if (!setor) { setorEl.classList.add('input-error'); hasError = true; }
            if (!tamanho) { tamanhoEl.classList.add('input-error'); hasError = true; }
            if (!urlSite) { urlSiteEl.classList.add('input-error'); hasError = true; }
            if (!vaga) { vagaEl.classList.add('input-error'); hasError = true; }
            if (!status) { statusEl.classList.add('input-error'); hasError = true; }
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
                IdStatus: parseInt(status),
                IdPlataforma: parseInt(plataforma),
                PretensaoSalarial: pretensao ? parseFloat(pretensao) : null
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
                
                document.getElementById('empresa').value = '';
                document.getElementById('setor').value = '';
                document.getElementById('tamanho').value = '';
                document.getElementById('urlSite').value = '';
                document.getElementById('vaga').value = '';
                document.getElementById('status').value = '';
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
        async function carregarVagas() {
            const container = document.getElementById('cards-container');
            const spinner = document.getElementById('loading-spinner');
            const controlsBar = document.getElementById('controls-bar');
            
            container.innerHTML = '';
            spinner.style.display = 'block';
            controlsBar.style.display = 'none';

            try {
                const response = await fetch(URL_GET_VAGAS);
                if(!response.ok) throw new Error("Erro ao buscar vagas");
                
                todasVagas = await response.json();
                cacheVagasValido = true;

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
                container.innerHTML = '<p style="text-align:center; color:#ef4444; width:100%; grid-column:1/-1;">Erro ao carregar vagas. Verifique a conexão com o banco.</p>';
                console.error(error);
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
        }

        function renderizarPagina() {
            const container = document.getElementById('cards-container');
            container.innerHTML = '';

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
                return;
            }

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

                const card = document.createElement('div');
                card.className = 'job-card';
                card.innerHTML = `
                    <div class="job-card-header">
                        <h3>${vaga.Empresa}</h3>
                        <p>${vaga.Vaga}</p>
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
                            <button class="btn-update" onclick="atualizarStatus(${vaga.ID_Fato})">Atualizar Status</button>
                        </div>
                        <div id="notif-card-${vaga.ID_Fato}" style="display:none; font-size:0.85rem; margin-top:8px; text-align:center; font-weight:bold;"></div>
                    </div>
                `;
                container.appendChild(card);
            });
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

            try {
                const response = await fetch(URL_UPDATE_STATUS, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ID_Fato: idFato, NovoStatus: novoStatus })
                });

                if(!response.ok) throw new Error('Falha no update da API');

                notifEl.style.color = '#10b981';
                notifEl.innerText = '✓ Status atualizado!';
                cacheVagasValido = false;
                
            } catch (error) {
                notifEl.style.color = '#ef4444';
                notifEl.innerText = 'Erro ao atualizar status.';
                console.error(error);
            } finally {
                setTimeout(() => notifEl.style.display = 'none', 3000);
            }
        }

// EAGER LOADING
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        if (!cacheVagasValido) {
            try {
                const response = await fetch(URL_GET_VAGAS);
                if(response.ok) {
                    todasVagas = await response.json();
                    cacheVagasValido = true;
                }
            } catch(e) {}
        }
    }, 2000);
});
