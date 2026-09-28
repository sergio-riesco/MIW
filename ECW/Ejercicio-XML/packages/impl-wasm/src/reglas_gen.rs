// =====================================================================
// reglas_gen.rs -- GENERADO por tools/gen-reglas.mjs a partir de reglas.json.
// NO EDITAR A MANO: cualquier cambio se pierde al regenerar.
// Fuente: 1.0.0 -- 18 reglas.
// =====================================================================

pub const NUM_REGLAS: usize = 18;

#[derive(Clone, Copy)]
pub struct Regla {
  pub id: &'static str,
  pub nombre: &'static str,
  pub gravedad: &'static str,
  pub mensaje: &'static str,
}

pub const REGLAS: [Regla; NUM_REGLAS] = [
  Regla { id: "VXML001", nombre: "goto-a-form-inexistente",
         gravedad: "error", mensaje: "El fragmento del goto no corresponde a ningun form del documento." },
  Regla { id: "VXML002", nombre: "form-inaccesible",
         gravedad: "warning", mensaje: "Este form no es alcanzable: nadie hace goto a el y no es el primero." },
  Regla { id: "VXML003", nombre: "ciclo-goto-sin-salida",
         gravedad: "error", mensaje: "Ciclo de goto sin salida: es posible quedar atrapado en un bucle infinito." },
  Regla { id: "VXML004", nombre: "field-sin-prompt",
         gravedad: "error", mensaje: "El field no tiene prompt: el usuario nunca oye la pregunta." },
  Regla { id: "VXML005", nombre: "field-sin-consumidor",
         gravedad: "warning", mensaje: "El field recoge un valor pero nadie lo consume: no hay filled, next ni salida del form." },
  Regla { id: "VXML006", nombre: "nomatch-sin-reprompt",
         gravedad: "warning", mensaje: "El manejador nomatch no hace reprompt ni sale: el usuario se queda bloqueado." },
  Regla { id: "VXML007", nombre: "sin-xml-lang",
         gravedad: "warning", mensaje: "Falta xml:lang en el elemento raiz vxml: la sintesis de voz elegira un idioma por defecto." },
  Regla { id: "VXML008", nombre: "goto-sin-destino",
         gravedad: "error", mensaje: "El goto no tiene ningun destino valido: href, next y event estan ausentes o vacios." },
  Regla { id: "VXML009", nombre: "tipo-field-invalido",
         gravedad: "error", mensaje: "El atributo type del field no es uno de los tipos permitidos por la especificacion." },
  Regla { id: "VXML010", nombre: "break-time-invalido",
         gravedad: "warning", mensaje: "El atributo time del break no es un numero de segundos ni un valor temporal de SSML." },
  Regla { id: "VXML011", nombre: "if-sin-cond",
         gravedad: "error", mensaje: "El elemento if o elseif no tiene atributo cond, que es obligatorio." },
  Regla { id: "VXML012", nombre: "id-form-duplicado",
         gravedad: "error", mensaje: "El id de este form esta duplicado en el documento." },
  Regla { id: "VXML013", nombre: "audio-sin-fuente",
         gravedad: "warning", mensaje: "El elemento audio no indica src ni expr." },
  Regla { id: "VXML014", nombre: "simbolo-tts-ilegible",
         gravedad: "info", mensaje: "El texto del prompt contiene simbolos que el motor TTS suele leer de forma incorrecta." },
  Regla { id: "VXML015", nombre: "identificador-no-declarado",
         gravedad: "info", mensaje: "La expresion referencia un identificador que no esta declarado en el documento." },
  Regla { id: "VXML016", nombre: "form-sin-manejador-error",
         gravedad: "info", mensaje: "El form tiene fields que reconocen voz pero no define nomatch ni noinput." },
  Regla { id: "VXML017", nombre: "goto-a-si-mismo",
         gravedad: "error", mensaje: "El goto apunta al form que lo contiene: bucle infinito inmediato." },
  Regla { id: "VXML018", nombre: "sin-version",
         gravedad: "warning", mensaje: "Falta el atributo version en el elemento raiz vxml." },
];

/// Busca una regla por su NOMBRE (el identificador interno que usa el motor).
pub fn regla_por_nombre(nombre: &str) -> Option<&'static Regla> {
  match nombre {
    "goto-a-form-inexistente" => Some(&REGLAS[0]),
    "form-inaccesible" => Some(&REGLAS[1]),
    "ciclo-goto-sin-salida" => Some(&REGLAS[2]),
    "field-sin-prompt" => Some(&REGLAS[3]),
    "field-sin-consumidor" => Some(&REGLAS[4]),
    "nomatch-sin-reprompt" => Some(&REGLAS[5]),
    "sin-xml-lang" => Some(&REGLAS[6]),
    "goto-sin-destino" => Some(&REGLAS[7]),
    "tipo-field-invalido" => Some(&REGLAS[8]),
    "break-time-invalido" => Some(&REGLAS[9]),
    "if-sin-cond" => Some(&REGLAS[10]),
    "id-form-duplicado" => Some(&REGLAS[11]),
    "audio-sin-fuente" => Some(&REGLAS[12]),
    "simbolo-tts-ilegible" => Some(&REGLAS[13]),
    "identificador-no-declarado" => Some(&REGLAS[14]),
    "form-sin-manejador-error" => Some(&REGLAS[15]),
    "goto-a-si-mismo" => Some(&REGLAS[16]),
    "sin-version" => Some(&REGLAS[17]),
    _ => None,
  }
}
