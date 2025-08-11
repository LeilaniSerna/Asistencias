import mysql.connector

# Conexion 
DB_CONFIG = {
    "host": "localhost",
    "user": "root",      "password": "",
    "database": "checador_db"
}

def obtener_conexion():
    conexion = mysql.connector.connect(**DB_CONFIG)
    return conexion

# Prueba de conexión
conexion = obtener_conexion()
if conexion.is_connected():
    print("si conecta")
conexion.close()