from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime

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
    cursor.execute("SELECT COUNT(*) FROM ocorrencias")
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
        cursor.executemany("INSERT INTO ocorrencias (tipo, lat, lng, data_hora) VALUES (?, ?, ?, ?)", dados_ficticios)
        
    conn.commit()
    conn.close()

# 2. Rota Principal
@app.route('/')
def index():
    return render_template('index.html')

# 3. Rota para Receber as Ocorrências
@app.route('/registrar', methods=['POST'])
def registrar():
    data = request.json
    agora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    conn = sqlite3.connect('sibo.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO ocorrencias (tipo, lat, lng, data_hora) VALUES (?, ?, ?, ?)",
                   (data['tipo'], data['lat'], data['lng'], agora))
    conn.commit()
    conn.close()
    
    return jsonify({"status": "sucesso", "mensagem": "Ocorrência registrada!"})

# 4. Rota para Alimentar o Mapa e o Feed (AGORA COM O ID)
@app.route('/dados')
def dados():
    conn = sqlite3.connect('sibo.db')
    cursor = conn.cursor()
    # Pega todos os registros INCLUINDO O ID
    cursor.execute("SELECT id, tipo, lat, lng, data_hora FROM ocorrencias ORDER BY id DESC")
    registros = cursor.fetchall()
    conn.close()
    
    # Formata os dados enviando o ID para o JavaScript
    pontos = [{"id": r[0], "tipo": r[1], "lat": r[2], "lng": r[3], "data_hora": r[4]} for r in registros]
    return jsonify(pontos)

if __name__ == '__main__':
    init_db()
    app.run(debug=True)