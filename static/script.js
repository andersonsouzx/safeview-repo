// --- LÓGICA DE POP-UPS FLUTUANTES (VERSÃO REVISADA THE HALLS) ---

function alternarPainel(idPainel) {
    // Fecha todos os outros painéis (exceto o de registro) para não poluir o mapa
    document.querySelectorAll('.painel-flutuante').forEach(p => {
        if (p.id !== idPainel && p.id !== 'modal-registro') {
            p.style.display = 'none';
        }
    });

    const painel = document.getElementById(idPainel);

    if (painel.style.display === 'none' || painel.style.display === '') {
        // RESET DE POSIÇÃO: Apaga as coordenadas do arrasto para ele voltar ao canto esquerdo original
        if (idPainel === 'painel-filtros') {
            painel.style.top = "";
            painel.style.left = "";
            painel.style.bottom = "20px"; // Garante a âncora no chão
        }
        painel.style.display = 'block';
    } else {
        painel.style.display = 'none';
    }
}

function abrirModalRegistro() {
    const modal = document.getElementById('modal-registro');
    
    // Se clicar no menu com ele aberto, ele fecha (comportamento de alternar)
    if (modal.style.display === 'block') {
        fecharModal();
        return;
    }

    // RESET DE POSIÇÃO: Garante que o registro nasça no lugar certo após ser arrastado
    modal.style.top = "";
    modal.style.left = "";
    modal.style.bottom = "20px";
    
    modal.style.display = 'block';
    
    // Limpa campos anteriores
    const inputEndereco = document.getElementById('endereco-input');
    if(inputEndereco) inputEndereco.value = "";
}

function fecharPainel(idPainel) {
    document.getElementById(idPainel).style.display = 'none';
}

function fecharModal() {
    const modal = document.getElementById('modal-registro');
    modal.style.display = 'none';
    if (tempMarker) map.removeLayer(tempMarker);
    const tipo = document.getElementById('tipo-crime');
    if (tipo) tipo.selectedIndex = 0;
}

// --- CONFIGURAÇÃO DO MAPA ---
var southWest = L.latLng(-23.85, -46.90);
var northEast = L.latLng(-23.35, -46.30);
var bounds = L.latLngBounds(southWest, northEast);

var map = L.map('map', {
    center: [-23.5505, -46.6333],
    zoom: 13,
    minZoom: 10,
    maxZoom: 18
});

document.getElementById('btn-reposicionar').addEventListener('click', function () {
    map.flyTo([-23.5505, -46.6333], 13, {
        animate: true,
        duration: 1.5
    });
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

// --- CONFIGURAÇÕES DE CAMADAS ADICIONAIS (Calor e Pinos) ---
var heatLayer = L.heatLayer([], {
    radius: 35, blur: 20, maxZoom: 14,
    gradient: { 0.3: 'blue', 0.6: '#e67e22', 1.0: '#c0392b' }
}).addTo(map);

function calibrarCalorAoZoomar() {
    var zoomAtual = map.getZoom();
    var novoRaio = 35 - (zoomAtual - 13) * 3;
    var novoBlur = 20 - (zoomAtual - 13) * 2;
    if (novoRaio < 10) novoRaio = 10;
    if (novoBlur < 8) novoBlur = 8;
    heatLayer.setOptions({ radius: novoRaio, blur: novoBlur });
}
map.on('zoomend', calibrarCalorAoZoomar);

var markerGroup = L.layerGroup().addTo(map);
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

// --- LÓGICA DE CLIQUE NO MAPA ---
map.on('click', function (e) {
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker(e.latlng).addTo(map);
    
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    document.getElementById('lat-input').value = lat;
    document.getElementById('lng-input').value = lng;
    
    // Abre o modal de registro na posição inicial
    abrirModalRegistro();

    document.getElementById('endereco-input').value = "Buscando endereço...";

    const urlReverse = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    fetch(urlReverse)
        .then(response => response.json())
        .then(data => {
            if (data && data.address) {
                const detalhes = data.address;
                const distrito = detalhes.suburb || detalhes.city_district || detalhes.neighbourhood || detalhes.town || "Desconhecido";
                document.getElementById('distrito-input').value = distrito;
                
                const rua = detalhes.road || "Rua não identificada";
                const numero = detalhes.house_number ? `, ${detalhes.house_number}` : "";
                const enderecoCompleto = rua + numero;

                document.getElementById('endereco-input').value = enderecoCompleto;
            }
        })
        .catch(error => console.error("Erro no clique:", error));
});

function buscarEndereco() {
    const inputElement = document.getElementById('endereco-input');
    const endereco = inputElement.value;
    if (!endereco) return;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${endereco}, São Paulo&addressdetails=1`;

    fetch(url)
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

function enviarRegistro() {
    const tipo = document.getElementById('tipo-crime').value;
    const lat = document.getElementById('lat-input').value;
    const lng = document.getElementById('lng-input').value;
    const dataHoraRaw = document.getElementById('data-hora-input').value;
    const distrito = document.getElementById('distrito-input').value;

    if (!tipo || !dataHoraRaw || !lat || !lng) { 
        alert("Preencha todos os campos."); 
        return; 
    }

    const dataHoraFormatada = dataHoraRaw.replace('T', ' ') + ':00';
    
    fetch('/registrar', {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            tipo: tipo, lat: parseFloat(lat), lng: parseFloat(lng),
            data_hora: dataHoraFormatada, distrito: distrito
        })
    }).then(() => {
        fecharModal(); 
        atualizarInterface();
        if(document.getElementById('popup-grafico').style.display === 'block') carregarGrafico();
    });
}

// --- FUNÇÃO PARA TORNAR JANELAS ARRASTÁVEIS (VERSÃO BLINDADA) ---
function tornarArrastavel(idModal, idCabecalho) {
    const modal = document.getElementById(idModal);
    const cabecalho = document.getElementById(idCabecalho);
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    cabecalho.style.cursor = 'grab';
    cabecalho.onmousedown = iniciarArrasto;

    function iniciarArrasto(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;

        // SEGREDO: Salva a posição ANTES de mudar a âncora
        let topoFixo = modal.offsetTop;
        let esquerdaFixa = modal.offsetLeft;

        modal.style.bottom = 'auto';
        modal.style.top = topoFixo + "px";
        modal.style.left = esquerdaFixa + "px";

        document.onmouseup = pararArrasto;
        document.onmousemove = arrastarElemento;
        cabecalho.style.cursor = 'grabbing';
        document.body.style.cursor = 'grabbing';
    }

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

// Inicia os arrastos
tornarArrastavel('modal-registro', 'cabecalho-registro');
tornarArrastavel('painel-filtros', 'cabecalho-filtros');

// --- ATUALIZAÇÃO DA INTERFACE E FEED ---
function atualizarInterface() {
    const filtroDropdown = document.getElementById('filtro-tipo');
    const tipoSelecionado = filtroDropdown ? filtroDropdown.value : 'Todos';

    let url = '/dados';
    if (tipoSelecionado !== 'Todos') {
        url = `/dados?tipo=${encodeURIComponent(tipoSelecionado)}`;
    }

    fetch(url).then(res => res.json()).then(pontos => {
        markerGroup.clearLayers();
        const coordsCalor = pontos.map(p => [p.lat, p.lng]);
        heatLayer.setLatLngs(coordsCalor);

        const lista = document.getElementById('feed-lista');
        lista.innerHTML = "";
        const contagemCrimes = {};
        let crimeMaisFrequente = "--";
        let maxOcorrencias = 0;

        pontos.forEach((p, index) => {
            contagemCrimes[p.tipo] = (contagemCrimes[p.tipo] || 0) + 1;
            if (contagemCrimes[p.tipo] > maxOcorrencias) {
                maxOcorrencias = contagemCrimes[p.tipo];
                crimeMaisFrequente = p.tipo;
            }

            L.marker([p.lat, p.lng], { icon: obterIconePorCrime(p.tipo) })
                .bindPopup(`<strong>${p.tipo}</strong><br><small>${p.data_hora}</small>`)
                .addTo(markerGroup);

            if (index < 10) {
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

        document.getElementById('metric-total').innerText = pontos.length;
        document.getElementById('metric-frequent').innerText = crimeMaisFrequente;
    });
}

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
        const ctx = document.getElementById('graficoHorarios').getContext('2d');
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