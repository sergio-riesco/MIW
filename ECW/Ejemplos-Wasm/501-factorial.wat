;; 501-factorial.wat
;; Versión 1.0 11/12/2025 Juan Manuel Cueva Lovelle. Universidad de Oviedo

(module
  ;; Función factorial: recibe un entero y devuelve un entero
  (func $factorial (param $n i32) (result i32)
    (if (result i32)
      ;; Caso base: si n == 0 entonces devuelve 1
      (i32.eq (local.get $n) (i32.const 0))
      (then (i32.const 1))
      ;; Caso recursivo: n * factorial(n-1)
      (else
        (i32.mul
          (local.get $n)
          (call $factorial
            (i32.sub (local.get $n) (i32.const 1))
          )
        )
      )
    )
  )
  ;; Exportamos la función
  (export "factorial" (func $factorial))
)
