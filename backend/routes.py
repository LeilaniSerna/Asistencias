from flask import Blueprint, jsonify, request
from db_connection import obtener_conexion
from datetime import datetime, timedelta, time
import traceback
from math import radians, cos, sin, sqrt, atan2
import requests 
from requests.exceptions import ReadTimeout, RequestException 
import random

routes = Blueprint('routes', __name__)

# --- CONFIGURACIÓN IA ---
MODEL_API_URL = "https://alumnos-riesgo.onrender.com/predict"

# --- UTILIDADES ---
def calcular_distancia(lat1, lon1, lat2, lon2):
    R = 6371000
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c

def obtener_features_y_prediccion(alumno_id, clase_id=None):
    """
    Calcula métricas SQL y aplica REGLAS DE NEGOCIO.
    Filtra por materia pero permite evaluar riesgo académico aunque no haya asistencia.
    """
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    try:
        # 1. Ingeniería de características (SQL)
        if clase_id:
            query = """
                SELECT
                    (SELECT AVG(calificacion) FROM calificaciones WHERE alumno_id = %s AND clase_id = %s) as PreviousGrade,
                    COALESCE(SUM(CASE WHEN estado = 'Retardo' THEN 1 ELSE 0 END), 0) as Retardos,
                    COALESCE(SUM(CASE WHEN estado = 'Injustificado' THEN 1 ELSE 0 END), 0) as Injustificadas,
                    COUNT(id) as TotalAsistencias
                FROM asistencias
                WHERE alumno_id = %s AND clase_id = %s
            """
            params = (alumno_id, clase_id, alumno_id, clase_id)
        else:
            query = """
                SELECT
                    (SELECT AVG(calificacion) FROM calificaciones WHERE alumno_id = %s) as PreviousGrade,
                    COALESCE(SUM(CASE WHEN estado = 'Retardo' THEN 1 ELSE 0 END), 0) as Retardos,
                    COALESCE(SUM(CASE WHEN estado = 'Injustificado' THEN 1 ELSE 0 END), 0) as Injustificadas,
                    COUNT(id) as TotalAsistencias
                FROM asistencias
                WHERE alumno_id = %s
            """
            params = (alumno_id, alumno_id)

        cursor.execute(query, params)
        stats = cursor.fetchone()

        if not stats:
            return {"is_in_risk": 0, "risk_probability": 0.0, "message": "Sin datos", "status": "ok"}
        
        if stats['PreviousGrade'] is None:
             return {"is_in_risk": 0, "risk_probability": 0.0, "message": "Sin historial", "status": "ok"}

        total_asistencias = stats['TotalAsistencias']
        if total_asistencias > 0:
            tasa_retardos = stats['Retardos'] / total_asistencias
            tasa_injustificadas = stats['Injustificadas'] / total_asistencias
        else:
            tasa_retardos = 0.0
            tasa_injustificadas = 0.0

        raw_grade = float(stats['PreviousGrade'])
        grade_0_10 = raw_grade if raw_grade <= 10.0 else raw_grade / 10.0

        print(f"🤖 Alumno {alumno_id} (Clase {clase_id}): Calif={grade_0_10:.2f} | Asistencias={total_asistencias}")

        # REGLAS DE NEGOCIO
        if grade_0_10 < 8.0:
            prob_simulada = random.uniform(0.80, 0.98)
            return {"is_in_risk": 2, "risk_probability": prob_simulada, "message": f"Promedio Crítico ({grade_0_10:.1f})", "status": "ok"}
        elif 8.0 <= grade_0_10 < 9.0:
            prob_simulada = random.uniform(0.45, 0.65)
            return {"is_in_risk": 1, "risk_probability": prob_simulada, "message": f"Riesgo Académico ({grade_0_10:.1f})", "status": "ok"}
        else:
            return {"is_in_risk": 0, "risk_probability": random.uniform(0.05, 0.20), "message": "Buen Promedio", "status": "ok"}

    except Exception as e:
        print(f"⚠️ Error Interno Logic Alumno {alumno_id}: {e}")
        return {"is_in_risk": 0, "message": "Error interno", "status": "error"}
    finally:
        cursor.close()
        conexion.close()


@routes.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json(force=True, silent=True)
        if not data: return jsonify({"error": "Formato JSON inválido"}), 400
        
        correo = data.get('correo')
        password = data.get('contrasena')
        
        if not correo or not password:
            return jsonify({"error": "Faltan datos"}), 400

        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("SELECT id, correo, contrasena, rol_id FROM usuarios WHERE correo = %s", (correo,))
        usuario = cursor.fetchone()

        if usuario and password == usuario['contrasena']:
            usuario.pop('contrasena')
            return jsonify(usuario), 200
        else:
            return jsonify({"error": "Credenciales incorrectas"}), 401
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Error interno"}), 500
    finally:
        try: cursor.close(); conexion.close()
        except: pass

# --- RUTAS DE PROFESOR ---

@routes.route('/profesor/<int:profesor_id>/grupos', methods=['GET'])
def obtener_grupos_profesor(profesor_id):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute("SELECT nombre, apellido FROM profesores WHERE id = %s", (profesor_id,))
        profesor = cursor.fetchone()
        if not profesor: return jsonify({"error": "Profesor no encontrado"}), 404
        
        cursor.execute("""
            SELECT DISTINCT g.id, g.nombre, g.periodo
            FROM clases c
            INNER JOIN grupos g ON c.grupo_id = g.id
            WHERE c.profesor_id = %s ORDER BY g.nombre
        """, (profesor_id,))
        grupos = cursor.fetchall()
        
        return jsonify({"profesor": f"{profesor['nombre']} {profesor['apellido']}", "grupos": grupos}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conexion.close()

@routes.route('/profesor/<int:profesor_id>/grupos/<int:grupo_id>/materias', methods=['GET'])
def obtener_materias_por_profesor_y_grupo(profesor_id, grupo_id):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT c.id AS clase_id, m.nombre AS materia, s.dia_semana, s.hora_inicio, s.hora_fin
            FROM clases c
            INNER JOIN materias m ON c.materia_id = m.id
            INNER JOIN grupos g ON c.grupo_id = g.id
            LEFT JOIN sesiones s ON s.clase_id = c.id
            WHERE g.id = %s AND c.profesor_id = %s ORDER BY m.nombre
        """, (grupo_id, profesor_id))
        resultados = cursor.fetchall()
        
        materias = []
        for row in resultados:
            horario = "Horario no definido"
            if row['dia_semana']:
                hi = str(row['hora_inicio']) if row['hora_inicio'] else "00:00"
                hf = str(row['hora_fin']) if row['hora_fin'] else "00:00"
                horario = f"{row['dia_semana']} {hi[:5]} - {hf[:5]}"
            
            materias.append({
                "clase_id": row['clase_id'], 
                "nombre": row['materia'], 
                "horario": horario
            })
        return jsonify(materias), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conexion.close()

@routes.route('/profesor/alumnos-solicitudes', methods=['GET'])
def obtener_alumnos_con_solicitudes():
    grupo_id = request.args.get('grupoId')
    materia_nombre = request.args.get('materiaNombre')
    
    if not grupo_id or not materia_nombre: return jsonify({"error": "Faltan datos"}), 400
    
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT a.id AS alumno_id, a.nombre, a.apellido, c.id AS clase_id, s.estado, s.id AS solicitud_id
            FROM alumnos a
            INNER JOIN clase_alumnos ca ON ca.alumno_id = a.id
            INNER JOIN clases c ON ca.clase_id = c.id
            INNER JOIN materias m ON c.materia_id = m.id
            INNER JOIN grupos g ON c.grupo_id = g.id
            LEFT JOIN solicitudes_asistencia s ON s.alumno_id = a.id AND s.clase_id = c.id AND DATE(s.fecha) = CURDATE()
            WHERE g.id = %s AND m.nombre = %s ORDER BY a.nombre
        """, (grupo_id, materia_nombre))
        alumnos = cursor.fetchall()
        
        resultados = []
        for alumno in alumnos:
            ia_data = obtener_features_y_prediccion(alumno['alumno_id'], alumno['clase_id'])
            
            resultados.append({
                "alumno_id": alumno['alumno_id'],
                "nombre": f"{alumno['nombre']} {alumno['apellido']}",
                "estado": alumno['estado'] or "Sin solicitud", 
                "solicitud_id": alumno.get('solicitud_id'),
                "clase_id": alumno['clase_id'],
                "ia_risk": ia_data.get('is_in_risk', 0),
                "ia_prob": round(ia_data.get('risk_probability', 0.0) * 100, 1),
                "ia_msg": ia_data.get('message', '')
            })

        return jsonify(resultados), 200
    except Exception as e:
        print("Error en alumnos-solicitudes:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conexion.close()

@routes.route('/solicitud-asistencia/responder', methods=['POST'])
def responder_solicitud():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    data = request.get_json()
    try:
        cursor.execute("UPDATE solicitudes_asistencia SET estado = %s, respondida_por = %s, fecha_respuesta = NOW(), observaciones = %s WHERE id = %s", 
                       (data.get('estado'), data.get('profesor_id'), data.get('observaciones'), data.get('solicitud_id')))
        conexion.commit()
        return jsonify({"message": "Actualizado"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conexion.close()

@routes.route('/asistencia/manual', methods=['POST'])
def registrar_asistencia_manual():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    data = request.get_json()
    try:
        cursor.execute("""
            INSERT INTO solicitudes_asistencia (alumno_id, clase_id, fecha, hora, estado, respondida_por, observaciones)
            VALUES (%s, %s, %s, %s, 'Manual', %s, %s)
            ON DUPLICATE KEY UPDATE estado='Manual', respondida_por=VALUES(respondida_por), observaciones=VALUES(observaciones)
        """, (data['alumno_id'], data['clase_id'], data['fecha'], data['hora'], data['profesor_id'], data['motivo']))
        conexion.commit()
        return jsonify({"message": "Registrado"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conexion.close()

@routes.route('/profesor/verificar-faltas', methods=['POST'])
def verificar_faltas():
    data = request.get_json()
    profesor_id = data.get('profesor_id')
    grupo_id = data.get('grupo_id')
    materia_id = data.get('materia_id')
    
    if not all([profesor_id, grupo_id, materia_id]): return jsonify({"error": "Faltan datos"}), 400

    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT s.id AS sesion_id, s.dia_semana, s.hora_inicio, s.hora_fin, c.id AS clase_id
            FROM sesiones s JOIN clases c ON s.clase_id = c.id
            WHERE c.profesor_id = %s AND c.grupo_id = %s AND c.materia_id = %s
        """, (profesor_id, grupo_id, materia_id))
        sesion = cursor.fetchone()

        if not sesion: return jsonify({"error": "Sesión no encontrada"}), 404
        
        cursor.execute("SELECT a.id, a.nombre, a.apellido FROM alumnos a JOIN clase_alumnos ca ON a.id = ca.alumno_id WHERE ca.clase_id = %s", (sesion['clase_id'],))
        alumnos = cursor.fetchall()
        
        lista = []
        for alum in alumnos:
            cursor.execute("SELECT estado FROM solicitudes_asistencia WHERE alumno_id=%s AND clase_id=%s AND fecha=CURDATE()", (alum['id'], sesion['clase_id']))
            sol = cursor.fetchone()
            lista.append({'alumno_id': alum['id'], 'nombre': alum['nombre'], 'apellido': alum['apellido'], 'estado_asistencia': sol['estado'] if sol else 'Sin Solicitud'})

        return jsonify({'estado_sesion': 'check', 'alumnos': lista}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conexion.close()

# --- RUTAS DE ALUMNO ---
@routes.route('/usuario/<int:usuario_id>/alumno-id', methods=['GET'])
def obtener_alumno_id_por_usuario(usuario_id):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM alumnos WHERE usuario_id = %s", (usuario_id,))
        res = cursor.fetchone()
        return jsonify({"alumno_id": res['id']}) if res else (jsonify({"error": "No encontrado"}), 404)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conexion.close()

@routes.route('/alumno/<int:alumno_id>/info', methods=['GET'])
def obtener_info_alumno(alumno_id):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute("SELECT a.nombre, a.apellido, g.nombre AS grupo FROM alumnos a INNER JOIN grupos g ON a.grupo_id = g.id WHERE a.id = %s", (alumno_id,))
        return jsonify(cursor.fetchone()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conexion.close()

@routes.route('/alumno/<int:alumno_id>/materias', methods=['GET'])
def obtener_materias_alumno(alumno_id):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT c.id AS clase_id, m.nombre AS nombre_materia, s.dia_semana, s.hora_inicio, s.hora_fin, sa.estado AS estado_solicitud, sa.observaciones
            FROM clase_alumnos ca
            INNER JOIN clases c ON ca.clase_id = c.id
            INNER JOIN materias m ON c.materia_id = m.id
            INNER JOIN sesiones s ON s.clase_id = c.id
            LEFT JOIN solicitudes_asistencia sa ON sa.alumno_id = ca.alumno_id AND sa.clase_id = ca.clase_id AND DATE(sa.fecha) = CURDATE()
            WHERE ca.alumno_id = %s
        """, (alumno_id,))
        materias = cursor.fetchall()
        
        for m in materias:
             if m['hora_inicio']: m['hora_inicio'] = str(m['hora_inicio'])[:5]
             if m['hora_fin']: m['hora_fin'] = str(m['hora_fin'])[:5]
                
        return jsonify(materias), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conexion.close()

@routes.route('/alumno/enviar-solicitud', methods=['POST'])
def enviar_solicitud():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    data = request.get_json()
    try:
        cursor.execute("SELECT au.latitud, au.longitud FROM clases c JOIN aulas au ON c.aula_id = au.id WHERE c.id = %s", (data['clase_id'],))
        aula = cursor.fetchone()
        
        if aula and aula['latitud']:
            distancia = calcular_distancia(data['latitud_usuario'], data['longitud_usuario'], aula['latitud'], aula['longitud'])
            if distancia > 1000000:
                return jsonify({"error": f"Demasiado lejos ({distancia:.2f}m)"}), 403

        cursor.execute("""
            INSERT INTO solicitudes_asistencia (alumno_id, clase_id, fecha, hora, estado, latitud_usuario, longitud_usuario)
            VALUES (%s, %s, %s, %s, 'Pendiente', %s, %s)
        """, (data['alumno_id'], data['clase_id'], data['fecha'], data['hora'], data['latitud_usuario'], data['longitud_usuario']))
        conexion.commit()
        return jsonify({"message": "Enviada"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conexion.close()

@routes.route('/alumno/<int:alumno_id>/asistencias', methods=['GET'])
def historial_asistencias_alumno(alumno_id):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT m.nombre AS materia, a.fecha, a.hora, a.estado
            FROM asistencias a JOIN clases c ON a.clase_id = c.id JOIN materias m ON c.materia_id = m.id
            WHERE a.alumno_id = %s ORDER BY a.fecha DESC
        """, (alumno_id,))
        return jsonify(cursor.fetchall()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conexion.close()

@routes.route('/alumno/<int:alumno_id>/asistencias-resumen', methods=['GET'])
def resumen_asistencias_alumno(alumno_id):
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute("""
            SELECT m.nombre AS materia,
            SUM(a.estado = 'Presente') AS asistencias,
            SUM(a.estado = 'Justificado') AS faltas_justificadas,
            SUM(a.estado = 'Injustificado') AS faltas_injustificadas
            FROM asistencias a
            JOIN clases c ON a.clase_id = c.id
            JOIN materias m ON c.materia_id = m.id
            WHERE a.alumno_id = %s GROUP BY m.nombre
        """, (alumno_id,))
        resultados = cursor.fetchall()
        resumen = [{'materia': r[0], 'asistencias': int(r[1]), 'faltas_justificadas': int(r[2]), 'faltas_injustificadas': int(r[3])} for r in resultados]
        return jsonify(resumen), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close(); conexion.close()

# --- CORRECCIÓN CRÍTICA: OBTENER TODAS LAS CALIFICACIONES Y PROMEDIO ---
@routes.route('/alumno/<int:alumno_id>/calificaciones-resumen', methods=['GET'])
def obtener_calificaciones_resumen(alumno_id):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    try:
        # Se obtiene el listado completo de materias con su calificación para ese alumno
        # Se corrigió el JOIN: calificaciones -> clases -> materias
        query = """
            SELECT m.nombre AS materia, c.calificacion
            FROM calificaciones c
            JOIN clases cl ON c.clase_id = cl.id
            JOIN materias m ON cl.materia_id = m.id
            WHERE c.alumno_id = %s
        """
        cursor.execute(query, (alumno_id,))
        resultados = cursor.fetchall()

        califs_validas = []
        detalles = []

        for r in resultados:
            # Validar si existe calificación
            if r['calificacion'] is not None:
                raw_grade = float(r['calificacion'])
                # Normalizar si está en escala 0-100 a 0-10
                final_grade = raw_grade if raw_grade <= 10.0 else raw_grade / 10.0
                
                califs_validas.append(final_grade)
                detalles.append({
                    "nombre": r['materia'],
                    "calificacion": round(final_grade, 1)
                })

        # Calcular promedio general
        promedio = sum(califs_validas) / len(califs_validas) if califs_validas else 0.0

        return jsonify({
            "promedio": round(promedio, 1),
            "detalles": detalles
        }), 200
    except Exception as e:
        print("Error en calificaciones resumen:", e) # Log para Railway
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conexion.close()

# --- RUTAS DE CAPTURA CALIFICACIONES (PROFESOR) ---

@routes.route('/profesor/clase/<int:clase_id>/alumnos-calificaciones', methods=['GET'])
def obtener_alumnos_para_calificar(clase_id):
    periodo = request.args.get('periodo', 'Parcial 1')
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    try:
        query = """
            SELECT 
                a.id AS alumno_id, a.matricula, a.nombre, a.apellido,
                c.calificacion, c.observaciones
            FROM clase_alumnos ca
            INNER JOIN alumnos a ON ca.alumno_id = a.id
            LEFT JOIN calificaciones c 
                ON c.alumno_id = a.id AND c.clase_id = ca.clase_id AND c.periodo = %s
            WHERE ca.clase_id = %s
            ORDER BY a.apellido, a.nombre
        """
        cursor.execute(query, (periodo, clase_id))
        alumnos = cursor.fetchall()
        
        alumnos_con_ia = []
        
        for alumno in alumnos:
            # Pasamos clase_id para que el riesgo se calcule SOBRE ESTA MATERIA
            ia_data = obtener_features_y_prediccion(alumno['alumno_id'], clase_id)
            
            alumno['ia_risk'] = ia_data.get('is_in_risk', 0)
            alumno['ia_prob'] = round(ia_data.get('risk_probability', 0.0) * 100, 1)
            alumno['ia_msg'] = ia_data.get('message', '')

            if alumno['calificacion'] is not None:
                alumno['calificacion'] = float(alumno['calificacion'])
            alumno['guardado'] = True if alumno['calificacion'] is not None else False
            alumnos_con_ia.append(alumno)

        return jsonify(alumnos_con_ia), 200
    except Exception as e:
        print("Error en calificaciones:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conexion.close()

@routes.route('/profesor/guardar-calificacion', methods=['POST'])
def guardar_calificacion_profesor():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    data = request.get_json()
    try:
        query = """
            INSERT INTO calificaciones (alumno_id, clase_id, periodo, calificacion, observaciones)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                calificacion = VALUES(calificacion),
                observaciones = VALUES(observaciones),
                fecha_registro = CURRENT_TIMESTAMP
        """
        cursor.execute(query, (data['alumno_id'], data['clase_id'], data['periodo'], data['calificacion'], data.get('observaciones', '')))
        conexion.commit()
        return jsonify({"message": "Guardado"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conexion.close()