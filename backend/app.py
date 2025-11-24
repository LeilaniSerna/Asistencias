from flask import Flask
from flask_cors import CORS
from routes import routes

app = Flask(__name__)

# Configuración correcta de CORS
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:8100",            # App en desarrollo (Ionic)
            "https://asistencias-beta.vercel.app"  # Frontend en producción
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Registrar blueprint de rutas
app.register_blueprint(routes)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
