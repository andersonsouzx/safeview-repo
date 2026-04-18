// --- LÓGICA DE POP-UPS FLUTUANTES (VERSÃO EXCLUSIVA THE HALLS) ---
function alternarPainel(idPainel) {
    const painel = document.getElementById(idPainel);
    if (painel.style.display === 'block') {
        painel.style.display = 'none';
        return;
    }
    document.querySelectorAll('.painel-flutuante').forEach(p => p.style.display = 'none');
    if (idPainel === 'painel-filtros') {
        painel.style.left = "auto"; 
        painel.style.right = "39px";
        painel.style.top = "200px";
        painel.style.bottom = "auto";
    }
    painel.style.display = 'block';
}

function abrirModalRegistro() {
    const modal = document.getElementById('modal-registro');
    if (modal.style.display === 'block') {
        fecharModal();
        return;
    }
    document.querySelectorAll('.painel-flutuante').forEach(p => p.style.display = 'none');
    modal.style.right = "auto";
    modal.style.left = "30px"; 
    modal.style.bottom = "100px";
    modal.style.top = "auto";
    modal.style.display = 'block';
    
    const inputEndereco = document.getElementById('endereco-input');
    if(inputEndereco) inputEndereco.value = "";
}

function fecharModal() {
    const modal = document.getElementById('modal-registro');
    modal.style.display = 'none';
    if (tempMarker) map.removeLayer(tempMarker);
    const tipo = document.getElementById('tipo-crime');
    if (tipo) tipo.selectedIndex = 0;
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

// --- FUNÇÃO DO BOTÃO DE MODO ESCURO ---
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
    maxClusterRadius: function(zoom) {
        if (zoom <= 11) return 1000;
        if (zoom <= 13) return 250; 
        return 80;                  
    },
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
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker(e.latlng).addTo(map);
    
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    document.getElementById('lat-input').value = lat;
    document.getElementById('lng-input').value = lng;
    
    abrirModalRegistro();
    document.getElementById('endereco-input').value = "Buscando endereço...";

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
        .then(response => response.json())
        .then(data => {
            if (data && data.address) {
                const detalhes = data.address;
                const distrito = detalhes.suburb || detalhes.city_district || detalhes.neighbourhood || detalhes.town || "Desconhecido";
                document.getElementById('distrito-input').value = distrito;
                const rua = detalhes.road || "Rua não identificada";
                const numero = detalhes.house_number ? `, ${detalhes.house_number}` : "";
                document.getElementById('endereco-input').value = rua + numero;
            }
        }).catch(error => console.error("Erro no clique:", error));
});

function buscarEndereco() {
    const inputElement = document.getElementById('endereco-input');
    const endereco = inputElement.value;
    if (!endereco) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${endereco}, São Paulo&addressdetails=1`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = data[0].lat;
                const lon = data[0].lon;
                const detalhes = data[0].address;
                const distrito = detalhes.suburb || detalhes.city_district || detalhes.neighbourhood || detalhes.town || "Desconhecido";
                
                document.getElementById('distrito-input').value = distrito;
                document.getElementById('lat-input').value = lat;
                document.getElementById('lng-input').value = lon;

                map.flyTo([lat, lon], 17, { animate: true, duration: 1.5 });
                if (tempMarker) map.removeLayer(tempMarker);
                tempMarker = L.marker([lat, lon]).addTo(map);
            }
        });
}

// --- RESTAURANDO A FUNÇÃO DE ENVIAR REGISTRO ---
function enviarRegistro() {
    const tipo = document.getElementById('tipo-crime') ? document.getElementById('tipo-crime').value : "Desconhecido";
    const lat = document.getElementById('lat-input').value;
    const lng = document.getElementById('lng-input').value;
    const distrito = document.getElementById('distrito-input').value;
    const zona = document.getElementById('zona-crime') ? document.getElementById('zona-crime').value : "Todas";
    
    // Gera a data atual no formato YYYY-MM-DD HH:MM para salvar no banco
    const agora = new Date();
    const dataHoraFormatada = `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')} ${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    fetch('/registrar', {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            tipo: tipo, 
            lat: parseFloat(lat), 
            lng: parseFloat(lng),
            data_hora: dataHoraFormatada, 
            distrito: distrito, 
            zona: zona
        })
    }).then(() => {
        fecharModal();
        atualizarInterface();
        if (typeof carregarGrafico === "function") carregarGrafico();
    }).catch(error => console.error("Erro ao registrar:", error));
}

// --- JANELAS ARRASTÁVEIS ---
function tornarArrastavel(idModal, idCabecalho) {
    const modal = document.getElementById(idModal);
    const cabecalho = document.getElementById(idCabecalho);
    if(!modal || !cabecalho) return; // Proteção extra
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    cabecalho.style.cursor = 'grab';
    cabecalho.onmousedown = function(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        let topoFixo = modal.offsetTop;
        let esquerdaFixa = modal.offsetLeft;
        modal.style.bottom = 'auto';
        modal.style.top = topoFixo + "px";
        modal.style.left = esquerdaFixa + "px";
        document.onmouseup = pararArrasto;
        document.onmousemove = arrastarElemento;
        cabecalho.style.cursor = 'grabbing';
        document.body.style.cursor = 'grabbing';
    };

    function arrastarElemento(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        modal.style.top = (modal.offsetTop - pos2) + "px";
        modal.style.left = (modal.offsetLeft - pos1) + "px";
    }

    function pararArrasto() {
        document.onmouseup = null;
        document.onmousemove = null;
        cabecalho.style.cursor = 'grab';
        document.body.style.cursor = 'default';
    }
}
tornarArrastavel('modal-registro', 'cabecalho-registro');
tornarArrastavel('painel-filtros', 'cabecalho-filtros');

// ====================================================================
// AUTOCOMPLETE CUSTOMIZADO E UTILITÁRIOS
// ====================================================================
function removerAcentos(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

let listaDistritosOficiais = [];
fetch('https://raw.githubusercontent.com/codigourbano/distritos-sp/master/distritos-sp.geojson')
    .then(res => res.json())
    .then(geoData => {
        const nomes = geoData.features.map(f => f.properties.ds_nome || f.properties.NOME || f.properties.name || "");
        listaDistritosOficiais = [...new Set(nomes)].filter(n => n !== "").map(n => n.trim()).sort();
    });

const inputDistrito = document.getElementById('filtro-distrito');
if (inputDistrito) {
    inputDistrito.removeAttribute('list'); 
    const caixaSugestoes = document.createElement('div');
    caixaSugestoes.setAttribute('class', 'autocomplete-items');
    inputDistrito.parentNode.style.position = 'relative';
    inputDistrito.parentNode.appendChild(caixaSugestoes);

    inputDistrito.addEventListener('input', function() {
        const digitado = this.value;
        caixaSugestoes.innerHTML = '';
        
        // --- NOVO: Se o campo for apagado, reseta o mapa na hora ---
        if (!digitado) {
            atualizarInterface(); 
            return;
        }
        // -----------------------------------------------------------

        const termoLimpo = removerAcentos(digitado);
        const resultados = listaDistritosOficiais.filter(nome => removerAcentos(nome).includes(termoLimpo));

        resultados.forEach(nome => {
            const item = document.createElement('div');
            item.innerHTML = nome;
            item.addEventListener('click', function() {
                inputDistrito.value = nome; 
                caixaSugestoes.innerHTML = ''; 
                // A SOLUÇÃO: Dispara a atualização do mapa na hora que clica na sugestão!
                atualizarInterface(); 
            });
            caixaSugestoes.appendChild(item);
        });
    });

    document.addEventListener('click', function(e) {
        if (e.target !== inputDistrito) caixaSugestoes.innerHTML = '';
    });
}

// --- ATUALIZAÇÃO DA INTERFACE, MAPA E ZOOM INTELIGENTE ---
function atualizarInterface() {
    const tipoSelecionado = document.getElementById('filtro-tipo') ? document.getElementById('filtro-tipo').value : 'Todos';
    const zonaSelecionada = document.getElementById('filtro-zona') ? document.getElementById('filtro-zona').value : 'Todas';
    const distritoDigitado = document.getElementById('filtro-distrito') ? document.getElementById('filtro-distrito').value : '';

    const temFiltroAtivo = (zonaSelecionada !== 'Todas' || tipoSelecionado !== 'Todos' || distritoDigitado.trim() !== '');

    const params = new URLSearchParams();
    if (tipoSelecionado !== 'Todos') params.append('tipo', tipoSelecionado);
    if (zonaSelecionada !== 'Todas') params.append('zona', zonaSelecionada);
    if (distritoDigitado.trim() !== '') params.append('distrito', distritoDigitado.trim());

    fetch(`/dados?${params.toString()}`).then(res => res.json()).then(pontos => {
        markerGroup.clearLayers();
        pinosSemBolha.clearLayers();
        if (camadaPoligono) {
            map.removeLayer(camadaPoligono);
            camadaPoligono = null;
        }

        const lista = document.getElementById('feed-lista');
        if(lista) lista.innerHTML = "";
        
        const contagemCrimes = {};
        let crimeMaisFrequente = "--";
        let maxOcorrencias = 0;

        pontos.forEach((p, index) => {
            contagemCrimes[p.tipo] = (contagemCrimes[p.tipo] || 0) + 1;
            if (contagemCrimes[p.tipo] > maxOcorrencias) {
                maxOcorrencias = contagemCrimes[p.tipo];
                crimeMaisFrequente = p.tipo;
            }

            let marcador = L.marker([p.lat, p.lng], { icon: obterIconePorCrime(p.tipo) })
                .bindPopup(`<strong>${p.tipo}</strong><br><small>${p.data_hora}</small>`);

            if (temFiltroAtivo) {
                pinosSemBolha.addLayer(marcador);
            } else {
                markerGroup.addLayer(marcador);
            }

            if (index < 10 && lista) {
                let partes = p.data_hora.split(" ");
                let dataPartes = partes[0].split("-");
                let horaPartes = partes[1].split(":");
                let dataF = `${dataPartes[2]}/${dataPartes[1]}/${dataPartes[0]} às ${horaPartes[0]}:${horaPartes[1]}`;
                lista.innerHTML += `
                    <div class="feed-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div class="feed-details"><strong>${p.tipo}</strong><br><small>${dataF}</small></div>
                    </div>`;
            }
        });

        const metricTotal = document.getElementById('metric-total');
        const metricFreq = document.getElementById('metric-frequent');
        if (metricTotal) metricTotal.innerText = pontos.length;
        if (metricFreq) metricFreq.innerText = crimeMaisFrequente;

        // ZOOM INTELIGENTE (ESTILO GOOGLE MAPS) E FRONTEIRAS VISUAIS
        if (temFiltroAtivo) {
            if (pontos.length > 0) {
                map.flyToBounds(pinosSemBolha.getBounds(), { padding: [50, 50], duration: 1.5 });
            }

            if (distritoDigitado.trim() !== '') {
                fetch('https://raw.githubusercontent.com/codigourbano/distritos-sp/master/distritos-sp.geojson')
                    .then(res => res.json())
                    .then(geoData => {
                        const zonaGeo = geoData.features.find(f => {
                            const nomeDistrito = f.properties.ds_nome || f.properties.NOME || f.properties.name || "";
                            return removerAcentos(nomeDistrito) === removerAcentos(distritoDigitado.trim());
                        });
                        
                        if (zonaGeo) {
                            camadaPoligono = L.geoJSON(zonaGeo, {
                                style: { color: 'var(--light-blue)', fillColor: 'var(--light-blue)', fillOpacity: 0.15, weight: 2 }
                            }).addTo(map);
                            map.flyToBounds(camadaPoligono.getBounds(), { duration: 1.5 });
                        }
                    }).catch(err => console.log("Erro ao buscar a fronteira de distrito.", err));
            } 
        } else {
            map.flyTo([-23.5505, -46.6333], 13, { animate: true, duration: 1.5 });
        }

    }).catch(error => console.error("Erro ao atualizar interface:", error));
}

// Inicializa o painel ao carregar a página
atualizarInterface();

// --- LÓGICA DO GRÁFICO ---
let graficoInstancia = null;
function carregarGrafico() {
    fetch('/estatisticas/horarios').then(res => res.json()).then(dados => {
        let labels = []; let valores = [];
        for (let i = 0; i < 24; i++) {
            let h = i.toString().padStart(2, '0');
            labels.push(h + 'h'); valores.push(dados[h] || 0);
        }
        const canvas = document.getElementById('graficoHorarios');
        if (!canvas) return; // Evita erro se o gráfico estiver escondido
        
        const ctx = canvas.getContext('2d');
        if (graficoInstancia) graficoInstancia.destroy();
        graficoInstancia = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Ocorrências', data: valores, backgroundColor: '#2980b9' }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    });
}