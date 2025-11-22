import mysql.connector
import os

# Configuracion de la Conexion a la Nube (Railway)
DB_CONFIG = {
    "host": "nozomi.proxy.rlwy.net",
    "user": "root",
    "password": "mrFldMyxhidgpyEHEFcRFTFLWLFzThjP",
    "database": "checador_db",
    "port": 41728
}

def obtener_conexion():
    """Establece y retorna una conexión a la base de datos."""
    try:
        conexion = mysql.connector.connect(**DB_CONFIG)
        return conexion
    except mysql.connector.Error as err:
        # En el servidor (Railway), esto detendrá el proceso si la conexión falla
        raise ConnectionError(f"Error de conexión a la BD: {err}")

# NO incluimos código de prueba aquí, ya que eso rompe el servidor al inicio.