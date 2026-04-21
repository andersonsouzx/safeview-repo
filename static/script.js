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
    if(inputEndereco) inputEndereco.value = "";
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
    maxZoom: 18
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

function obterIconePorCrime(tipo) {
    let iconClass = 'fa-question-circle'; let colorClass = 'marker-other';
    if (tipo.includes("Veículo")) { iconClass = 'fa-car-side'; colorClass = 'marker-car'; }
    else if (tipo.includes("Pedestre") || tipo.includes("Celular")) { iconClass = 'fa-mobile-alt'; colorClass = 'marker-phone'; }
    else if (tipo.includes("Agressão")) { iconClass = 'fa-user-shield'; colorClass = 'marker-person'; }
    else if (tipo.includes("Vandalismo")) { iconClass = 'fa-spray-can'; colorClass = 'marker-vandal'; }

    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="custom-map-pin ${colorClass}"><i class="fas ${iconClass}"></i></div>`,
        iconSize: [30, 30], iconAnchor: [15, 30]
    });
}

// --- LÓGICA DE CLIQUE E ENDEREÇO ---
map.on('click', function (e) {
    // 1. Atualiza o pino no novo local clicado
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker(e.latlng).addTo(map);
    
    // --- A MÁGICA DO VOO ENTRA AQUI ---
    // Centraliza o mapa no ponto clicado com zoom 17 e uma animação de 1.5 segundos
    map.flyTo(e.latlng, 17, { animate: true, duration: 1.5 });
    
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
        btnLimparDistrito.addEventListener('click', function() {
            inputDistrito.value = '';           // Apaga o texto
            this.style.display = 'none';        // Esconde o botão X
            caixaSugestoes.innerHTML = '';      // Esconde a lista
            atualizarInterface();               // Reseta o mapa
            inputDistrito.focus();              // Devolve o cursor piscando na caixa
        });
    }

    inputDistrito.addEventListener('input', function() {
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
            item.addEventListener('click', function() {
                inputDistrito.value = this.innerText;
                caixaSugestoes.innerHTML = ''; 
                atualizarInterface(); 
            });
            caixaSugestoes.appendChild(item);
        });
    });

    inputDistrito.addEventListener('keydown', function(e) {
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
    const temFiltro = (zona !== 'Todas' || tipo !== 'Todos' || distrito.trim() !== '');

    const params = new URLSearchParams();
    if (tipo !== 'Todos') params.append('tipo', tipo);
    if (zona !== 'Todas') params.append('zona', zona);
    if (distrito.trim() !== '') params.append('distrito', distrito.trim());

    fetch(`/dados?${params.toString()}`).then(res => res.json()).then(pontos => {
        markerGroup.clearLayers();
        pinosSemBolha.clearLayers();
        if (camadaPoligono) { map.removeLayer(camadaPoligono); camadaPoligono = null; }

        const metricTotal = document.getElementById('metric-total');
        if(metricTotal) metricTotal.innerText = pontos.length;

        pontos.forEach(p => {
            let m = L.marker([p.lat, p.lng], { icon: obterIconePorCrime(p.tipo) })
                     .bindPopup(`<strong>${p.tipo}</strong><br><small>${p.data_hora}</small>`);
            temFiltro ? pinosSemBolha.addLayer(m) : markerGroup.addLayer(m);
        });

        if (temFiltro && pontos.length > 0) {
            map.flyToBounds(pinosSemBolha.getBounds(), { padding: [50, 50], duration: 1.5 });
        } else if (!temFiltro) {
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
let graficoInstancia = null;
function carregarGrafico() {
    fetch('/estatisticas/horarios').then(res => res.json()).then(dados => {
        const canvas = document.getElementById('graficoHorarios');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        if (graficoInstancia) graficoInstancia.destroy();
        graficoInstancia = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(dados).map(h => h + 'h'),
                datasets: [{ label: 'Ocorrências', data: Object.values(dados), backgroundColor: '#2980b9' }]
            },
            options: { responsive: true }
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
                map.flyTo([lat, lng], 17, { animate: true, duration: 1.5 });

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
        btnLimparEndereco.addEventListener('click', function() {
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
    inputEndereco.addEventListener('input', function() {
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
                        
                        item.addEventListener('click', function() {
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
    inputEndereco.addEventListener('keydown', function(e) {
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