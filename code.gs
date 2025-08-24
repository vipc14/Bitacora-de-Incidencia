/**
 * Bitácora de Incidencias - Backend (Google Apps Script)
 * Desarrollado por: ING Jose Paredes GCAI-Mérida-*611
 * 
 * Este archivo contiene todas las funciones del backend que manejan:
 * 1. Gestión de la interfaz web
 * 2. Operaciones con la hoja de cálculo
 * 3. Autenticación y gestión de usuarios
 * 4. Cálculos de horarios y validaciones
 * 5. Exportación de datos
 */

/**
 * Función principal que despliega la interfaz HTML
 * Se ejecuta cuando se accede a la aplicación web
 * @return {HtmlOutput} La interfaz HTML renderizada
 */
function doGet() {
  var template = HtmlService.createTemplateFromFile('Index');
  var output = template.evaluate();
  return output;
}

/**
 * Función para incluir archivos HTML/CSS en la plantilla principal
 * @param {string} Css - Nombre del archivo a incluir
 * @return {string} Contenido del archivo
 */
function include(Css) {
  return HtmlService.createHtmlOutputFromFile(Css).getContent();
}

/**
 * Calcula las horas laborables entre dos fechas según el horario del proveedor
 * @param {Date|String} fechaInicio - Fecha/hora de inicio del evento
 * @param {Date|String} fechaFin - Fecha/hora de solución del evento
 * @param {String} proveedor - Nombre del proveedor
 * @return {String} Duración del evento en formato "Xh Ym Zs"
 * @throws {Error} Si el proveedor no tiene horario definido o la fecha de solución es anterior
 */
function calcularHorasLaborables(fechaInicio, fechaFin, proveedor) {
  const proveedores = {
    "EPSDC-ATE": { inicio: 8, fin: 17, trabajaDomingo: false },
    "ASISTA SERVICIOS": { inicio: 8, fin: 17, trabajaDomingo: false },
    "VIRTUAL": { inicio: 8, fin: 19, trabajaDomingo: false },
    "BARINAS": { inicio: 9, fin: 18, trabajaDomingo: true },
    "TIBISAY": { inicio: 8, fin: 17, trabajaDomingo: false },
    "TACHIRA": { inicio: 8, fin: 17, trabajaDomingo: false },
    "EL RECREO": { inicio: 10, fin: 20, trabajaDomingo: true },
    "METROCENTER": { inicio: 9, fin: 18, trabajaDomingo: false },
    "CCCT": { inicio: 8, fin: 19, trabajaDomingo: false },
    "SAMBIL LA CANDELARIA": { inicio: 10, fin: 21, trabajaDomingo: true },
    "SAMBIL CHACAO": { inicio: 10, fin: 21, trabajaDomingo: true },
    "BUENAVENTURA": { inicio: 9, fin: 18, trabajaDomingo: false },
    "CHARALLAVE": { inicio: 8, fin: 17, trabajaDomingo: false },
    "SAN ANTONIO": { inicio: 8, fin: 17, trabajaDomingo: false },
    "SAN FERNANDO DE APURE": { inicio: 8, fin: 17, trabajaDomingo: false },
    "LAS AMÉRICAS": { inicio: 8, fin: 17, trabajaDomingo: false },
    "TORRE VALENCIA": { inicio: 8, fin: 17, trabajaDomingo: false },
    "SAN JUAN DE LOS MORROS": { inicio: 8, fin: 17, trabajaDomingo: false },
    "BUENAVENTURA ARAURE": { inicio: 8, fin: 17, trabajaDomingo: false },
    "METRÓPOLIS": { inicio: 10, fin: 19, trabajaDomingo: true },
    "PUERTO ORDAZ": { inicio: 8, fin: 17, trabajaDomingo: false },
    "ORINOCO": { inicio: 8, fin: 17, trabajaDomingo: false },
    "MONAGAS PLAZA": { inicio: 9, fin: 18, trabajaDomingo: false },
    "SAMBIL PARAGUANÁ": { inicio: 10, fin: 19, trabajaDomingo: true },
    "VALERA": { inicio: 9, fin: 18, trabajaDomingo: false },
    "BELLA VISTA": { inicio: 8, fin: 17, trabajaDomingo: false },
    "CABIMAS": { inicio: 8, fin: 17, trabajaDomingo: false },
    "PLAZA MAYOR": { inicio: 8, fin: 17, trabajaDomingo: false },
    "PORLAMAR": { inicio: 8, fin: 17, trabajaDomingo: false },
    "CUMANÁ": { inicio: 8, fin: 17, trabajaDomingo: false }
  };

  if (!(proveedor in proveedores)) {
    throw new Error("Horario no definido para el proveedor: " + proveedor);
  }

  const { inicio: horaInicio, fin: horaFin, trabajaDomingo } = proveedores[proveedor];
  let inicio = new Date(fechaInicio);
  let fin = new Date(fechaFin);

  if (fin < inicio) {
    throw new Error("La fecha de solución es anterior a la fecha de inicio.");
  }

  let totalMilisegundos = 0;
  let actual = new Date(inicio);

  while (actual < fin) {
    const dia = actual.getDay();
    const esDomingo = dia === 0;

    if (esDomingo && !trabajaDomingo) {
      actual.setDate(actual.getDate() + 1);
      actual.setHours(0, 0, 0, 0);
      continue;
    }

    // Hora de inicio y fin del turno laboral ese día
    let turnoInicio = new Date(actual);
    turnoInicio.setHours(horaInicio, 0, 0, 0);

    let turnoFin = new Date(actual);
    turnoFin.setHours(horaFin, 0, 0, 0);

    // Cálculo de tiempo válido trabajado ese día
    let desde = new Date(Math.max(actual, turnoInicio));
    let hasta = new Date(Math.min(fin, turnoFin));

    if (desde < hasta) {
      totalMilisegundos += hasta - desde;
    }

    // Avanzar al siguiente día
    actual.setDate(actual.getDate() + 1);
    actual.setHours(0, 0, 0, 0);
  }

  // Convertimos el tiempo total en horas, minutos y segundos
  let totalSegundos = Math.floor(totalMilisegundos / 1000);
  let horas = Math.floor(totalSegundos / 3600);
  let minutos = Math.floor((totalSegundos % 3600) / 60);
  let segundos = totalSegundos % 60;

  return `${horas}h ${minutos}m ${segundos}s`;
}

/**
 * Verifica si una fecha/hora está dentro del horario laboral del proveedor
 * @param {String} fecha - Fecha/hora a validar
 * @param {String} proveedor - Nombre del proveedor
 * @return {Boolean} true si está dentro del horario, false en caso contrario
 */
function esHoraValidaParaProveedor(fecha, proveedor) {
  const proveedores = {
    "EPSDC-ATE": { inicio: 8, fin: 17, trabajaDomingo: false },
    "ASISTA SERVICIOS": { inicio: 8, fin: 17, trabajaDomingo: false },
    "VIRTUAL": { inicio: 8, fin: 19, trabajaDomingo: false },
    "BARINAS": { inicio: 9, fin: 18, trabajaDomingo: true },
    "TIBISAY": { inicio: 8, fin: 17, trabajaDomingo: false },
    "TACHIRA": { inicio: 8, fin: 17, trabajaDomingo: false },
    "EL RECREO": { inicio: 10, fin: 20, trabajaDomingo: true },
    "METROCENTER": { inicio: 9, fin: 18, trabajaDomingo: false },
    "CCCT": { inicio: 8, fin: 19, trabajaDomingo: false },
    "SAMBIL LA CANDELARIA": { inicio: 10, fin: 21, trabajaDomingo: true },
    "SAMBIL CHACAO": { inicio: 10, fin: 21, trabajaDomingo: true },
    "BUENAVENTURA": { inicio: 9, fin: 18, trabajaDomingo: false },
    "CHARALLAVE": { inicio: 8, fin: 17, trabajaDomingo: false },
    "SAN ANTONIO": { inicio: 8, fin: 17, trabajaDomingo: false },
    "SAN FERNANDO DE APURE": { inicio: 8, fin: 17, trabajaDomingo: false },
    "LAS AMÉRICAS": { inicio: 8, fin: 17, trabajaDomingo: false },
    "TORRE VALENCIA": { inicio: 8, fin: 17, trabajaDomingo: false },
    "SAN JUAN DE LOS MORROS": { inicio: 8, fin: 17, trabajaDomingo: false },
    "BUENAVENTURA ARAURE": { inicio: 8, fin: 17, trabajaDomingo: false },
    "METRÓPOLIS": { inicio: 10, fin: 19, trabajaDomingo: true },
    "PUERTO ORDAZ": { inicio: 8, fin: 17, trabajaDomingo: false },
    "ORINOCO": { inicio: 8, fin: 17, trabajaDomingo: false },
    "MONAGAS PLAZA": { inicio: 9, fin: 18, trabajaDomingo: false },
    "SAMBIL PARAGUANÁ": { inicio: 10, fin: 19, trabajaDomingo: true },
    "VALERA": { inicio: 9, fin: 18, trabajaDomingo: false },
    "BELLA VISTA": { inicio: 8, fin: 17, trabajaDomingo: false },
    "CABIMAS": { inicio: 8, fin: 17, trabajaDomingo: false },
    "PLAZA MAYOR": { inicio: 8, fin: 17, trabajaDomingo: false },
    "PORLAMAR": { inicio: 8, fin: 17, trabajaDomingo: false },
    "CUMANÁ": { inicio: 8, fin: 17, trabajaDomingo: false }
  };
  
  if (!(proveedor in proveedores)) return false;
  
  const info = proveedores[proveedor];
  let fechaFormateada = fecha;
  
  // Si la cadena tiene "T", convertirla a "YYYY-MM-DD HH:mm:ss"
  if (fecha.indexOf("T") !== -1) {
    fechaFormateada = fecha.replace("T", " ") + ":00";
  }
  
  // Crear objeto Date
  let fechaObj = new Date(fechaFormateada);
  
  // Obtener el timezone configurado en el script (asegúrate de que sea el correcto)
  const tz = Session.getScriptTimeZone();
  const fechaStrLocal = Utilities.formatDate(fechaObj, tz, "yyyy-MM-dd HH:mm:ss");
  
  // Crear nuevamente el objeto Date usando la cadena formateada
  fechaObj = new Date(fechaStrLocal);
  
  const dia = fechaObj.getDay(); // 0 = domingo
  const horaDecimal = fechaObj.getHours() + (fechaObj.getMinutes() / 60);
  
  // Imprimir para depuración
  Logger.log("Fecha original: " + fecha);
  Logger.log("Fecha formateada: " + fechaFormateada);
  Logger.log("Fecha local: " + fechaStrLocal);
  Logger.log("Hora decimal calculada: " + horaDecimal);
  Logger.log("Horario de " + proveedor + ": " + info.inicio + " a " + info.fin);
  
  if (dia === 0 && !info.trabajaDomingo) return false;
  
  // Permitir la hora de cierre exacta
  return (horaDecimal >= info.inicio && horaDecimal <= info.fin);
}

/**
 * Agrega un nuevo registro en la hoja de cálculo
 * @param {Object} data - Datos del registro a agregar
 * @return {Object} Resultado de la operación con mensaje y número de registro
 */
function agregarDatos(data) {
  const hoja = SpreadsheetApp.getActive().getSheetByName("BD");
  let numero = data.numeroRegistro.trim();

  if (!numero) {
    numero = generarNumeroRegistro();
  }

  let duracionEvento = "";
  if (data.fechaInicio && data.fechaSolucion) {
    try {
      duracionEvento = calcularHorasLaborables(data.fechaInicio, data.fechaSolucion, data.proveedor);
    } catch (e) {
      Logger.log("Error al calcular la duración: " + e);
      duracionEvento = "Error";
    }
  }

  hoja.appendRow([
    numero,
    data.proveedor,
    data.tipoIncidencia,
    data.nombreEvento,
    data.fechaInicio,
    data.fechaEscalamiento,
    data.nivelEscalamiento,
    data.causaIncidencia,
    data.fechaSolucion,
    data.detectadoPor,
    data.reportadoA,
    data.responsable,
    data.ticket,
    data.descripcion,
    data.observaciones,
    duracionEvento,
    data.estatus
  ]);

  return {
    ok: true,
    numeroRegistro: numero,
    message: "Registro agregado exitosamente."
  };
}

/**
 * Busca un registro por su número en la hoja de cálculo
 * @param {String} numero - Número de registro a buscar
 * @return {Object} Datos del registro encontrado o mensaje de error
 */
function buscarRegistro(numero) {
  const hoja = SpreadsheetApp.getActive().getSheetByName("BD");
  const datos = hoja.getDataRange().getValues();
  numero = numero.trim();

  for (let i = 1; i < datos.length; i++) {
    if (datos[i][0] && datos[i][0].toString().trim() === numero) {
      return {
        ok: true,
        rowIndex: i + 1,
        registro: {
          numeroRegistro: datos[i][0],
          proveedor: datos[i][1],
          tipoIncidencia: datos[i][2],
          nombreEvento: datos[i][3],
          fechaInicio: formatearFecha(datos[i][4]),
          fechaEscalamiento: formatearFecha(datos[i][5]),
          nivelEscalamiento: datos[i][6],
          causaIncidencia: datos[i][7],
          fechaSolucion: formatearFecha(datos[i][8]),
          detectadoPor: datos[i][9],
          reportadoA: datos[i][10],
          responsable: datos[i][11],
          ticket: datos[i][12],
          descripcion: datos[i][13],
          observaciones: datos[i][14],
          estatus: datos[i][16]
        }
      };
    }
  }
  return {
    ok: false,
    message: "Registro no encontrado."
  };
}

/**
 * Actualiza un registro existente en la hoja de cálculo
 * @param {Object} data - Datos actualizados del registro
 * @return {Object} Resultado de la operación con mensaje
 */
function actualizarRegistro(data) {
  const hoja = SpreadsheetApp.getActive().getSheetByName("BD");
  const fila = parseInt(data.rowIndex, 10);

  if (isNaN(fila) || fila < 2) {
    return {
      ok: false,
      message: "Índice de fila no válido."
    };
  }

  let duracionEvento = "";
  if (data.fechaInicio && data.fechaSolucion) {
    try {
      duracionEvento = calcularHorasLaborables(data.fechaInicio, data.fechaSolucion, data.proveedor);
    } catch (e) {
      Logger.log("Error al calcular la duración: " + e);
      duracionEvento = "Error";
    }
  }

  hoja.getRange(fila, 1, 1, 17).setValues([[
    data.numeroRegistro.trim(),
    data.proveedor,
    data.tipoIncidencia,
    data.nombreEvento,
    data.fechaInicio,
    data.fechaEscalamiento,
    data.nivelEscalamiento,
    data.causaIncidencia,
    data.fechaSolucion,
    data.detectadoPor,
    data.reportadoA,
    data.responsable,
    data.ticket,
    data.descripcion,
    data.observaciones,
    duracionEvento,
    data.estatus
  ]]);

  return {
    ok: true,
    message: "Registro actualizado correctamente."
  };
}

/**
 * Genera un número de registro único basado en timestamp
 * @return {String} Número de registro en formato "NR-XXXXXX"
 */
function generarNumeroRegistro() {
  const ahora = new Date();
  const timestamp = ahora.getTime();
  return `NR-${timestamp.toString().slice(-6)}`;
}

/**
 * Formatea una fecha al formato ISO para campos datetime-local
 * @param {Date|String} valor - Fecha a formatear
 * @return {String} Fecha formateada o cadena vacía si no es válida
 */
function formatearFecha(valor) {
  if (!valor) return "";
  try {
    const fecha = new Date(valor);
    return Utilities.formatDate(fecha, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm");
  } catch (e) {
    return "";
  }
}

/**
 * Obtiene datos para exportar a Excel, filtrados por proveedor
 * @param {String} proveedor - Proveedor para filtrar los datos
 * @return {Array} Array con los datos formateados para Excel
 */
function obtenerDatosParaExcel(proveedor) {
  let resultado = [];
  try {
    Logger.log("🔽 Iniciando función obtenerDatosParaExcel...");
    
    // SI USAS SCRIPT VINCULADO A LA HOJA:
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName("BD");

    if (!hoja) {
      Logger.log("❌ No se encontró la hoja 'BD'");
      throw new Error("Hoja no encontrada");
    }

    const datos = hoja.getDataRange().getValues();
    Logger.log("📄 Total de filas obtenidas: " + datos.length);

    const proveedorSolicitado = (proveedor || "").toString().trim().toUpperCase();
    Logger.log("🔍 Proveedor solicitado: " + proveedorSolicitado);

    // Formatear fechas y filtrar
    for (let i = 0; i < datos.length; i++) {
      let filaFormateada = [];
      if (i === 0) {
        resultado.push(datos[i]); // Cabecera
      } else {
        filaFormateada = datos[i].map((valor, idx) => {
          if (valor instanceof Date) {
            return Utilities.formatDate(valor, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
          }
          return valor;
        });
        
        let proveedorFila = (filaFormateada[1] || "").toString().trim().toUpperCase();
        if (proveedorSolicitado === "TODOS" || proveedorFila === proveedorSolicitado) {
          resultado.push(filaFormateada);
        }
      }
    }

    Logger.log("✅ Total de filas en resultado: " + resultado.length);
    return resultado.length > 1 ? resultado : [];

  } catch (error) {
    Logger.log("💥 Error capturado: " + error);
    throw error; // Propagar error al cliente
  }
}

function mostrarVentanaEmergente(mensaje) {
  document.getElementById("mensajeVentana").innerText = mensaje;
  document.getElementById("ventanaEmergente").style.display = "block";
}

function cerrarVentana() {
  document.getElementById("ventanaEmergente").style.display = "none";
}

/**
 * Carga la imagen del logo desde Google Drive
 * @return {String} Imagen codificada en base64
 */
function loadImageBytes() {
  const fileId = "ID DE LA IMAGEN GUARDADA EN GOOGLE DRIVE"; // tu ID real
  const blob = DriveApp.getFileById(fileId).getBlob();
  return Utilities.base64Encode(blob.getBytes());
}

// Constantes para la hoja de usuarios
const USER_SHEET_NAME = "Usuarios";
const SALT_ROUNDS = 10;

/**
 * Inicializa la hoja de usuarios con la estructura necesaria
 * Crea usuarios superadmin y admin por defecto si no existen
 * @throws {Error} Si hay problemas al crear la hoja o los usuarios
 */
function initializeUserSheet() {
  try {
    Logger.log("Inicializando hoja de usuarios...");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let userSheet = ss.getSheetByName(USER_SHEET_NAME);
    
    if (!userSheet) {
      Logger.log("Creando nueva hoja de usuarios...");
      userSheet = ss.insertSheet(USER_SHEET_NAME);
      // Crear encabezados
      userSheet.appendRow([
        "Username",
        "Password",
        "Salt",
        "Role",
        "Provider",
        "FirstName",
        "LastName",
        "CreatedDate",
        "LastAccess"
      ]);
    }
    
    // Verificar si la hoja está vacía
    if (userSheet.getLastRow() === 0) {
      Logger.log("Hoja vacía, agregando encabezados...");
      userSheet.appendRow([
        "Username",
        "Password",
        "Salt",
        "Role",
        "Provider",
        "FirstName",
        "LastName",
        "CreatedDate",
        "LastAccess"
      ]);
    }
    
    // Crear superadmin inicial si no existe
    const data = userSheet.getDataRange().getValues();
    let superadminExists = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === "superadmin") {
        superadminExists = true;
        break;
      }
    }
    
    if (!superadminExists) {
      Logger.log("Creando usuario superadmin inicial...");
      const superadminPassword = "superadmin123";
      const salt = generateSalt();
      const hashedPassword = hashPassword(superadminPassword, salt);
      
      userSheet.appendRow([
        "superadmin",
        hashedPassword,
        salt,
        "superadmin",
        null,
        "Super",
        "Admin",
        new Date(),
        new Date()
      ]);
    }
    
    // Crear admin inicial si no existe
    let adminExists = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === "admin") {
        adminExists = true;
        break;
      }
    }
    
    if (!adminExists) {
      Logger.log("Creando usuario admin inicial...");
      const adminPassword = "admin123";
      const salt = generateSalt();
      const hashedPassword = hashPassword(adminPassword, salt);
      
      userSheet.appendRow([
        "admin",
        hashedPassword,
        salt,
        "admin",
        null,
        "Admin",
        "User",
        new Date(),
        new Date()
      ]);
    }

    // Ajustar el ancho de las columnas
    userSheet.autoResizeColumns(1, 9);
    Logger.log("Hoja de usuarios inicializada correctamente");
  } catch (error) {
    Logger.log("Error al inicializar hoja de usuarios: " + error.toString());
    throw error;
  }
}

/**
 * Genera un salt aleatorio para el hash de contraseñas
 * @return {String} UUID generado
 */
function generateSalt() {
  return Utilities.getUuid();
}

/**
 * Genera el hash de una contraseña usando SHA-256
 * @param {String} password - Contraseña a hashear
 * @param {String} salt - Salt para el hash
 * @return {String} Hash generado
 */
function hashPassword(password, salt) {
  try {
    if (!password || !salt) {
      Logger.log("Faltan datos para hashear contraseña");
      return '';
    }
    
    const hashed = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      password + salt
    ).map(function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
    
    Logger.log("Contraseña hasheada correctamente");
    return hashed;
  } catch (error) {
    Logger.log("Error al hashear contraseña: " + error.toString());
    return '';
  }
}

/**
 * Verifica si una contraseña coincide con su hash
 * @param {String} password - Contraseña a verificar
 * @param {String} hashedPassword - Hash almacenado
 * @param {String} salt - Salt usado en el hash
 * @return {Boolean} true si la contraseña coincide
 */
function verifyPassword(password, hashedPassword, salt) {
  try {
    if (!password || !hashedPassword || !salt) {
      Logger.log("Faltan datos para verificar contraseña");
      return false;
    }
    
    const hashedInput = hashPassword(password, salt);
    const result = hashedInput === hashedPassword;
    
    Logger.log("Verificación de contraseña: " + (result ? "correcta" : "incorrecta"));
    return result;
  } catch (error) {
    Logger.log("Error al verificar contraseña: " + error.toString());
    return false;
  }
}

/**
 * Autentica un usuario y devuelve sus datos
 * @param {String} username - Nombre de usuario
 * @param {String} password - Contraseña
 * @return {Object} Resultado de la autenticación y datos del usuario
 */
function authenticateUser(username, password) {
  try {
    Logger.log("=== INICIO DE AUTENTICACIÓN ===");
    Logger.log("Intentando autenticar usuario: " + username);
    
    // Validar que el usuario y contraseña no estén vacíos
    if (!username || !password) {
      Logger.log("Usuario o contraseña vacíos");
      return { ok: false, message: "Usuario y contraseña son requeridos" };
    }

    // Convertir username a string para asegurar consistencia
    username = String(username).trim();

    // Obtener la hoja de usuarios
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName(USER_SHEET_NAME);
    
    if (!userSheet) {
      Logger.log("No se encontró la hoja de usuarios, inicializando...");
      initializeUserSheet();
      return { ok: false, message: "Error en la autenticación" };
    }

    // Obtener todos los usuarios
    const data = userSheet.getDataRange().getValues();
    Logger.log("Total de usuarios en la hoja: " + (data.length - 1));

    // Buscar el usuario
    let userFound = false;
    let userData = null;
    
    for (let i = 1; i < data.length; i++) {
      const storedUsername = String(data[i][0]).trim();
      Logger.log("Comparando con usuario almacenado: " + storedUsername);
      
      if (storedUsername === username) {
        userFound = true;
        userData = {
          row: i + 1,
          username: data[i][0],
          password: data[i][1],
          salt: data[i][2],
          role: data[i][3],
          provider: data[i][4],
          firstName: data[i][5] || '',
          lastName: data[i][6] || ''
        };
        Logger.log("Usuario encontrado en la fila: " + userData.row);
        break;
      }
    }

    if (!userFound) {
      Logger.log("Usuario no encontrado en la base de datos");
      return { ok: false, message: "Usuario no encontrado" };
    }

    // Verificar la contraseña
    Logger.log("Verificando contraseña...");
    let passwordValid = false;

    if (userData.salt) {
      // Si hay salt, la contraseña está hasheada
      const hashedInput = hashPassword(password, userData.salt);
      passwordValid = (hashedInput === userData.password);
      Logger.log("Contraseña hasheada: " + (passwordValid ? "correcta" : "incorrecta"));
    } else {
      // Si no hay salt, comparar directamente
      passwordValid = (password === userData.password);
      Logger.log("Contraseña sin hash: " + (passwordValid ? "correcta" : "incorrecta"));
    }

    if (!passwordValid) {
      Logger.log("Contraseña incorrecta");
      return { ok: false, message: "Contraseña incorrecta" };
    }

    // Actualizar último acceso
    Logger.log("Actualizando último acceso...");
    userSheet.getRange(userData.row, 9).setValue(new Date());

    // Retornar datos del usuario
    Logger.log("Autenticación exitosa");
    return {
      ok: true,
      user: {
        username: userData.username,
        role: userData.role,
        provider: userData.provider,
        firstName: userData.firstName,
        lastName: userData.lastName
      }
    };

  } catch (error) {
    Logger.log("Error en autenticación: " + error.toString());
    return { ok: false, message: "Error en la autenticación: " + error.toString() };
  } finally {
    Logger.log("=== FIN DE AUTENTICACIÓN ===");
  }
}

/**
 * Crea un nuevo usuario en el sistema
 * @param {String} username - Nombre de usuario
 * @param {String} password - Contraseña
 * @param {String} role - Rol del usuario
 * @param {String} provider - Proveedor asignado
 * @param {String} firstName - Nombre
 * @param {String} lastName - Apellido
 * @return {Object} Resultado de la operación
 */
function createUser(username, password, role, provider, firstName, lastName) {
  try {
    Logger.log("Iniciando creación de usuario: " + username);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName(USER_SHEET_NAME);
    
    if (!userSheet) {
      Logger.log("No se encontró la hoja de usuarios, inicializando...");
      initializeUserSheet();
      return { ok: false, message: 'No se encontró la hoja de usuarios' };
    }

    // Validar que el usuario no esté vacío
    if (!username || !password) {
      Logger.log("Usuario o contraseña vacíos");
      return { ok: false, message: 'El usuario y la contraseña son obligatorios' };
    }

    // Convertir username a string para asegurar consistencia
    username = String(username).trim();

    // Validar que el usuario contenga solo letras, números y caracteres especiales permitidos
    const usernameRegex = /^[a-zA-Z0-9@._-]+$/;
    if (!usernameRegex.test(username)) {
      Logger.log("Usuario no cumple con el formato requerido");
      return { ok: false, message: 'El usuario solo puede contener letras, números y los caracteres @._-' };
    }

    // Validar que el usuario no exista
    const data = userSheet.getDataRange().getValues();
    Logger.log("Verificando si el usuario ya existe...");
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === username) {
        Logger.log("Usuario ya existe en la fila: " + (i + 1));
        return { ok: false, message: 'El usuario ya existe' };
      }
    }

    // Validar que el rol sea válido
    if (!['admin', 'user'].includes(role)) {
      Logger.log("Rol no válido: " + role);
      return { ok: false, message: 'Rol no válido' };
    }

    // Validar que el proveedor sea válido si el rol es user
    if (role === 'user' && !provider) {
      Logger.log("Proveedor requerido para usuarios normales");
      return { ok: false, message: 'El proveedor es obligatorio para usuarios' };
    }

    // Generar salt y hash para la contraseña
    Logger.log("Generando salt y hash para la contraseña...");
    const salt = generateSalt();
    const hashedPassword = hashPassword(password, salt);

    // Crear el nuevo usuario con todos los campos necesarios
    const newUser = [
      username,
      hashedPassword,
      salt,
      role,
      provider || '',
      firstName || '',
      lastName || '',
      new Date(), // CreatedDate
      new Date()  // LastAccess
    ];

    Logger.log("Agregando nuevo usuario a la hoja...");
    userSheet.appendRow(newUser);
    
    // Verificar que el usuario se haya creado correctamente
    const newData = userSheet.getDataRange().getValues();
    let userCreated = false;
    for (let i = 1; i < newData.length; i++) {
      if (String(newData[i][0]).trim() === username) {
        userCreated = true;
        Logger.log("Usuario creado exitosamente en la fila: " + (i + 1));
        break;
      }
    }

    if (!userCreated) {
      Logger.log("Error: Usuario no se pudo crear correctamente");
      return { ok: false, message: 'Error al crear el usuario' };
    }

    Logger.log("Usuario creado exitosamente");
    return { ok: true, message: 'Usuario creado exitosamente' };
  } catch (error) {
    Logger.log("Error al crear usuario: " + error.toString());
    return { ok: false, message: 'Error al crear usuario: ' + error.toString() };
  }
}

/**
 * Actualiza los datos de un usuario existente
 * @param {String} username - Nombre de usuario a actualizar
 * @param {String} newPassword - Nueva contraseña (opcional)
 * @param {String} newProvider - Nuevo proveedor (opcional)
 * @param {String} newFirstName - Nuevo nombre (opcional)
 * @param {String} newLastName - Nuevo apellido (opcional)
 * @return {Object} Resultado de la operación
 */
function updateUser(username, newPassword, newProvider, newFirstName, newLastName) {
  const currentUser = Session.getActiveUser().getEmail();
  const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USER_SHEET_NAME);
  
  // Verificar si el usuario actual es superadmin
  const data = userSheet.getDataRange().getValues();
  let isSuperAdmin = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === "superadmin") {
      isSuperAdmin = true;
      break;
    }
  }
  
  if (!isSuperAdmin) {
    return { ok: false, message: "No tiene permisos para actualizar usuarios" };
  }

  // Buscar y actualizar usuario
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      if (newPassword) {
        const salt = generateSalt();
        const hashedPassword = hashPassword(newPassword, salt);
        userSheet.getRange(i + 1, 2).setValue(hashedPassword);
        userSheet.getRange(i + 1, 3).setValue(salt);
      }
      if (newProvider) {
        userSheet.getRange(i + 1, 5).setValue(newProvider);
      }
      if (newFirstName) {
        userSheet.getRange(i + 1, 6).setValue(newFirstName);
      }
      if (newLastName) {
        userSheet.getRange(i + 1, 7).setValue(newLastName);
      }
      return { ok: true, message: "Usuario actualizado exitosamente" };
    }
  }
  return { ok: false, message: "Usuario no encontrado" };
}

/**
 * Elimina un usuario del sistema
 * @param {String} username - Nombre de usuario a eliminar
 * @return {Object} Resultado de la operación
 */
function deleteUser(username) {
  try {
    Logger.log("=== INICIO DE ELIMINACIÓN DE USUARIO ===");
    Logger.log("Intentando eliminar usuario: " + username);

    // Convertir username a string para asegurar consistencia
    username = String(username).trim();

    const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USER_SHEET_NAME);
    
    if (!userSheet) {
      Logger.log("No se encontró la hoja de usuarios");
      return { ok: false, message: "No se encontró la hoja de usuarios" };
    }

    // Verificar si el usuario actual es superadmin
    const data = userSheet.getDataRange().getValues();
    let isSuperAdmin = false;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === "superadmin") {
        isSuperAdmin = true;
        break;
      }
    }
    
    if (!isSuperAdmin) {
      Logger.log("Usuario no tiene permisos de superadmin");
      return { ok: false, message: "No tiene permisos para eliminar usuarios" };
    }

    // Buscar y eliminar usuario
    let userFound = false;
    for (let i = 1; i < data.length; i++) {
      const storedUsername = String(data[i][0]).trim();
      Logger.log("Comparando con usuario almacenado: " + storedUsername);
      
      if (storedUsername === username) {
        if (username === "superadmin" || username === "admin") {
          Logger.log("No se puede eliminar el usuario " + username);
          return { ok: false, message: "No se puede eliminar este usuario" };
        }
        userSheet.deleteRow(i + 1);
        userFound = true;
        Logger.log("Usuario eliminado exitosamente");
        break;
      }
    }

    if (!userFound) {
      Logger.log("Usuario no encontrado");
      return { ok: false, message: "Usuario no encontrado" };
    }

    Logger.log("=== FIN DE ELIMINACIÓN DE USUARIO ===");
    return { ok: true, message: "Usuario eliminado exitosamente" };
  } catch (error) {
    Logger.log("Error al eliminar usuario: " + error.toString());
    return { ok: false, message: "Error al eliminar usuario: " + error.toString() };
  }
}

/**
 * Obtiene la lista de usuarios del sistema
 * @return {Array} Lista de usuarios con sus datos
 */
function getUsers() {
  const currentUser = Session.getActiveUser().getEmail();
  const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USER_SHEET_NAME);
  
  // Verificar si el usuario actual es superadmin
  const data = userSheet.getDataRange().getValues();
  let isSuperAdmin = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === "superadmin") {
      isSuperAdmin = true;
      break;
    }
  }
  
  if (!isSuperAdmin) {
    return [];
  }

  const users = [];
  for (let i = 1; i < data.length; i++) {
    users.push({
      username: data[i][0],
      role: data[i][3],
      provider: data[i][4],
      firstName: data[i][5],
      lastName: data[i][6]
    });
  }
  return users;
}

/**
 * Verifica si el usuario actual está autenticado
 * @return {Boolean} true si está autenticado
 */
function isAuthenticated() {
  const currentUser = Session.getActiveUser().getEmail();
  const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USER_SHEET_NAME);
  const data = userSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === currentUser) {
      return true;
    }
  }
  return false;
}

/**
 * Verifica si el usuario actual es administrador
 * @return {Boolean} true si es administrador
 */
function isAdmin() {
  const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USER_SHEET_NAME);
  const data = userSheet.getDataRange().getValues();
  const currentUser = Session.getActiveUser().getEmail();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === currentUser && data[i][3] === 'admin') {
      return true;
    }
  }
  
  return false;
}

/**
 * Obtiene el proveedor asignado al usuario actual
 * @return {String|null} Nombre del proveedor o null
 */
function getUserProvider() {
  const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USER_SHEET_NAME);
  const data = userSheet.getDataRange().getValues();
  const currentUser = Session.getActiveUser().getEmail();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === currentUser) {
      return data[i][4];
    }
  }
  
  return null;
}
