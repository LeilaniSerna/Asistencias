from flask import Blueprint, jsonify, request
from db_connection import obtener_conexion
from datetime import datetime, timedelta, time
import traceback

routes = Blueprint('routes', __name__)

@routes.route('/alumnos', methods=['GET'])
def obtener_alumnos():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM alumnos")
        alumnos = cursor.fetchall()
        return jsonify(alumnos), 200
    except Exception as e:
        print("Error en /alumnos:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conexion.close()

""" login  """
@routes.route('/login', methods=['POST'])
def login():
    try:
        print("\n🟡 --- Solicitud recibida en /login ---")
        print("🔹 IP origen:", request.remote_addr)
        print("🔹 Cabeceras:", dict(request.headers))
        print("🔹 Datos crudos (request.data):", request.data)

        data = request.get_json(force=True, silent=True)
        print("🔹 JSON decodificado:", data)

        if not data:
            print("❌ No se pudo decodificar el JSON del body.")
            return jsonify({"error": "Formato JSON inválido"}), 400

        correo = data.get('correo')
        password = data.get('contrasena')

        if not correo or not password:
            print("❌ Faltan campos requeridos.")
            return jsonify({"error": "Correo y contraseña son requeridos"}), 400

        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        query = "SELECT id, correo, contrasena, rol_id FROM usuarios WHERE correo = %s"
        cursor.execute(query, (correo,))
        usuario = cursor.fetchone()

        if usuario:
            print(f"✅ Usuario encontrado: {usuario['correo']}")
            if password == usuario['contrasena']:
                usuario.pop('contrasena')
                print("🟢 Login exitoso.")
                return jsonify(usuario), 200
            else:
                print("❌ Contraseña incorrecta.")
                return jsonify({"error": "Contraseña incorrecta"}), 401
        else:
            print("❌ Usuario no encontrado.")
            return jsonify({"error": "Usuario no encontrado"}), 404

    except Exception as e:
        print("\n🔴 --- Error inesperado en /login ---")
        print("Error:", e)
        traceback.print_exc()
        return jsonify({"error": "Error interno del servidor"}), 500

    finally:
        try:
            cursor.close()
            conexion.close()
        except Exception as e:
            print("⚠️ Error al cerrar conexión:", e)



""" obtener los grupos del profde """
@routes.route('/profesor/<int:profesor_id>/grupos', methods=['GET'])
def obtener_grupos_profesor(profesor_id):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    try:
        # Obtener nombre completo del profesor
        cursor.execute("""
            SELECT nombre, apellido 
            FROM profesores 
            WHERE id = %s
        """, (profesor_id,))
        profesor = cursor.fetchone()
        if not profesor:
            return jsonify({"error": "Profesor no encontrado"}), 404

        nombre_completo = f"{profesor['nombre']} {profesor['apellido']}"

        # Obtener grupos en los que el profesor imparte clases (usando tabla clases)
        cursor.execute("""
            SELECT DISTINCT g.id, g.nombre, g.periodo
            FROM clases c
            INNER JOIN grupos g ON c.grupo_id = g.id
            WHERE c.profesor_id = %s
            ORDER BY g.nombre;
        """, (profesor_id,))
        grupos = cursor.fetchall()

        return jsonify({
            "profesor": nombre_completo,
            "grupos": grupos
        }), 200

    except Exception as e:
        print("Error en /profesor/<id>/grupos:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conexion.close()



@routes.route('/alumnos-detalle', methods=['GET'])
def obtener_alumnos_detalle():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    try:
        query = """
            SELECT
                a.id AS alumno_id,
                a.nombre,
                a.apellido,
                g.nombre AS grupo,
                m.nombre AS materia,
                COUNT(CASE WHEN asi.estado = 'Injustificado' THEN 1 END) AS faltas
            FROM alumnos a
            INNER JOIN clase_alumnos ca ON a.id = ca.alumno_id
            INNER JOIN clases c ON ca.clase_id = c.id
            INNER JOIN grupos g ON c.grupo_id = g.id
            INNER JOIN materias m ON c.materia_id = m.id
            LEFT JOIN asistencias asi 
                ON asi.alumno_id = a.id 
                AND asi.clase_id = c.id 
                AND asi.estado = 'Injustificado'
            GROUP BY a.id, a.nombre, a.apellido, g.nombre, m.nombre
            ORDER BY g.nombre, a.nombre, a.apellido;
        """

        cursor.execute(query)
        resultados = cursor.fetchall()

        alumnos = {}
        for row in resultados:
            alumno_id = row['alumno_id']
            nombre_completo = f"{row['nombre']} {row['apellido']}"

            if alumno_id not in alumnos:
                alumnos[alumno_id] = {
                    "nombre_completo": nombre_completo,
                    "grupo": row['grupo'],
                    "materias": []
                }
            alumnos[alumno_id]["materias"].append({
                "nombre": row['materia'],
                "faltas": row['faltas']
            })

        return jsonify(list(alumnos.values())), 200

    except Exception as e:
        print("Error en /alumnos-detalle:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conexion.close()




""" obtener materias por grupo que son impartidas por tal profesor """
@routes.route('/profesor/<int:profesor_id>/grupos/<int:grupo_id>/materias', methods=['GET'])
def obtener_materias_por_profesor_y_grupo(profesor_id, grupo_id):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    
    try:
        query = """
            SELECT m.nombre AS materia, s.dia_semana, s.hora_inicio, s.hora_fin
            FROM clases c
            INNER JOIN materias m ON c.materia_id = m.id
            INNER JOIN grupos g ON c.grupo_id = g.id
            LEFT JOIN sesiones s ON s.clase_id = c.id
            WHERE g.id = %s AND c.profesor_id = %s
            ORDER BY m.nombre
        """
        cursor.execute(query, (grupo_id, profesor_id))
        resultados = cursor.fetchall()

        def format_time(value):
            if isinstance(value, timedelta):
                total_seconds = int(value.total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                return f"{hours:02d}:{minutes:02d}"
            elif value is None:
                return "00:00"
            else:
                return value.strftime('%H:%M')

        materias = []
        for row in resultados:
            nombre = row['materia']
            if row['dia_semana']:
                hora_inicio = format_time(row['hora_inicio'])
                hora_fin = format_time(row['hora_fin'])
                horario = f"{row['dia_semana']} {hora_inicio} - {hora_fin}"
            else:
                horario = "Horario no definido"
            materias.append({
                "nombre": nombre,
                "horario": horario
            })

        return jsonify(materias), 200

    except Exception as e:
        print("Error en /profesor/<id>/grupos/<id>/materias:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conexion.close()



""" Traer la lista de los alumnos que están en esa materia y grupo """
@routes.route('/profesor/alumnos-solicitudes', methods=['GET'])
def obtener_alumnos_con_solicitudes():
    grupo_id = request.args.get('grupoId')
    materia_nombre = request.args.get('materiaNombre')
    horario = request.args.get('horario')  # Por ahora sin uso, pero ya recibido

    print(f"Recibido -> grupoId: {grupo_id}, materiaNombre: {materia_nombre}, horario: {horario}")

    if not grupo_id or not materia_nombre:
        print("error: Faltan parámetros obligatorios")
        return jsonify({"error": "Faltan parámetros obligatorios"}), 400

    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    try:
        query = """
            SELECT 
                a.id AS alumno_id, 
                a.nombre, 
                a.apellido, 
                c.id AS clase_id,
                s.estado, 
                s.id AS solicitud_id
            FROM alumnos a
            INNER JOIN clase_alumnos ca ON ca.alumno_id = a.id
            INNER JOIN clases c ON ca.clase_id = c.id
            INNER JOIN materias m ON c.materia_id = m.id
            INNER JOIN grupos g ON c.grupo_id = g.id
            LEFT JOIN solicitudes_asistencia s 
                ON s.alumno_id = a.id AND s.clase_id = c.id AND DATE(s.fecha) = CURDATE()
            WHERE g.id = %s AND m.nombre = %s
            ORDER BY a.nombre
        """
        cursor.execute(query, (grupo_id, materia_nombre))
        alumnos = cursor.fetchall()

        print(f"Consulta ejecutada correctamente. Alumnos encontrados: {len(alumnos)}")

        resultados = []
        for alumno in alumnos:
            resultados.append({
                "alumno_id": alumno['alumno_id'],
                "nombre": f"{alumno['nombre']} {alumno['apellido']}",
                "estado": alumno['estado'] or "Pendiente",
                "solicitud_id": alumno.get('solicitud_id'),
                "clase_id": alumno['clase_id']  # Agregado aquí
            })

        print("Enviando resultados al frontend")
        return jsonify(resultados), 200

    except Exception as e:
        print("error en /profesor/alumnos-solicitudes:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conexion.close()
        print("Conexión cerrada")




""" Aceptar o negar solicitud (profesor) """
@routes.route('/solicitud-asistencia/responder', methods=['POST'])
def responder_solicitud():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    data = request.get_json()

    solicitud_id = data.get('solicitud_id')
    profesor_id = data.get('profesor_id')
    estado = data.get('estado')  # "Aceptada" o "Rechazada"
    observaciones = data.get('observaciones')  # Solo si se rechaza

    if not solicitud_id or not profesor_id or not estado:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    if estado not in ['Aceptada', 'Rechazada']:
        return jsonify({"error": "Estado inválido"}), 400

    try:
        # Verificar que el profesor imparte la clase de la solicitud
        cursor.execute("""
            SELECT sa.clase_id, c.profesor_id
            FROM solicitudes_asistencia sa
            JOIN clases c ON sa.clase_id = c.id
            WHERE sa.id = %s
        """, (solicitud_id,))
        resultado = cursor.fetchone()

        if not resultado:
            return jsonify({"error": "Solicitud no encontrada"}), 404

        if resultado['profesor_id'] != profesor_id:
            return jsonify({"error": "No tienes permiso para responder esta solicitud"}), 403

        # Actualizar solicitud con la respuesta
        cursor.execute("""
            UPDATE solicitudes_asistencia
            SET estado = %s,
                respondida_por = %s,
                fecha_respuesta = %s,
                observaciones = %s
            WHERE id = %s
        """, (
            estado,
            profesor_id,
            datetime.now(),
            observaciones if estado == 'Rechazada' else None,
            solicitud_id
        ))

        conexion.commit()
        return jsonify({"message": "Solicitud actualizada correctamente"}), 200

    except Exception as e:
        print("Error al responder solicitud:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conexion.close()



""" Registrar asistencia manual (el profe registra asistencia manual si el alumno le surge un inconveniente) """
@routes.route('/asistencia/manual', methods=['POST'])
def registrar_asistencia_manual():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    data = request.get_json()
    alumno_id = data.get('alumno_id')
    clase_id = data.get('clase_id')
    profesor_id = data.get('profesor_id')
    fecha = data.get('fecha')
    hora = data.get('hora')
    motivo = data.get('motivo')

    if not all([alumno_id, clase_id, profesor_id, fecha, hora, motivo]):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    try:
        # Verificar que el profesor imparte la clase
        cursor.execute("""
            SELECT profesor_id FROM clases WHERE id = %s
        """, (clase_id,))
        clase = cursor.fetchone()

        if not clase or clase['profesor_id'] != profesor_id:
            return jsonify({"error": "No tienes permiso para registrar asistencia en esta clase"}), 403

        # Obtener sesión válida para la fecha dada
        dia_semana_num = datetime.strptime(fecha, '%Y-%m-%d').weekday()
        dias_correctos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        dia_semana_texto = dias_correctos[dia_semana_num]

        cursor.execute("""
            SELECT hora_inicio, hora_fin
            FROM sesiones
            WHERE clase_id = %s AND dia_semana = %s
        """, (clase_id, dia_semana_texto))
        sesion = cursor.fetchone()

        if not sesion:
            return jsonify({"error": "No hay sesión programada para este día"}), 400

        def format_timedelta(td):
            total_seconds = int(td.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            return f"{hours:02}:{minutes:02}:00"

        hora_inicio = format_timedelta(sesion['hora_inicio'])
        hora_fin = format_timedelta(sesion['hora_fin'])

        if not (hora_inicio <= hora <= hora_fin):
            return jsonify({"error": "Hora fuera del horario permitido para esta clase"}), 400

        # Registrar la asistencia manual como solicitud en la tabla solicitudes_asistencia
        cursor.execute("""
            INSERT INTO solicitudes_asistencia
                (alumno_id, clase_id, fecha, hora, estado, respondida_por, observaciones)
            VALUES
                (%s, %s, %s, %s, 'Manual', %s, %s)
            ON DUPLICATE KEY UPDATE
                estado = 'Manual',
                respondida_por = VALUES(respondida_por),
                observaciones = VALUES(observaciones),
                fecha_solicitud = CURRENT_TIMESTAMP
        """, (alumno_id, clase_id, fecha, hora, profesor_id, motivo))

        conexion.commit()

        return jsonify({"message": "Asistencia manual registrada correctamente como solicitud"}), 200

    except Exception as e:
        print("Error en /asistencia/manual:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conexion.close()




""" verificar faltas de los alumnos """
from datetime import time

@routes.route('/profesor/verificar-faltas', methods=['POST'])
def verificar_faltas():
    data = request.get_json()
    profesor_id = data.get('profesor_id')
    grupo_id = data.get('grupo_id')
    materia_id = data.get('materia_id')

    if not profesor_id or not grupo_id or not materia_id:
        return jsonify({"error": "Faltan datos requeridos"}), 400

    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    try:
        # Obtener sesión de la clase
        cursor.execute("""
            SELECT s.id AS sesion_id, s.dia_semana, s.hora_inicio, s.hora_fin, c.id AS clase_id
            FROM sesiones s
            JOIN clases c ON s.clase_id = c.id
            WHERE c.profesor_id = %s AND c.grupo_id = %s AND c.materia_id = %s
        """, (profesor_id, grupo_id, materia_id))
        sesion = cursor.fetchone()

        if not sesion:
            return jsonify({"error": "Sesión no encontrada"}), 404

        hoy = datetime.now()
        dia_actual = hoy.strftime('%A')

        dias_mapeo = {
            'Monday': 'Lunes',
            'Tuesday': 'Martes',
            'Wednesday': 'Miércoles',
            'Thursday': 'Jueves',
            'Friday': 'Viernes',
            'Saturday': 'Sábado',
            'Sunday': 'Domingo'
        }

        dia_actual_es = dias_mapeo.get(dia_actual)
        hora_actual = hoy.time()

        estado_sesion = "fuera"
        if dia_actual_es == sesion['dia_semana']:
            if sesion['hora_inicio'] <= hora_actual <= sesion['hora_fin']:
                estado_sesion = "en_curso"
            elif hora_actual > sesion['hora_fin']:
                estado_sesion = "terminada"

        cursor.execute("""
            SELECT a.id AS alumno_id, a.nombre, a.apellido
            FROM alumnos a
            JOIN clase_alumnos ca ON a.id = ca.alumno_id
            WHERE ca.clase_id = %s
        """, (sesion['clase_id'],))
        alumnos = cursor.fetchall()

        lista_alumnos = []
        for alumno in alumnos:
            cursor.execute("""
                SELECT estado
                FROM solicitudes_asistencia
                WHERE alumno_id = %s AND clase_id = %s AND fecha = CURDATE()
            """, (alumno['alumno_id'], sesion['clase_id']))
            solicitud = cursor.fetchone()

            estado_asistencia = 'Sin Solicitud'
            if solicitud:
                estado_asistencia = solicitud['estado']

            if estado_sesion == "terminada" and not solicitud:
                cursor.execute("""
                    SELECT id FROM asistencias
                    WHERE alumno_id = %s AND clase_id = %s AND fecha = CURDATE()
                """, (alumno['alumno_id'], sesion['clase_id']))
                asistencia_existente = cursor.fetchone()
                if not asistencia_existente:
                    cursor.execute("""
                        INSERT INTO asistencias (alumno_id, clase_id, sesion_id, fecha, hora, estado)
                        VALUES (%s, %s, %s, CURDATE(), %s, %s)
                    """, (
                        alumno['alumno_id'],
                        sesion['clase_id'],
                        sesion['sesion_id'],
                        hoy.strftime('%H:%M:%S'),
                        'Injustificado'
                    ))
                    conexion.commit()
                    estado_asistencia = 'Falta Registrada'

            lista_alumnos.append({
                'alumno_id': alumno['alumno_id'],
                'nombre': alumno['nombre'],
                'apellido': alumno['apellido'],
                'estado_asistencia': estado_asistencia
            })

        return jsonify({
            'estado_sesion': estado_sesion,
            'alumnos': lista_alumnos
        }), 200

    except Exception as e:
        print("Error en /profesor/verificar-faltas:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conexion.close()


""" inicio alumno """

@routes.route('/usuario/<int:usuario_id>/alumno-id', methods=['GET'])
def obtener_alumno_id_por_usuario(usuario_id):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    try:
        query = "SELECT id FROM alumnos WHERE usuario_id = %s"
        cursor.execute(query, (usuario_id,))
        resultado = cursor.fetchone()
        if not resultado:
            return jsonify({"error": "Alumno no encontrado para este usuario"}), 404
        return jsonify({"alumno_id": resultado['id']}), 200
    except Exception as e:
        print("Error en /usuario/<usuario_id>/alumno-id:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conexion.close()



""" nombre apellido y grupo del alumno """

@routes.route('/alumno/<int:alumno_id>/info', methods=['GET'])
def obtener_info_alumno(alumno_id):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    try:
        query = """
            SELECT a.nombre, a.apellido, g.nombre AS grupo
            FROM alumnos a
            INNER JOIN grupos g ON a.grupo_id = g.id
            WHERE a.id = %s
        """
        cursor.execute(query, (alumno_id,))
        resultado = cursor.fetchone()
        if not resultado:
            return jsonify({"error": "Alumno no encontrado"}), 404
        return jsonify(resultado), 200
    except Exception as e:
        print("Error en /alumno/<alumno_id>/info:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conexion.close()



""" materias q tiene el alumno """
@routes.route('/alumno/<int:alumno_id>/materias', methods=['GET'])
def obtener_materias_alumno(alumno_id):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    try:
        query = """
    SELECT
        c.id AS clase_id,
        m.nombre AS nombre_materia,
        s.dia_semana,
        s.hora_inicio,
        s.hora_fin,
        sa.estado AS estado_solicitud,
        sa.observaciones
    FROM clase_alumnos ca
    INNER JOIN clases c ON ca.clase_id = c.id
    INNER JOIN materias m ON c.materia_id = m.id
    INNER JOIN sesiones s ON s.clase_id = c.id
    LEFT JOIN solicitudes_asistencia sa 
        ON sa.alumno_id = ca.alumno_id 
        AND sa.clase_id = ca.clase_id
        AND DATE(sa.fecha) = CURDATE()
    WHERE ca.alumno_id = %s
"""

        cursor.execute(query, (alumno_id,))
        materias = cursor.fetchall()

        # Convertir horas si vienen como timedelta (por seguridad)
        def format_time(value):
            if isinstance(value, timedelta):
                total_seconds = int(value.total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                return f"{hours:02d}:{minutes:02d}"
            elif value is None:
                return "00:00"
            else:
                return value.strftime('%H:%M')

        for m in materias:
            m['hora_inicio'] = format_time(m['hora_inicio'])
            m['hora_fin'] = format_time(m['hora_fin'])

        return jsonify(materias), 200

    except Exception as e:
        print("Error en /alumno/<alumno_id>/materias:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conexion.close()


""" enviar solicitud (alumno) """
from math import radians, cos, sin, sqrt, atan2

def calcular_distancia(lat1, lon1, lat2, lon2):
    R = 6371000  # Radio de la Tierra en metros
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    distancia = R * c
    return distancia


@routes.route('/alumno/enviar-solicitud', methods=['POST'])
def enviar_solicitud():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    data = request.get_json()

    alumno_id = data.get('alumno_id')
    clase_id = data.get('clase_id')
    fecha = data.get('fecha')  # formato 'YYYY-MM-DD'
    hora = data.get('hora')    # formato 'HH:MM:SS'
    latitud_usuario = data.get('latitud_usuario')
    longitud_usuario = data.get('longitud_usuario')

    if not all([alumno_id, clase_id, fecha, hora, latitud_usuario, longitud_usuario]):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    try:
        # Obtener ubicación del aula asociada a la clase
        cursor.execute("""
            SELECT au.latitud, au.longitud
            FROM clases c
            JOIN aulas au ON c.aula_id = au.id
            WHERE c.id = %s
        """, (clase_id,))
        aula = cursor.fetchone()

        if not aula or not aula['latitud'] or not aula['longitud']:
            return jsonify({"error": "Ubicación del aula no configurada"}), 400

        # Calcular distancia
        distancia = calcular_distancia(
            latitud_usuario, longitud_usuario,
            aula['latitud'], aula['longitud']
        )
        print(f"Distancia calculada: {distancia:.2f} metros")

        DISTANCIA_MAXIMA_METROS = 300  

        if distancia > DISTANCIA_MAXIMA_METROS:
            return jsonify({"error": f"Estás demasiado lejos del aula. Distancia: {distancia:.2f} m"}), 403

        # Verificar si ya existe una solicitud para esa clase y fecha
        cursor.execute("""
            SELECT estado FROM solicitudes_asistencia
            WHERE alumno_id = %s AND clase_id = %s AND fecha = %s
        """, (alumno_id, clase_id, fecha))
        solicitud = cursor.fetchone()

        if solicitud and solicitud['estado'] != 'Pendiente':
            return jsonify({"error": "Ya existe una solicitud aceptada o rechazada para esta clase y fecha"}), 409

        # Insertar solicitud con ubicación
        cursor.execute("""
            INSERT INTO solicitudes_asistencia (alumno_id, clase_id, fecha, hora, estado, latitud_usuario, longitud_usuario)
            VALUES (%s, %s, %s, %s, 'Pendiente', %s, %s)
        """, (alumno_id, clase_id, fecha, hora, latitud_usuario, longitud_usuario))
        conexion.commit()

        return jsonify({"message": "Solicitud enviada correctamente"}), 200

    except Exception as e:
        print("Error en /alumno/enviar-solicitud:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conexion.close()




""" Historial de asistencias creo q no lo voy a usar x ahora """
@routes.route('/alumno/<int:alumno_id>/asistencias', methods=['GET'])
def historial_asistencias_alumno(alumno_id):
    

    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    def formatear_hora(valor):
        if isinstance(valor, timedelta):
            total_seconds = int(valor.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            return f"{hours:02}:{minutes:02}"
        elif isinstance(valor, time):
            return valor.strftime('%H:%M')
        elif isinstance(valor, str):
            return valor[:5]
        return "00:00"

    try:
        query = """
            SELECT m.nombre AS materia,
                   s.dia_semana,
                   s.hora_inicio,
                   s.hora_fin,
                   a.fecha,
                   a.hora,
                   a.estado
            FROM asistencias a
            INNER JOIN clases c ON a.clase_id = c.id
            INNER JOIN materias m ON c.materia_id = m.id
            INNER JOIN sesiones s ON s.clase_id = c.id
            WHERE a.alumno_id = %s
            ORDER BY a.fecha DESC, a.hora DESC
        """
        cursor.execute(query, (alumno_id,))
        asistencias = cursor.fetchall()

        for asistencia in asistencias:
            asistencia['hora_inicio'] = formatear_hora(asistencia.get('hora_inicio'))
            asistencia['hora_fin'] = formatear_hora(asistencia.get('hora_fin'))
            asistencia['hora'] = formatear_hora(asistencia.get('hora'))

        return jsonify(asistencias), 200

    except Exception as e:
        print("Error en /alumno/<id>/asistencias:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conexion.close()

""" asitencias x materia """
@routes.route('/alumno/<int:alumno_id>/asistencias-resumen', methods=['GET'])
def resumen_asistencias_alumno(alumno_id):
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        query = """
        SELECT
            m.nombre AS materia,
            SUM(a.estado = 'Presente') AS asistencias,
            SUM(a.estado = 'Justificado') AS faltas_justificadas,
            SUM(a.estado = 'Injustificado') AS faltas_injustificadas
        FROM asistencias a
        JOIN clases c ON a.clase_id = c.id
        JOIN materias m ON c.materia_id = m.id
        WHERE a.alumno_id = %s
        GROUP BY m.nombre
        """

        cursor.execute(query, (alumno_id,))
        resultados = cursor.fetchall()

        resumen = []
        for fila in resultados:
            resumen.append({
                'materia': fila[0],
                'asistencias': int(fila[1]),
                'faltas_justificadas': int(fila[2]),
                'faltas_injustificadas': int(fila[3])
            })

        cursor.close()
        conexion.close()
        return jsonify(resumen)

    except Exception as e:
        print("Error en resumen_asistencias_alumno:", e)
        return jsonify({'error': str(e)}), 500



