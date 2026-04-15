import sqlite3
import random
from datetime import datetime, timedelta

def recriar_banco_realista():
    conn = sqlite3.connect('sibo.db')
    cursor = conn.cursor()
    cursor.execute('DROP TABLE IF EXISTS ocorrencias')
    cursor.execute('''
        CREATE TABLE ocorrencias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            data_hora TEXT NOT NULL,
            distrito TEXT NOT NULL,
            zona TEXT NOT NULL
        )
    ''')

    # Dicionário Realista: Limites (Lat Mínima, Lat Máxima, Lng Mínima, Lng Máxima)
    # Isso permite que os pinos fiquem ESPALHADOS pelas ruas do bairro, sem sair dele!
    locais_sp = {
        "Centro": {
            "Sé": (-23.5550, -23.5450, -46.6380, -46.6280),
            "República": (-23.5460, -23.5380, -46.6480, -46.6380),
            "Bela Vista": (-23.5650, -23.5520, -46.6550, -46.6400),
            "Consolação": (-23.5550, -23.5420, -46.6650, -46.6500)
        },
        "Norte": {
            "Santana": (-23.5080, -23.4900, -46.6350, -46.6150),
            "Tucuruvi": (-23.4850, -23.4700, -46.6150, -46.5950),
            "Casa Verde": (-23.5100, -23.4950, -46.6600, -46.6400),
            "Freguesia do Ó": (-23.5050, -23.4850, -46.7050, -46.6800)
        },
        "Sul": {
            "Vila Mariana": (-23.5950, -23.5800, -46.6450, -46.6250),
            "Santo Amaro": (-23.6600, -23.6450, -46.7200, -46.6900),
            "Jabaquara": (-23.6550, -23.6350, -46.6500, -46.6300),
            "Ipiranga": (-23.6000, -23.5850, -46.6150, -46.5950)
        },
        "Leste": {
            "Tatuapé": (-23.5450, -23.5300, -46.5850, -46.5600),
            "Itaquera": (-23.5450, -23.5300, -46.4700, -46.4500),
            "Mooca": (-23.5600, -23.5450, -46.6050, -46.5850),
            "Penha": (-23.5300, -23.5150, -46.5500, -46.5300)
        },
        "Oeste": {
            "Pinheiros": (-23.5750, -23.5550, -46.7050, -46.6850),
            "Lapa": (-23.5350, -23.5150, -46.7150, -46.6900),
            "Butantã": (-23.5800, -23.5600, -46.7350, -46.7100),
            "Perdizes": (-23.5450, -23.5300, -46.6850, -46.6650)
        }
    }

    tipos_crime_gerais = [
        "Roubo a Pedestre (com ameaça)", "Furto a Pedestre (sem violência)",
        "Roubo de Veículo", "Furto de Veículo", "Agressão Física",
        "Vandalismo / Dano ao Patrimônio", "Tráfico de Drogas",
        "Perturbação do Sossego", "Atividade Suspeita"
    ]

    dados_para_inserir = []
    
    # Gerando 150 ocorrências para um Mapa de Calor (Heatmap) bem preenchido!
    for _ in range(150):
        # 1. Sorteia a zona dando um peso maior para o Centro (mais movimentado)
        zona = random.choices(list(locais_sp.keys()), weights=[30, 15, 20, 20, 15], k=1)[0]
        
        # 2. Sorteia o distrito dentro daquela zona
        distrito = random.choice(list(locais_sp[zona].keys()))
        
        # 3. Pega os limites do distrito
        lat_min, lat_max, lng_min, lng_max = locais_sp[zona][distrito]
        
        # 4. Gera a coordenada ESPALHADA dentro do limite do distrito
        lat = round(random.uniform(lat_min, lat_max), 6)
        lng = round(random.uniform(lng_min, lng_max), 6)
        
        # 5. Lógica de Vida Real para Tipos de Crimes
        if zona == "Centro":
            # No centro, muita incidência de furto e roubo a pedestre
            tipo = random.choices(["Furto a Pedestre (sem violência)", "Roubo a Pedestre (com ameaça)", "Tráfico de Drogas", "Vandalismo / Dano ao Patrimônio"], weights=[40, 30, 20, 10], k=1)[0]
        else:
            # Nas outras zonas, aumento estatístico em roubo/furto de veículos
            tipo = random.choices(tipos_crime_gerais, weights=[10, 10, 25, 25, 5, 5, 5, 10, 5], k=1)[0]

        # 6. Data e Hora variada no último mês (para o gráfico de horários ficar dinâmico)
        data = datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23), minutes=random.randint(0, 59))
        data_str = data.strftime("%Y-%m-%d %H:%M:00")

        dados_para_inserir.append((tipo, lat, lng, data_str, distrito, zona))

    cursor.executemany('INSERT INTO ocorrencias (tipo, lat, lng, data_hora, distrito, zona) VALUES (?, ?, ?, ?, ?, ?)', dados_para_inserir)
    conn.commit()
    conn.close()
    print("✅ Banco recriado com 150 ocorrências espalhadas, realistas e 100% filtráveis!")

if __name__ == "__main__":
    recriar_banco_realista()