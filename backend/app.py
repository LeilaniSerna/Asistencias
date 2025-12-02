from flask import Flask
from flask_cors import CORS
from routes import routes
import os

app = Flask(__name__)

# --- CONFIGURACIÓN CORS PERMISIVA ---
# "origins": "*" permite que tu celular (Android) o la web se conecten
# desde cualquier red (Datos móviles, WiFi pública, etc.) sin bloqueos.
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Registrar blueprint de rutas
app.register_blueprint(routes)

if __name__ == '__main__':
    # Railway usa la variable de entorno PORT, si no existe usa 5000
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)