import mysql.connector

# Conexion a la Nube (Railway - Cuenta Principal)
DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "user": "root",
    "password": "mrFldMyxhidgpyEHEFcRFTFLWLFzThjP",
    "database": "checador_db",  # Mantenemos esto porque tu script .sql crea las tablas aquí
    "port": 41728               # Nuevo puerto actualizado
}

def obtener_conexion():
    try:
        conexion = mysql.connector.connect(**DB_CONFIG)
        return conexion
    except mysql.connector.Error as err:
        print(f"Error al conectar a la base de datos: {err}")
        raise err

