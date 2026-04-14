import sqlite3

# Conecta ao banco (se não existir, ele cria)
conn = sqlite3.connect('sibo.db')
cursor = conn.cursor()

# Apaga a tabela antiga
cursor.execute('DROP TABLE IF EXISTS ocorrencias')

# Cria a tabela nova com a coluna "distrito"
cursor.execute('''
CREATE TABLE ocorrencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    data_hora TEXT NOT NULL,
    distrito TEXT NOT NULL
)
''')

conn.commit()
conn.close()
print("Banco recriado com sucesso com a coluna 'distrito'!")