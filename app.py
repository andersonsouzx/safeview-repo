from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime

def get_db_connection():
    conn = sqlite3.connect('sibo.db')
    conn.row_factory = sqlite3.Row 
    return conn

app = Flask(__name__)

# 1. Configuração do Banco de Dados (Atualizada com todas as colunas)
def init_db():
    conn = sqlite3.connect('sibo.db')
    cursor = conn.cursor()
    # Criando a tabela já com distrito e zona para evitar erros de "coluna inexistente"
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ocorrencias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            data_hora TEXT NOT NULL,
            distrito TEXT NOT NULL,
            zona TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# NOVA ROTA: A página de entrada (Landing Page) que o usuário vê primeiro
@app.route('/')
def landing():
    return render_template('landing.html')

# A ROTA ANTIGA DO MAPA: Agora acessada pelo botão da Landing Page
@app.route('/mapa')
def index():
    return render_template('index.html')

# 3. Rota de Registro (Atualizada para salvar a ZONA)
@app.route('/registrar', methods=['POST'])
def registrar():
    data = request.get_json()
    tipo = data['tipo']
    lat = data['lat']
    lng = data['lng']
    data_hora = data['data_hora']
    distrito = data.get('distrito', 'Desconhecido')
    zona = data.get('zona', 'Desconhecida') # Captura a zona vinda do JS

    conn = get_db_connection()
    # Incluindo zona no INSERT
    conn.execute('''
        INSERT INTO ocorrencias (tipo, lat, lng, data_hora, distrito, zona) 
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (tipo, lat, lng, data_hora, distrito, zona))
    conn.commit()
    conn.close()

    return jsonify({'status': 'sucesso'})

# 4. Rota de Dados (Filtros Corrigidos)
@app.route('/dados')
def dados():
    tipo_filtro = request.args.get('tipo', 'Todos')
    distrito_filtro = request.args.get('distrito', '').strip()
    zona_filtro = request.args.get('zona', 'Todas')

    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM ocorrencias WHERE 1=1"
    parametros = []

    if tipo_filtro != 'Todos':
        query += " AND tipo = ?"
        parametros.append(tipo_filtro)
        
    if distrito_filtro:
        query += " AND distrito LIKE ?"
        parametros.append(f"%{distrito_filtro}%")

    if zona_filtro != 'Todas':
        query += " AND zona = ?"
        parametros.append(zona_filtro)

    query += " ORDER BY data_hora DESC"
    
    cursor.execute(query, parametros)
    ocorrencias = cursor.fetchall()
    conn.close()

    dados_formatados = []
    for linha in ocorrencias:
        dados_formatados.append({
            'id': linha['id'],
            'tipo': linha['tipo'],
            'lat': linha['lat'],
            'lng': linha['lng'],
            'data_hora': linha['data_hora'],
            'distrito': linha['distrito'],
            'zona': linha['zona']
        })

    return jsonify(dados_formatados)

# 5. Rota de Estatísticas
@app.route('/estatisticas/horarios')
def estatisticas_horarios():
    conn = sqlite3.connect('sibo.db')
    cursor = conn.cursor()
    cursor.execute('SELECT substr(data_hora, 12, 2) as hora, COUNT(*) as total FROM ocorrencias GROUP BY hora')
    resultados = cursor.fetchall()
    conn.close()
    dados_horarios = {linha[0]: linha[1] for linha in resultados if linha[0]}
    return jsonify(dados_horarios)

if __name__ == '__main__':
    init_db()
    app.run(debug=True)