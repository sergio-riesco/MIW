;; 500-suma.wat
;; Versión 1.0 10/12/2025 Juan Manuel Cueva Lovelle. Universidad de Oviedo

(module
  ;; Definimos una función que suma dos enteros
  (func $suma (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add)

  ;; Exportamos la función para que pueda usarse desde JavaScript
  (export "suma" (func $suma))
)
