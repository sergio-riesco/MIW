(module
  ;; Definimos una función que suma dos enteros
  (func $multiplicacion (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.mul)

  ;; Exportamos la función para que pueda usarse desde JavaScript
  (export "multiplicacion" (func $multiplicacion))
)