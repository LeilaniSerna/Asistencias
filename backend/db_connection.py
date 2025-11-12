import mysql.connector

# Conexion a la Nube (Railway)
DB_CONFIG = {
    "host": "metro.proxy.rlwy.net",
    "user": "root",
    "password": "psAiVQzBxzmSWKkfbNTeDVaMWNdVejzN",
    "database": "checador_db",  # Usamos esta porque tu script creó las tablas aquí
    "port": 39030               # ¡Importante! El puerto debe ser un número (sin comillas)
}

def obtener_conexion():
    try:
        conexion = mysql.connector.connect(**DB_CONFIG)
        return conexion
    except mysql.connector.Error as err:
        print(f"Error al conectar a la base de datos: {err}")
        raise err

# Prueba de conexión (Opcional: Puedes comentar esto después de probar)
if __name__ == "__main__":
    try:
        conexion = obtener_conexion()
        if conexion.is_connected():
            print("✅ ¡Conexión exitosa a la base de datos en la nube!")
            print(f"Conectado a: {DB_CONFIG['host']}")
        conexion.close()
    except Exception as e:
        print("❌ Falló la conexión:", e)