// --- LÓGICA DE POP-UPS FLUTUANTES ---
function alternarPainel(idPainel) {
    const painel = document.getElementById(idPainel);
    if (painel.style.display === 'block') {
        painel.style.display = 'none';
        return;
    }
    document.querySelectorAll('.painel-flutuante').forEach(p => p.style.display = 'none');
    painel.style.display = 'block';
}

function fecharPainel(idPainel) {
    const painel = document.getElementById(idPainel);
    if (painel) painel.style.display = 'none';
}

function abrirModalRegistro() {
    const modal = document.getElementById('modal-registro');
    if (modal.style.display === 'block') {
        fecharModal();
        return;
    }
    document.querySelectorAll('.painel-flutuante').forEach(p => p.style.display = 'none');
    modal.style.display = 'block';

    const inputEndereco = document.getElementById('endereco-input');
    if (inputEndereco) inputEndereco.value = "";
}

function fecharModal() {
    const modal = document.getElementById('modal-registro');
    modal.style.display = 'none';

    // 1. Remove o pino temporário se ele existir
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }

    // 2. Reseta o seletor de tipo de crime
    const tipo = document.getElementById('tipo-crime');
    if (tipo) tipo.selectedIndex = 0;

    // 3. Limpa o campo de endereço e esconde o botão "X" interno
    const inputEnd = document.getElementById('endereco-input');
    const btnLimparEnd = document.getElementById('btn-limpar-endereco');
    if (inputEnd) inputEnd.value = "";
    if (btnLimparEnd) btnLimparEnd.style.display = 'none';

    // 4. Voo elegante de volta para a posição inicial do mapa
    map.flyTo([-23.5505, -46.6333], 13, { animate: true, duration: 1.5 });
}

// --- CONFIGURAÇÃO DO MAPA ---
var map = L.map('map', {
    center: [-23.5505, -46.6333],
    zoom: 13,
    minZoom: 10,
    maxZoom: 16
});

document.getElementById('btn-reposicionar').addEventListener('click', function () {
    map.flyTo([-23.5505, -46.6333], 13, { animate: true, duration: 1.5 });
});

var mapaClaro = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
var escuroBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
var escuroTextos = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
var mapaEscuro = L.layerGroup([escuroBase, escuroTextos]);

mapaClaro.addTo(map);

// --- FUNÇÃO DO MODO ESCURO ---
let modoEscuroAtivo = false;
function alternarTema() {
    modoEscuroAtivo = !modoEscuroAtivo;
    document.body.classList.toggle('dark-mode');
    const btnIcone = document.querySelector('#btn-dark-mode i');
    const btnTexto = document.querySelector('#btn-dark-mode span');

    if (modoEscuroAtivo) {
        map.removeLayer(mapaClaro);
        mapaEscuro.addTo(map);
        btnIcone.className = 'fas fa-sun';
        btnTexto.innerText = 'Modo Claro';
    } else {
        map.removeLayer(mapaEscuro);
        mapaClaro.addTo(map);
        btnIcone.className = 'fas fa-moon';
        btnTexto.innerText = 'Modo Escuro';
    }
}

// --- CAMADAS DE DADOS (CLUSTERS E PINOS) ---
var markerGroup = L.markerClusterGroup({
    maxClusterRadius: (zoom) => zoom <= 11 ? 1000 : zoom <= 13 ? 250 : 80,
    disableClusteringAtZoom: 15,
    chunkedLoading: true,
    spiderfyOnMaxZoom: false
});
map.addLayer(markerGroup);
var pinosSemBolha = L.featureGroup().addTo(map);
var camadaPoligono = null;
var tempMarker;
let pinoDestaque = null;

function obterIconePorCrime(tipo) {
    let iconClass = 'fa-question-circle';
    let colorClass = 'marker-other';

    // Verificação exata baseada nos novos nomes
    if (tipo === "Roubo/Furto de Veículo") { iconClass = 'fa-car-side'; colorClass = 'marker-car'; }
    else if (tipo === "Roubo/Furto a Pedestre") { iconClass = 'fa-mobile-alt'; colorClass = 'marker-phone'; }
    else if (tipo === "Agressão Física") { iconClass = 'fa-user-shield'; colorClass = 'marker-person'; }
    else if (tipo === "Vandalismo e Danos") { iconClass = 'fa-spray-can'; colorClass = 'marker-vandal'; }

    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="custom-map-pin ${colorClass}"><i class="fas ${iconClass}"></i></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });
}

// --- LÓGICA DE CLIQUE E ENDEREÇO ---
map.on('click', function (e) {
    // 1. Atualiza o pino no novo local clicado
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker(e.latlng).addTo(map);

    // --- A MÁGICA DO VOO ENTRA AQUI ---
    // Centraliza o mapa no ponto clicado com zoom 17 e uma animação de 1.5 segundos
    map.flyTo(e.latlng, 16, { animate: true, duration: 1.5 });

    // 2. Atualiza as coordenadas para a base de dados
    document.getElementById('lat-input').value = e.latlng.lat;
    document.getElementById('lng-input').value = e.latlng.lng;

    // --- A GRANDE CORREÇÃO ESTÁ AQUI ---
    // Em vez de usar o abrirModalRegistro() que liga/desliga, forçamos a janela a ficar aberta
    const modal = document.getElementById('modal-registro');
    document.querySelectorAll('.painel-flutuante').forEach(p => p.style.display = 'none');
    modal.style.display = 'block';

    // 3. Atualiza os campos visuais
    const inputEnd = document.getElementById('endereco-input');
    const btnLimpar = document.getElementById('btn-limpar-endereco');

    if (inputEnd) inputEnd.value = "A procurar endereço...";
    if (btnLimpar) btnLimpar.style.display = 'block'; // Mantém o 'X' visível

    // 4. Vai buscar o nome da rua ao servidor (Reverse Geocoding)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=18&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
            if (data && data.address) {
                const d = data.address;
                const distrito = d.suburb || d.city_district || d.neighbourhood || "Desconhecido";
                document.getElementById('distrito-input').value = distrito;
                if (inputEnd) inputEnd.value = (d.road || "Rua não identificada") + (d.house_number ? `, ${d.house_number}` : "");
            } else {
                if (inputEnd) inputEnd.value = "Localização sem endereço definido";
            }
        })
        .catch(() => {
            if (inputEnd) inputEnd.value = "Erro ao procurar endereço";
        });
});

// ====================================================================
// AUTOCOMPLETE CUSTOMIZADO E UTILITÁRIOS (COM BOTÃO X E TECLADO)
// ====================================================================
function removerAcentos(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function formatarNome(nome) {
    return nome.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
}

let listaDistritosOficiais = [];
fetch('https://raw.githubusercontent.com/codigourbano/distritos-sp/master/distritos-sp.geojson')
    .then(res => res.json())
    .then(geoData => {
        const nomes = geoData.features.map(f => f.properties.ds_nome || f.properties.NOME || "");
        listaDistritosOficiais = [...new Set(nomes)].filter(n => n !== "").map(n => n.trim()).sort();
    });

const inputDistrito = document.getElementById('filtro-distrito');
const btnLimparDistrito = document.getElementById('btn-limpar-distrito'); // Puxa o botão X do HTML

if (inputDistrito) {
    inputDistrito.removeAttribute('list');
    const caixaSugestoes = document.createElement('div');
    caixaSugestoes.setAttribute('class', 'autocomplete-items');
    inputDistrito.parentNode.appendChild(caixaSugestoes);

    let focoAtual = -1;

    // Ação 1: Clicar no botão X
    if (btnLimparDistrito) {
        btnLimparDistrito.addEventListener('click', function () {
            inputDistrito.value = '';           // Apaga o texto
            this.style.display = 'none';        // Esconde o botão X
            caixaSugestoes.innerHTML = '';      // Esconde a lista
            atualizarInterface();               // Reseta o mapa
            inputDistrito.focus();              // Devolve o cursor piscando na caixa
        });
    }

    inputDistrito.addEventListener('input', function () {
        const digitado = this.value;
        caixaSugestoes.innerHTML = '';
        focoAtual = -1;

        // Ação 2: Mostra o X se tiver texto, esconde se estiver vazio
        if (btnLimparDistrito) {
            btnLimparDistrito.style.display = digitado.length > 0 ? 'block' : 'none';
        }

        if (!digitado) { atualizarInterface(); return; }

        const termoLimpo = removerAcentos(digitado);
        const resultados = listaDistritosOficiais.filter(nome => removerAcentos(nome).includes(termoLimpo));

        resultados.forEach(nome => {
            const item = document.createElement('div');
            item.innerHTML = formatarNome(nome);
            item.addEventListener('click', function () {
                inputDistrito.value = this.innerText;
                caixaSugestoes.innerHTML = '';
                atualizarInterface();
            });
            caixaSugestoes.appendChild(item);
        });
    });

    inputDistrito.addEventListener('keydown', function (e) {
        let itens = caixaSugestoes.getElementsByTagName('div');

        if (e.key === 'ArrowDown') {
            if (itens.length === 0) return;
            focoAtual++;
            adicionarClasseAtiva(itens);
        } else if (e.key === 'ArrowUp') {
            if (itens.length === 0) return;
            focoAtual--;
            adicionarClasseAtiva(itens);
        } else if (e.key === 'Enter') {
            e.preventDefault();

            if (focoAtual > -1 && itens.length > 0) {
                itens[focoAtual].click();
            } else {
                if (this.value) {
                    this.value = formatarNome(this.value);
                }
                caixaSugestoes.innerHTML = '';
                atualizarInterface();
            }
        }
    });

    function adicionarClasseAtiva(itens) {
        removerClasseAtiva(itens);
        if (focoAtual >= itens.length) focoAtual = 0;
        if (focoAtual < 0) focoAtual = itens.length - 1;
        itens[focoAtual].classList.add('autocomplete-active');
        itens[focoAtual].scrollIntoView({ block: 'nearest' });
    }

    function removerClasseAtiva(itens) {
        for (let i = 0; i < itens.length; i++) itens[i].classList.remove('autocomplete-active');
    }

    document.addEventListener('click', (e) => {
        if (e.target !== inputDistrito && e.target !== btnLimparDistrito) {
            caixaSugestoes.innerHTML = '';
        }
    });
}

// --- ATUALIZAÇÃO DA INTERFACE E ZOOM ---
function atualizarInterface() {
    const tipo = document.getElementById('filtro-tipo') ? document.getElementById('filtro-tipo').value : 'Todos';
    const zona = document.getElementById('filtro-zona') ? document.getElementById('filtro-zona').value : 'Todas';
    const distrito = document.getElementById('filtro-distrito') ? document.getElementById('filtro-distrito').value : '';
    const temFiltroAtivo = (horarioSelecionado !== null || zona !== 'Todas' || tipo !== 'Todos');

    const btnReset = document.getElementById('btn-reset-mapa');
    if (btnReset) {
        const filtroTipo = document.getElementById('filtro-tipo') ? document.getElementById('filtro-tipo').value : 'Todos';
        const filtroZona = document.getElementById('filtro-zona') ? document.getElementById('filtro-zona').value : 'Todas';

        // O botão aparece se tiver filtro de hora OU se os selects não estiverem no padrão
        if (horarioSelecionado !== null || filtroTipo !== 'Todos' || filtroZona !== 'Todas') {
            btnReset.style.display = 'flex'; // Usamos flex para manter o ícone alinhado
        } else {
            btnReset.style.display = 'none';
        }
    }

    const params = new URLSearchParams();
    if (tipo !== 'Todos') params.append('tipo', tipo);
    if (zona !== 'Todas') params.append('zona', zona);
    if (distrito.trim() !== '') params.append('distrito', distrito.trim());

    fetch(`/dados?${params.toString()}`).then(res => res.json()).then(pontos => {
        markerGroup.clearLayers();
        pinosSemBolha.clearLayers();
        if (camadaPoligono) { map.removeLayer(camadaPoligono); camadaPoligono = null; }

const metricTotal = document.getElementById('metric-total');
        if (metricTotal) metricTotal.innerText = pontos.length;

        // --- INÍCIO DA CORREÇÃO DO MAIS FREQUENTE ---
        const metricFrequent = document.getElementById('metric-frequent');
        if (metricFrequent) {
            if (pontos.length === 0) {
                metricFrequent.innerText = '--';
            } else {
                // Conta quantas vezes cada tipo aparece
                const contagemTipos = {};
                pontos.forEach(p => {
                    contagemTipos[p.tipo] = (contagemTipos[p.tipo] || 0) + 1;
                });

                // Descobre qual tipo tem o maior número
                let tipoMaisFrequente = '--';
                let maxCount = 0;
                for (const tipo in contagemTipos) {
                    if (contagemTipos[tipo] > maxCount) {
                        maxCount = contagemTipos[tipo];
                        tipoMaisFrequente = tipo;
                    }
                }
                
                metricFrequent.innerText = `${tipoMaisFrequente} (${maxCount})`;
            }
        }
        // --- FIM DA CORREÇÃO ---

pontos.forEach(p => {
            // Extrai a hora (ex: "2024-04-23 10:30" vira 10)
            const horaPonto = parseInt(p.data_hora.split(' ')[1].split(':')[0]);

            // Se clicou no gráfico, filtra aqui
            if (horarioSelecionado !== null && horaPonto !== parseInt(horarioSelecionado)) {
                return;
            }

            // --- NOVO LAYOUT DO POPUP (Estilo Card Profissional com Correção de Bordas e 'X') ---
            let iconClass = 'fa-question-circle'; let colorHex = '#27ae60';
            if (p.tipo === "Roubo/Furto de Veículo") { iconClass = 'fa-car-side'; colorHex = '#3498db'; }
            else if (p.tipo === "Roubo/Furto a Pedestre") { iconClass = 'fa-mobile-alt'; colorHex = '#8e44ad'; }
            else if (p.tipo === "Agressão Física") { iconClass = 'fa-user-shield'; colorHex = '#e74c3c'; }
            else if (p.tipo === "Vandalismo e Danos") { iconClass = 'fa-spray-can'; colorHex = '#f39c12'; }

            const localExibicao = p.distrito ? p.distrito : "Localização Registrada";

            // Layout simplificado: removemos margins negativas porque usaremos classe CSS no popup
            const conteudoBolha = `
                <div style="min-width: 180px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border-radius: 4px; overflow: hidden;">
                    <div style="background-color: ${colorHex}; color: white; padding: 10px 14px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas ${iconClass}" style="font-size: 16px; width: 16px; text-align: center;"></i>
                        <strong style="font-size: 14px; margin: 0; letter-spacing: 0.5px; padding-right: 25px;">${p.tipo}</strong>
                    </div>
                    <div style="padding: 12px;">
                        <div style="font-size: 13px; color: #2c3e50; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px;">
                            <i class="fas fa-map-marker-alt" style="color: ${colorHex}; margin-top: 3px; width: 14px; text-align: center;"></i>
                            <span style="line-height: 1.3;">${localExibicao}</span>
                        </div>
                        <div style="font-size: 12px; color: #7f8c8d; display: flex; align-items: center; gap: 8px; border-top: 1px solid #ecf0f1; padding-top: 8px; margin-top: 10px;">
                            <i class="far fa-clock" style="width: 14px; text-align: center;"></i>
                            <span>${p.data_hora}</span>
                        </div>
                    </div>
                </div>
            `;

            // MODIFICAÇÃO AQUI: Adicionado { className: 'safeview-popup' }
            // Isso nos permite controlar o visual externo via CSS no index.html
            let m = L.marker([p.lat, p.lng], { icon: obterIconePorCrime(p.tipo) })
                .bindPopup(conteudoBolha, { className: 'safeview-popup' });
            // --- FIM DO NOVO LAYOUT ---

            temFiltroAtivo ? pinosSemBolha.addLayer(m) : markerGroup.addLayer(m);
        });

        atualizarFeedList(pontos);

        if (temFiltroAtivo && pontos.length > 0) {
            map.flyToBounds(pinosSemBolha.getBounds(), { padding: [50, 50], duration: 1.5 });
        } else if (!temFiltroAtivo) {
            map.flyTo([-23.5505, -46.6333], 13, { duration: 1.5 });
        }

        if (distrito.trim() !== '') {
            fetch('https://raw.githubusercontent.com/codigourbano/distritos-sp/master/distritos-sp.geojson')
                .then(res => res.json()).then(data => {
                    const zonaGeo = data.features.find(f => removerAcentos(f.properties.ds_nome || "") === removerAcentos(distrito));
                    if (zonaGeo) {
                        camadaPoligono = L.geoJSON(zonaGeo, { style: { color: '#3498db', weight: 2, fillOpacity: 0.1 } }).addTo(map);
                        map.flyToBounds(camadaPoligono.getBounds(), { duration: 1.5 });
                    }
                });
        }
    });
}

// --- GRÁFICO ---
let horarioSelecionado = null;
let graficoInstancia = null;

function carregarGrafico() {
    fetch('/estatisticas/horarios').then(res => res.json()).then(dados => {
        const canvas = document.getElementById('graficoHorarios');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (graficoInstancia) graficoInstancia.destroy();

        // 1. A MÁGICA DA ORDENAÇÃO: Força as chaves a ficarem em ordem numérica (00 até 23)
        const horasOrdenadas = Object.keys(dados).sort((a, b) => parseInt(a) - parseInt(b));
        const valoresOrdenados = horasOrdenadas.map(h => dados[h]);

        graficoInstancia = new Chart(ctx, {
            type: 'bar',
            data: {
                // 2. O INTERVALO DE 3 EM 3: Usa a regra do % 3 nas horas já ordenadas
                labels: horasOrdenadas.map((h, index) => index % 3 === 0 ? h + 'h' : ''),
                datasets: [{
                    label: 'Ocorrências',
                    data: valoresOrdenados, // Usa os dados na ordem correta

                    backgroundColor: (context) => {
                        const horaAtual = horasOrdenadas[context.dataIndex];
                        return horarioSelecionado === horaAtual ? '#e74c3c' : '#3498db';
                    },

                    hoverBackgroundColor: '#e74c3c',
                    borderRadius: 6,
                    barPercentage: 0.85
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,

                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        // Pega a hora baseada na nossa nova lista ordenada
                        const horaClicada = horasOrdenadas[index];

                        if (horarioSelecionado === horaClicada) {
                            horarioSelecionado = null;
                        } else {
                            horarioSelecionado = horaClicada;
                        }

                        atualizarInterface();
                        graficoInstancia.update();
                    }
                },

                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#95a5a6',
                            autoSkip: false,  // O SEGREDO: Proíbe o Chart.js de esconder horários
                            maxRotation: 0    // Mantém o texto sempre reto na horizontal
                        }
                    },
                    y: { display: false }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            // Mostra a hora certa no balãozinho
                            title: (items) => `Horário: ${horasOrdenadas[items[0].dataIndex]}h`
                        }
                    }
                }
            }
        });
    });
}

atualizarInterface();

// --- LÓGICA DE BUSCA DE ENDEREÇO POR TEXTO ---
function buscarEndereco() {
    const enderecoInput = document.getElementById('endereco-input').value;

    if (!enderecoInput || enderecoInput.trim() === "") {
        alert("Por favor, introduza um endereço para pesquisar.");
        return;
    }

    // Adicionamos "São Paulo, SP, Brasil" para focar a pesquisa na região correta
    const busca = enderecoInput + ", São Paulo, SP, Brasil";

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(busca)}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);

                // 1. Atualiza os inputs ocultos para o registo na base de dados
                document.getElementById('lat-input').value = lat;
                document.getElementById('lng-input').value = lng;

                // 2. Remove o pino anterior, se existir
                if (tempMarker) map.removeLayer(tempMarker);

                // 3. Adiciona o novo pino no local encontrado
                tempMarker = L.marker([lat, lng]).addTo(map);

                // 4. Faz o voo (zoom) até ao local
                map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });

                // 5. Descobre o distrito exato desse novo ponto para o formulário
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
                    .then(res => res.json())
                    .then(reverseData => {
                        if (reverseData && reverseData.address) {
                            const d = reverseData.address;
                            const distrito = d.suburb || d.city_district || d.neighbourhood || "Desconhecido";
                            document.getElementById('distrito-input').value = distrito;
                        }
                    });
            } else {
                alert("Endereço não encontrado. Tente ser mais específico (ex: Rua Direita, 100).");
            }
        })
        .catch(erro => {
            console.error("Erro na pesquisa de endereço:", erro);
            alert("Ocorreu um erro ao comunicar com o servidor de mapas.");
        });
}

// ====================================================================
// AUTOCOMPLETE DE ENDEREÇOS E BOTÃO X UNIFICADOS
// ====================================================================
const inputEndereco = document.getElementById('endereco-input');
const btnLimparEndereco = document.getElementById('btn-limpar-endereco'); // Declarado apenas aqui!
let timeoutBuscaEndereco;

if (inputEndereco) {
    const caixaSugestoesEnd = document.createElement('div');
    caixaSugestoesEnd.setAttribute('class', 'autocomplete-items');
    inputEndereco.parentNode.style.position = 'relative';
    inputEndereco.parentNode.appendChild(caixaSugestoesEnd);

    let focoAtualEnd = -1;

    // LÓGICA DO BOTÃO "X" (CLIQUE)
    if (btnLimparEndereco) {
        btnLimparEndereco.addEventListener('click', function () {
            inputEndereco.value = '';
            this.style.display = 'none';
            caixaSugestoesEnd.innerHTML = '';

            document.getElementById('lat-input').value = '';
            document.getElementById('lng-input').value = '';
            document.getElementById('distrito-input').value = '';

            if (tempMarker) {
                map.removeLayer(tempMarker);
                tempMarker = null;
            }
            map.flyTo([-23.5505, -46.6333], 13, { animate: true, duration: 1.5 });
        });
    }

    // LÓGICA DE DIGITAÇÃO E AUTOCOMPLETE
    inputEndereco.addEventListener('input', function () {
        const digitado = this.value;

        // Mostra ou esconde o "X" dinamicamente
        if (btnLimparEndereco) {
            btnLimparEndereco.style.display = digitado.length > 0 ? 'block' : 'none';
        }

        // Se o usuário apagar tudo na tecla Backspace, reseta o mapa
        if (digitado.length === 0) {
            if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
            map.flyTo([-23.5505, -46.6333], 13, { animate: true, duration: 1.5 });
            caixaSugestoesEnd.innerHTML = '';
            return;
        }

        caixaSugestoesEnd.innerHTML = '';
        focoAtualEnd = -1;

        if (digitado.length < 4) return;

        clearTimeout(timeoutBuscaEndereco);

        timeoutBuscaEndereco = setTimeout(() => {
            const busca = digitado + ", São Paulo, SP, Brasil";

            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(busca)}&limit=5&addressdetails=1`)
                .then(res => res.json())
                .then(data => {
                    caixaSugestoesEnd.innerHTML = '';

                    data.forEach(local => {
                        const item = document.createElement('div');

                        let end = local.address || {};
                        let pontoReferencia = end.amenity || end.building || end.shop || end.tourism || end.railway || end.office || "";
                        let logradouro = end.road || end.pedestrian || end.square || "Endereço não identificado";
                        let numero = end.house_number ? `, ${end.house_number}` : "";
                        let bairro = end.suburb || end.city_district || end.neighbourhood || "";

                        let baseEndereco = pontoReferencia ? `${pontoReferencia} - ${logradouro}${numero}` : `${logradouro}${numero}`;
                        let bairroFormatado = bairro ? ` (${bairro})` : "";
                        let nomeExibicao = `${baseEndereco}${bairroFormatado}`;

                        if (nomeExibicao.trim().length < 5 || nomeExibicao.includes("undefined")) {
                            nomeExibicao = local.display_name.split(',').slice(0, 3).join(', ');
                        }

                        item.innerHTML = `<strong><i class="fas fa-map-marker-alt" style="color:#e74c3c; margin-right:8px;"></i>${nomeExibicao}</strong>`;

                        item.addEventListener('click', function () {
                            inputEndereco.value = nomeExibicao;
                            caixaSugestoesEnd.innerHTML = '';

                            const lat = parseFloat(local.lat);
                            const lng = parseFloat(local.lon);

                            document.getElementById('lat-input').value = lat;
                            document.getElementById('lng-input').value = lng;

                            if (tempMarker) map.removeLayer(tempMarker);
                            tempMarker = L.marker([lat, lng]).addTo(map);

                            map.flyTo([lat, lng], 17, { animate: true, duration: 1.5 });

                            if (local.address) {
                                const distritoDescoberto = end.suburb || end.city_district || end.neighbourhood;
                                if (distritoDescoberto) {
                                    document.getElementById('distrito-input').value = distritoDescoberto;
                                }
                            }
                        });

                        caixaSugestoesEnd.appendChild(item);
                    });
                })
                .catch(erro => console.error("Erro na busca de endereço.", erro));
        }, 500);
    });

    // NAVEGAÇÃO POR TECLADO
    inputEndereco.addEventListener('keydown', function (e) {
        let itens = caixaSugestoesEnd.getElementsByTagName('div');

        if (e.key === 'ArrowDown') {
            if (itens.length === 0) return;
            focoAtualEnd++;
            adicionarClasseAtivaEnd(itens);
        } else if (e.key === 'ArrowUp') {
            if (itens.length === 0) return;
            focoAtualEnd--;
            adicionarClasseAtivaEnd(itens);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (focoAtualEnd > -1 && itens.length > 0) {
                itens[focoAtualEnd].click();
            } else if (this.value) {
                caixaSugestoesEnd.innerHTML = '';
                buscarEndereco();
            }
        }
    });

    function adicionarClasseAtivaEnd(itens) {
        for (let i = 0; i < itens.length; i++) itens[i].classList.remove('autocomplete-active');
        if (focoAtualEnd >= itens.length) focoAtualEnd = 0;
        if (focoAtualEnd < 0) focoAtualEnd = itens.length - 1;
        itens[focoAtualEnd].classList.add('autocomplete-active');
        itens[focoAtualEnd].scrollIntoView({ block: 'nearest' });
    }

    document.addEventListener('click', (e) => {
        if (e.target !== inputEndereco) {
            caixaSugestoesEnd.innerHTML = '';
        }
    });
}

// ====================================================================
// FEED DE OCORRÊNCIAS E ISOLAMENTO DE MAPA (COM MOSTRAR MAIS)
// ====================================================================
function atualizarFeedList(pontos, limite = 10) {
    const feedLista = document.getElementById('feed-lista');
    if (!feedLista) return;

    // Limpa a lista antes de desenhar (necessário para quando o limite aumenta)
    feedLista.innerHTML = '';

    // Inverte a lista para ter as mais recentes no topo
    const todasOcorrencias = pontos.slice().reverse();

    // Corta a lista baseada no limite atual (10, 20, 30...)
    const itensMostrar = todasOcorrencias.slice(0, limite);

    if (itensMostrar.length === 0) {
        feedLista.innerHTML = '<div style="padding: 15px; text-align: center; color: #95a5a6; font-size: 12px;">Nenhuma ocorrência encontrada.</div>';
        return;
    }

    // Desenha os cartões
    itensMostrar.forEach(p => {
        // Localize este trecho dentro da função atualizarFeedList
        let iconClass = 'fa-question-circle'; let colorHex = '#27ae60'; // Cor para Atividade Suspeita
        if (p.tipo === "Roubo/Furto de Veículo") { iconClass = 'fa-car-side'; colorHex = '#3498db'; }
        else if (p.tipo === "Roubo/Furto a Pedestre") { iconClass = 'fa-mobile-alt'; colorHex = '#8e44ad'; }
        else if (p.tipo === "Agressão Física") { iconClass = 'fa-user-shield'; colorHex = '#e74c3c'; }
        else if (p.tipo === "Vandalismo e Danos") { iconClass = 'fa-spray-can'; colorHex = '#f39c12'; }

        const item = document.createElement('div');
        item.className = 'feed-item';
        const localExibicao = p.distrito ? p.distrito : "Localização Registrada";

        item.innerHTML = `
            <div class="feed-icon" style="color: ${colorHex};"><i class="fas ${iconClass}"></i></div>
            <div class="feed-content">
                <div class="feed-title">${p.tipo}</div>
                <div class="feed-address"><i class="fas fa-map-marker-alt" style="color:#7f8c8d; font-size:10px;"></i> ${localExibicao}</div>
                <div class="feed-time"><i class="far fa-clock" style="color:#7f8c8d; font-size:10px;"></i> ${p.data_hora}</div>
            </div>
        `;

item.addEventListener('click', () => {
            fecharPainel('popup-feed');

            // Limpa os outros pinos para focar no selecionado
            if (map.hasLayer(markerGroup)) map.removeLayer(markerGroup);
            if (typeof pinosSemBolha !== 'undefined' && map.hasLayer(pinosSemBolha)) map.removeLayer(pinosSemBolha);
            if (pinoDestaque) map.removeLayer(pinoDestaque);

            // --- NOVO LAYOUT DO POPUP (Estilo Card Profissional) ---
            const conteudoBolha = `
                <div style="min-width: 180px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border-radius: 4px; overflow: hidden;">
                    <div style="background-color: ${colorHex}; color: white; padding: 10px 14px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas ${iconClass}" style="font-size: 16px; width: 16px; text-align: center;"></i>
                        <strong style="font-size: 14px; margin: 0; letter-spacing: 0.5px; padding-right: 25px;">${p.tipo}</strong>
                    </div>
                    <div style="padding: 12px;">
                        <div style="font-size: 13px; color: #2c3e50; margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px;">
                            <i class="fas fa-map-marker-alt" style="color: ${colorHex}; margin-top: 3px; width: 14px; text-align: center;"></i>
                            <span style="line-height: 1.3;">${localExibicao}</span>
                        </div>
                        <div style="font-size: 12px; color: #7f8c8d; display: flex; align-items: center; gap: 8px; border-top: 1px solid #ecf0f1; padding-top: 8px; margin-top: 10px;">
                            <i class="far fa-clock" style="width: 14px; text-align: center;"></i>
                            <span>${p.data_hora}</span>
                        </div>
                    </div>
                </div>
            `;

            // Cria o pino de destaque e adiciona a classe 'safeview-popup' para remover as bordas
            pinoDestaque = L.marker([p.lat, p.lng], { icon: obterIconePorCrime(p.tipo) }).addTo(map);
            pinoDestaque.bindPopup(conteudoBolha, { className: 'safeview-popup' }).openPopup();

            // Zoom limitado a 16 para evitar o erro do "mapa branco"
            map.flyTo([p.lat, p.lng], 16, { animate: true, duration: 1.5 });
            document.getElementById('btn-reset-mapa').style.display = 'block';
        });

        feedLista.appendChild(item);
    });

    // --- A MÁGICA DO BOTÃO MOSTRAR MAIS ---
    // Verifica se ainda existem itens no banco que não foram mostrados na tela
    if (limite < todasOcorrencias.length) {
        const btnMostrarMais = document.createElement('div');

        // Calcula exatamente quantas ocorrências faltam
        const restantes = todasOcorrencias.length - limite;

        // Adicionamos o contador com uma cor mais suave para não roubar o foco do "Mostrar Mais"
        btnMostrarMais.innerHTML = `Mostrar Mais <span style="color: #95a5a6; font-size: 11px; font-weight: normal; margin: 0 5px;">(${restantes} restantes)</span> <i class="fas fa-chevron-down"></i>`;

        // Estilo CSS (adicionei display: flex para alinhar o texto e o contador perfeitamente)
        btnMostrarMais.style.cssText = 'display: flex; justify-content: center; align-items: center; padding: 12px; color: #3498db; cursor: pointer; font-size: 12px; font-weight: bold; transition: background 0.2s; border-radius: 4px; margin-top: 5px;';

        // Efeito Hover
        btnMostrarMais.onmouseover = () => btnMostrarMais.style.backgroundColor = '#2c3e50';
        btnMostrarMais.onmouseout = () => btnMostrarMais.style.backgroundColor = 'transparent';

        // Ao clicar, recarrega a lista somando +10 ao limite
        btnMostrarMais.addEventListener('click', () => {
            atualizarFeedList(pontos, limite + 10);
        });

        feedLista.appendChild(btnMostrarMais);
    }
}

function restaurarMapa() {
    // 1. Limpa o filtro do gráfico
    horarioSelecionado = null;

    // 2. Limpa os filtros do painel lateral
    if (document.getElementById('filtro-tipo')) document.getElementById('filtro-tipo').value = 'Todos';
    if (document.getElementById('filtro-zona')) document.getElementById('filtro-zona').value = 'Todas';
    if (document.getElementById('filtro-distrito')) document.getElementById('filtro-distrito').value = '';

    if (document.getElementById('btn-limpar-distrito')) {
        document.getElementById('btn-limpar-distrito').style.display = 'none';
    }

    // 3. Remove o pino de destaque
    if (pinoDestaque) {
        map.removeLayer(pinoDestaque);
        pinoDestaque = null;
    }

    // --- A CORREÇÃO MÁGICA ESTÁ AQUI ---
    // Devolve as camadas de pinos para o mapa caso elas tenham sido ocultadas
    if (!map.hasLayer(markerGroup)) map.addLayer(markerGroup);
    if (typeof pinosSemBolha !== 'undefined' && !map.hasLayer(pinosSemBolha)) map.addLayer(pinosSemBolha);
    // -----------------------------------

    // 4. Voo de regresso
    map.flyTo([-23.5505, -46.6333], 13, { animate: true, duration: 1.5 });

    // 5. Atualiza tudo
    atualizarInterface();
    if (graficoInstancia) {
        graficoInstancia.update();
    }
}

// Função para mostrar a notificação elegante
function mostrarToast() {
    const toast = document.getElementById('toast-notificacao');
    if (toast) {
        toast.classList.add('mostrar');
        // Esconde a notificação automaticamente após 3 segundos
        setTimeout(() => {
            toast.classList.remove('mostrar');
        }, 3000);
    }
}

function enviarRegistro() {
    const tipo = document.getElementById('tipo-crime').value;
    const lat = document.getElementById('lat-input').value;
    const lng = document.getElementById('lng-input').value;
    const dataHoraInput = document.getElementById('data-hora-input');
    const dataHora = dataHoraInput ? dataHoraInput.value : '';
    const distrito = document.getElementById('distrito-input').value;

    // 1. Validação
    if (!tipo || !lat || !lng || !dataHora) {
        alert("Por favor, preencha todos os campos obrigatórios e selecione um local no mapa.");
        return;
    }

    // 2. Inteligência de Mapeamento: Descobre a Zona pelo Distrito
    let zona = "Desconhecida";
    const zonasSP = {
        "Centro": ["Sé", "República", "Bela Vista", "Consolação", "Liberdade"],
        "Sul": ["Santo Amaro", "Vila Mariana", "Jabaquara", "Moema", "Ipiranga"],
        "Leste": ["Itaquera", "Tatuapé", "Mooca", "Penha", "Vila Prudente"],
        "Norte": ["Santana", "Tucuruvi", "Freguesia do Ó", "Casa Verde", "Vila Maria"],
        "Oeste": ["Pinheiros", "Lapa", "Butantã", "Vila Madalena", "Perdizes"]
    };
    
    for (const [z, distritos] of Object.entries(zonasSP)) {
        if (distritos.some(d => removerAcentos(d).toLowerCase() === removerAcentos(distrito).toLowerCase())) {
            zona = z;
            break;
        }
    }

    // 3. Formata a data para o padrão do banco
    const dataFormatada = dataHora.replace('T', ' ');

    // 4. Monta o pacote de dados
    const payload = {
        tipo: tipo,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        data_hora: dataFormatada,
        distrito: distrito || "Desconhecido",
        zona: zona
    };

    // 5. Envia para o servidor
    fetch('/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'sucesso') {
            mostrarToast();        // Chama a notificação visual
            fecharModal();         // Fecha o formulário
            atualizarInterface();  // Atualiza as bolinhas no mapa
            carregarGrafico();     // Atualiza a barra do gráfico
        } else {
            alert("Erro ao registrar a ocorrência.");
        }
    })
    .catch(erro => console.error("Erro no registro:", erro));
}

// --- LÓGICA DO CLIQUE NO MAIS FREQUENTE ---
const cardFrequente = document.getElementById('card-frequent');

if (cardFrequente) {
    cardFrequente.addEventListener('click', () => {
        const elementoTexto = document.getElementById('metric-frequent');
        if (!elementoTexto || elementoTexto.innerText === '--') return;

        // 1. Pega o nome exato do crime (remove os parênteses e espaços extras)
        const tipoParaFiltrar = elementoTexto.innerText.split('(')[0].trim();
        
        // 2. O PULO DO GATO: Conecta com o filtro nativo que você já criou!
        const selectTipo = document.getElementById('filtro-tipo');
        if (selectTipo) {
            selectTipo.value = tipoParaFiltrar; // Altera o dropdown "invisivelmente"
            atualizarInterface(); // Roda a sua função principal que já faz o zoom, tira as bolhas e mostra o botão Reset!
        }
    });
}