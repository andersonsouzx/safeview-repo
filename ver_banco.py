import sqlite3

# Conecta no seu banco
conn = sqlite3.connect('sibo.db')
cursor = conn.cursor()

# Puxa tudo da tabela
cursor.execute("SELECT id, tipo, data_hora FROM ocorrencias")
registros = cursor.fetchall()

print("\n--- OCORRÊNCIAS NO BANCO DE DADOS ---")
if not registros:
    print("O banco está vazio!")
else:
    for r in registros:
        print(f"ID: {r[0]} | Crime: {r[1]} | Data: {r[2]}")
print("-------------------------------------\n")

conn.close()