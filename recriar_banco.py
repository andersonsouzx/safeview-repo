import sqlite3
import random
from datetime import datetime, timedelta

# O SEGREDO DO CONGELAMENTO: Esta semente garante que os dados gerados 
# sejam sempre idênticos, criando uma base de dados "fixa" e segura para a apresentação.
random.seed(42)

def gerar_hora_realista(tipo):
    """Gera um horário baseado no comportamento real de cada tipo de crime."""
    horas = list(range(24))
    
    if tipo == "Roubo/Furto a Pedestre":
        # Picos agressivos na hora de ponta (17h-20h) e almoço.
        pesos = [1, 1, 1, 1, 1, 3, 8, 12, 10, 8, 6, 8, 15, 14, 10, 10, 15, 20, 18, 12, 8, 5, 3, 2]
    elif tipo == "Roubo/Furto de Veículo":
        pesos = [4, 3, 2, 2, 2, 2, 5, 8, 6, 5, 5, 5, 6, 6, 6, 6, 8, 10, 12, 15, 18, 15, 12, 8]
    elif tipo == "Vandalismo e Danos":
        pesos = [15, 20, 18, 15, 10, 5, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 5, 8, 10, 12, 12]
    elif tipo == "Agressão Física":
        pesos = [12, 15, 12, 8, 5, 2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5, 6, 8, 10, 12, 15, 15, 15]
    else: # Atividade Suspeita
        pesos = [8, 8, 8, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 8, 8, 10, 12, 12, 12, 10, 10, 8]
        
    return random.choices(horas, weights=pesos, k=1)[0]

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

    print("A gerar 428 ocorrências fixas para a demonstração do SafeView...")

    # Fixado em 428 registos
    for _ in range(428):
        zona = random.choice(list(zonas_sp.keys()))
        distrito = random.choice(list(zonas_sp[zona].keys()))
        lat_min, lat_max, lng_min, lng_max = zonas_sp[zona][distrito]
        
        lat = round(random.uniform(lat_min, lat_max), 6)
        lng = round(random.uniform(lng_min, lng_max), 6)
        
        # O PULO DO GATO: Distribuição equilibrada para a demonstração (Mix de cores no mapa)
        if distrito in ["Pinheiros", "Sé", "República", "Consolação", "Vila Madalena"]:
            # Reduzimos o pedestre de 80% para 50% para dar espaço aos outros
            tipo = random.choices(
                ["Roubo/Furto a Pedestre", "Roubo/Furto de Veículo", "Agressão Física", "Vandalismo e Danos", "Atividade Suspeita"], 
                weights=[50, 15, 15, 10, 10], k=1
            )[0]
        elif zona in ["Leste", "Sul", "Norte"]:
            # Mantemos o foco em veículos nas áreas residenciais, mas bem distribuído
            tipo = random.choices(
                ["Roubo/Furto a Pedestre", "Roubo/Furto de Veículo", "Agressão Física", "Vandalismo e Danos", "Atividade Suspeita"], 
                weights=[30, 40, 10, 10, 10], k=1
            )[0]
        else:
            # Áreas mistas
            tipo = random.choices(
                ["Roubo/Furto a Pedestre", "Roubo/Furto de Veículo", "Agressão Física", "Vandalismo e Danos", "Atividade Suspeita"], 
                weights=[35, 30, 15, 10, 10], k=1
            )[0]

        dias_atras = random.randint(0, 30)
        hora_inteligente = gerar_hora_realista(tipo)
        minuto_aleatorio = random.randint(0, 59)
        
        data = datetime.now() - timedelta(days=dias_atras)
        data = data.replace(hour=hora_inteligente, minute=minuto_aleatorio)
        data_str = data.strftime("%Y-%m-%d %H:%M")

        cursor.execute('''
            INSERT INTO ocorrencias (tipo, lat, lng, data_hora, distrito, zona)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (tipo, lat, lng, data_str, distrito, zona))

    conn.commit()
    conn.close()
    print("Base de dados finalizada! Os dados estão congelados e prontos para uso.")

if __name__ == "__main__":
    recriar_banco_realista()