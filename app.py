from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime

def get_db_connection():
    conn = sqlite3.connect('sibo.db')
    conn.row_factory = sqlite3.Row  # Isso permite acessar as colunas pelo nome (ex: linha['distrito'])
    return conn

app = Flask(__name__)

# 1. Configuração do Banco de Dados com Carga Inicial
def init_db():
    conn = sqlite3.connect('sibo.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ocorrencias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            data_hora TEXT NOT NULL
        )
    ''')
    
    # SEEDING: Insere dados falsos se o banco estiver zerado
    '''cursor.execute("SELECT COUNT(*) FROM ocorrencias")
    if cursor.fetchone()[0] == 0:
        print("Banco vazio! Inserindo ocorrências fictícias iniciais...")
        dados_ficticios = [
            ("Roubo a Pedestre (com ameaça)", -23.5505, -46.6333, "2026-03-18 14:30:00"),
            ("Furto de Veículo", -23.5611, -46.6559, "2026-03-18 09:15:00"),
            ("Vandalismo / Dano ao Patrimônio", -23.5489, -46.6388, "2026-03-19 02:00:00"),
            ("Atividade Suspeita", -23.5550, -46.6400, "2026-03-19 10:45:00"),
            ("Roubo de Veículo", -23.5400, -46.6300, "2026-03-17 22:10:00"),
            ("Agressão Física", -23.5590, -46.6310, "2026-03-19 13:20:00")
        ]
        cursor.executemany("INSERT INTO ocorrencias (tipo, lat, lng, data_hora) VALUES (?, ?, ?, ?)", dados_ficticios)'''
        
    conn.commit()
    conn.close()

# 2. Rota Principal
@app.route('/')
def index():
    return render_template('index.html')

# 3. Rota para Receber as Ocorrências (AGORA BLINDADA)
@app.route('/registrar', methods=['POST'])
def registrar():
    data = request.get_json()
    tipo = data['tipo']
    lat = data['lat']
    lng = data['lng']
    data_hora = data['data_hora']
    distrito = data.get('distrito', 'Desconhecido') # Captura o distrito

    conn = get_db_connection()
    # Adiciona o distrito no INSERT
    conn.execute('INSERT INTO ocorrencias (tipo, lat, lng, data_hora, distrito) VALUES (?, ?, ?, ?, ?)',
                 (tipo, lat, lng, data_hora, distrito))
    conn.commit()
    conn.close()

    return jsonify({'status': 'sucesso'})

# 4. Rota para Alimentar o Mapa e o Feed (AGORA COM O ID)
@app.route('/dados')
def dados():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. O "pulo do gato": lendo a carta que o JavaScript enviou
    tipo_filtro = request.args.get('tipo')

    # 2. A inteligência do filtro no Banco de Dados
    if tipo_filtro and tipo_filtro != 'Todos':
        # Se tem um filtro específico, usa o WHERE para buscar só aquele crime
        cursor.execute('SELECT * FROM ocorrencias WHERE tipo = ?', (tipo_filtro,))
    else:
        # Se for "Todos" ou a página acabou de carregar, puxa tudo
        cursor.execute('SELECT * FROM ocorrencias')
        
    ocorrencias = cursor.fetchall()
    conn.close()

    # 3. Montando o pacote para devolver ao mapa
    dados_formatados = []
    for linha in ocorrencias:
        dados_formatados.append({
            'id': linha['id'],
            'tipo': linha['tipo'],
            'lat': linha['lat'],
            'lng': linha['lng'],
            'data_hora': linha['data_hora'],
            'distrito': linha['distrito'] # Garantindo que o distrito desça pro front
        })

    return jsonify(dados_formatados)

# 5. Rota para Alimentar o Gráfico de Horários
@app.route('/estatisticas/horarios')
def estatisticas_horarios():
    conn = sqlite3.connect('sibo.db')
    cursor = conn.cursor()
    
    # O SQLite recorta a string da data ("2026-03-18 14:30:00") para pegar só o "14"
    # E já conta quantos crimes aconteceram naquela hora
    cursor.execute('''
        SELECT substr(data_hora, 12, 2) as hora, COUNT(*) as total 
        FROM ocorrencias 
        GROUP BY hora
    ''')
    
    resultados = cursor.fetchall()
    conn.close()
    
    # Transforma o resultado num dicionário, ex: {"14": 5, "02": 1, "22": 3}
    dados_horarios = {linha[0]: linha[1] for linha in resultados if linha[0]}
    
    return jsonify(dados_horarios)

if __name__ == '__main__':
    init_db()
    app.run(debug=True)