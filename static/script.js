// --- LÓGICA DE POP-UPS FLUTUANTES ---
function alternarPainel(idPainel) {
    document.querySelectorAll('.painel-flutuante').forEach(painel => {
        if (painel.id !== idPainel) painel.style.display = 'none';
    });

    const painel = document.getElementById(idPainel);
    if (painel.style.display === 'none' || painel.style.display === '') {
        painel.style.display = 'block';
    } else {
        painel.style.display = 'none';
    }
}

function fecharPainel(idPainel) {
    document.getElementById(idPainel).style.display = 'none';
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

// O mapa claro continua normal, tudo em uma imagem só
var mapaClaro = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });

// O mapa escuro é a união do "chão" escuro com as "placas" de texto
var escuroBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
var escuroTextos = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });

var mapaEscuro = L.layerGroup([escuroBase, escuroTextos]);

// Inicia o site com o mapa claro
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

// --- LÓGICA DE REGISTRO DE OCORRÊNCIA ---
map.on('click', function (e) {
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker(e.latlng).addTo(map);
    document.getElementById('lat-input').value = e.latlng.lat;
    document.getElementById('lng-input').value = e.latlng.lng;
    document.getElementById('modal-registro').style.display = 'block';
});

function abrirModalRegistro() {
    document.getElementById('modal-registro').style.display = 'block';
    document.getElementById('endereco-input').value = "";
}

function buscarEndereco() {
    const endereco = document.getElementById('endereco-input').value;
    if (!endereco) {
        alert("Por favor, digite um endereço para buscar.");
        return;
    }

    const query = `${endereco}, São Paulo, SP, Brasil`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);

                document.getElementById('lat-input').value = lat;
                document.getElementById('lng-input').value = lng;

                map.flyTo([lat, lng], 17);

                if (tempMarker) map.removeLayer(tempMarker);
                tempMarker = L.marker([lat, lng]).addTo(map);
            } else {
                alert("Endereço não encontrado. Tente digitar de outra forma (Ex: Rua Augusta, Bela Vista).");
            }
        })
        .catch(error => {
            console.error("Erro na busca de endereço:", error);
            alert("Erro ao buscar o endereço. Verifique sua conexão.");
        });
}

function fecharModal() {
    document.getElementById('modal-registro').style.display = 'none';
    document.getElementById('tipo-crime').selectedIndex = 0;
    if (tempMarker) map.removeLayer(tempMarker);
}

function enviarRegistro() {
    const tipo = document.getElementById('tipo-crime').value;
    const lat = document.getElementById('lat-input').value;
    const lng = document.getElementById('lng-input').value;
    const dataHoraRaw = document.getElementById('data-hora-input').value;

    if (!tipo || !dataHoraRaw) { 
        alert("Por favor, preencha o tipo de crime e o horário."); 
        return; 
    }

    // --- NOVA TRAVA DE SEGURANÇA DO ANO ---
    // Recorta os 4 primeiros caracteres da data (o ano) e transforma em número
    const anoDigitado = parseInt(dataHoraRaw.substring(0, 4));
    const anoAtual = new Date().getFullYear(); // Pega o ano atual automaticamente (2026)

    // Se o ano for menor que 2000 ou maior que o ano atual, barra o registro!
    if (anoDigitado < 2000 || anoDigitado > anoAtual) {
        alert(`Por favor, insira um ano válido (entre 2000 e ${anoAtual}).`);
        return;
    }
    // --------------------------------------

    const dataHoraFormatada = dataHoraRaw.replace('T', ' ') + ':00';
    
    fetch('/registrar', {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            tipo: tipo, 
            lat: parseFloat(lat), 
            lng: parseFloat(lng),
            data_hora: dataHoraFormatada 
        })
    }).then(() => {
        fecharModal(); 
        atualizarInterface();
        if(document.getElementById('popup-grafico').style.display === 'block') carregarGrafico();
    });
}

// DICA: No objeto 'options' do seu Chart.js, adicione isto para não cortar:
// maintainAspectRatio: false,
// layout: { padding: { right: 20, bottom: 20 } }

// --- FUNÇÃO PARA TORNAR JANELAS ARRASTÁVEIS ---
function tornarArrastavel(idModal, idCabecalho) {
    const modal = document.getElementById(idModal);
    const cabecalho = document.getElementById(idCabecalho);

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    cabecalho.onmousedown = iniciarArrasto;

    function iniciarArrasto(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = pararArrasto;
        document.onmousemove = arrastarElemento;
    }

    function arrastarElemento(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        modal.style.right = 'auto';
        modal.style.bottom = 'auto';

        modal.style.top = (modal.offsetTop - pos2) + "px";
        modal.style.left = (modal.offsetLeft - pos1) + "px";
    }

    function pararArrasto() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

tornarArrastavel('modal-registro', 'cabecalho-registro');

// --- ATUALIZAÇÃO DA INTERFACE E FEED ---
function atualizarInterface() {
    fetch('/dados').then(res => res.json()).then(pontos => {
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

            // Removi o ID do pop-up do mapa também para ficar mais limpo
            L.marker([p.lat, p.lng], { icon: obterIconePorCrime(p.tipo) })
                .bindPopup(`<strong>${p.tipo}</strong><br><small>${p.data_hora}</small>`)
                .addTo(markerGroup);

            if (index < 10) {
                // Nova Lógica de Data
                let partes = p.data_hora.split(" ");
                let dataPartes = partes[0].split("-");
                let horaPartes = partes[1].split(":");
                let dataFormatada = `${dataPartes[2]}/${dataPartes[1]}/${dataPartes[0]} às ${horaPartes[0]}:${horaPartes[1]}`;

                // HTML do Feed limpo, sem o ID
                lista.innerHTML += `
                    <div class="feed-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div class="feed-details">
                            <strong>${p.tipo}</strong><br>
                            <small>${dataFormatada}</small>
                        </div>
                    </div>
                `;
            }
        });

        document.getElementById('metric-total').innerText = pontos.length;
        document.getElementById('metric-frequent').innerText = crimeMaisFrequente;
    });
}

atualizarInterface();

// --- LÓGICA DO GRÁFICO (Chart.js) ---
let graficoInstancia = null;

function carregarGrafico() {
    fetch('/estatisticas/horarios')
        .then(res => res.json())
        .then(dados => {
            let labels = [];
            let valores = [];

            // Cria um loop para as 24 horas do dia (00h até 23h)
            for (let i = 0; i < 24; i++) {
                // Formata o número para ter sempre dois dígitos (ex: "09")
                let horaFormatada = i.toString().padStart(2, '0');
                labels.push(horaFormatada + 'h');

                // Se existir crime nessa hora, pega o valor, se não, é 0
                valores.push(dados[horaFormatada] || 0);
            }

            const ctx = document.getElementById('graficoHorarios').getContext('2d');

            // Destrói o gráfico anterior antes de desenhar um novo (evita bugar se clicar várias vezes)
            if (graficoInstancia) {
                graficoInstancia.destroy();
            }

            // Desenha o novo gráfico
            graficoInstancia = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Número de Ocorrências',
                        data: valores,
                        backgroundColor: 'rgba(41, 128, 185, 0.8)', // Azul do seu layout
                        borderColor: 'rgba(41, 128, 185, 1)',
                        borderWidth: 1,
                        borderRadius: 4 // Deixa as pontas das barras arredondadas
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1 // Força o eixo Y a contar apenas números inteiros (1, 2, 3...)
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false } // Esconde a legenda para ficar mais limpo
                    }
                }
            });
        })
        .catch(error => {
            console.error("Erro ao carregar os dados do gráfico:", error);
        });
}