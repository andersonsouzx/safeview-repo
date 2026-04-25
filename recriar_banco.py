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

    # Dicionário Expandido: Limites geográficos mais amplos para espalhamento orgânico
    zonas_sp = {
        "Centro": {
            "Sé": (-23.555, -23.540, -46.640, -46.620),
            "República": (-23.548, -23.535, -46.650, -46.635),
            "Bela Vista": (-23.568, -23.550, -46.658, -46.640),
            "Consolação": (-23.558, -23.542, -46.668, -46.648),
            "Liberdade": (-23.565, -23.550, -46.638, -46.622)
        },
        "Sul": {
            "Santo Amaro": (-23.665, -23.625, -46.725, -46.680),
            "Vila Mariana": (-23.600, -23.570, -46.650, -46.620),
            "Jabaquara": (-23.655, -23.630, -46.655, -46.630),
            "Moema": (-23.615, -23.590, -46.675, -46.650),
            "Ipiranga": (-23.610, -23.580, -46.625, -46.590)
        },
        "Leste": {
            "Itaquera": (-23.555, -23.520, -46.475, -46.435),
            "Tatuapé": (-23.550, -23.525, -46.585, -46.550),
            "Mooca": (-23.565, -23.540, -46.605, -46.580),
            "Penha": (-23.535, -23.510, -46.555, -46.520),
            "Vila Prudente": (-23.595, -23.570, -46.585, -46.560)
        },
        "Norte": {
            "Santana": (-23.515, -23.490, -46.645, -46.610),
            "Tucuruvi": (-23.485, -23.450, -46.625, -46.590),
            "Freguesia do Ó": (-23.505, -23.480, -46.705, -46.675),
            "Casa Verde": (-23.515, -23.490, -46.675, -46.645),
            "Vila Maria": (-23.525, -23.500, -46.605, -46.580)
        },
        "Oeste": {
            "Pinheiros": (-23.580, -23.550, -46.720, -46.680),
            "Lapa": (-23.540, -23.510, -46.720, -46.690),
            "Butantã": (-23.590, -23.560, -46.745, -46.710),
            "Vila Madalena": (-23.560, -23.540, -46.705, -46.680),
            "Perdizes": (-23.545, -23.525, -46.690, -46.665)
        }
    }

    print("Gerando 400 ocorrências com distribuição orgânica por São Paulo...")

    for _ in range(400):
        zona = random.choice(list(zonas_sp.keys()))
        distrito = random.choice(list(zonas_sp[zona].keys()))
        lat_min, lat_max, lng_min, lng_max = zonas_sp[zona][distrito]
        
        lat = round(random.uniform(lat_min, lat_max), 6)
        lng = round(random.uniform(lng_min, lng_max), 6)
        
        if zona in ["Centro", "Oeste"]:
            tipo = random.choices(
                ["Roubo/Furto a Pedestre", "Roubo/Furto de Veículo", "Agressão Física", "Vandalismo e Danos", "Atividade Suspeita"], 
                weights=[45, 15, 10, 20, 10], k=1
            )[0]
        else:
            tipo = random.choices(
                ["Roubo/Furto a Pedestre", "Roubo/Furto de Veículo", "Agressão Física", "Vandalismo e Danos", "Atividade Suspeita"], 
                weights=[20, 45, 10, 10, 15], k=1
            )[0]

        data = datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23), minutes=random.randint(0, 59))
        data_str = data.strftime("%Y-%m-%d %H:%M")

        cursor.execute('''
            INSERT INTO ocorrencias (tipo, lat, lng, data_hora, distrito, zona)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (tipo, lat, lng, data_str, distrito, zona))

    conn.commit()
    conn.close()
    print("Banco populado com sucesso! A cidade agora tem um mapa de calor realista.")

if __name__ == "__main__":
    recriar_banco_realista()