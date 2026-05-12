import sqlite3

# Conecta ao banco de dados
conn = sqlite3.connect('sibo.db')
cursor = conn.cursor()

# ---------------------------------------------------------
# COLOQUE AQUI O ID DA OCORRÊNCIA QUE VOCÊ QUER APAGAR:
id_para_apagar = 428
# ---------------------------------------------------------

# Comando SQL para deletar a ocorrência específica
cursor.execute("DELETE FROM ocorrencias WHERE id = ?", (id_para_apagar,))

# Salva e fecha
conn.commit()
conn.close()

print(f"Pronto! A ocorrência de ID {id_para_apagar} foi apagada do banco.")