import sqlite3

conn = sqlite3.connect('sibo.db')
cursor = conn.cursor()

# O comando SQL que apaga todas as linhas, mas mantém a tabela intacta
cursor.execute('DELETE FROM ocorrencias')
conn.commit()

conn.close()
print("Banco de dados limpo e zerado para amanhã! 🧹")