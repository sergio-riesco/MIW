(module

  ;; ------------------------------------------------------------
  ;; Memoria
  ;; ------------------------------------------------------------

  ;; Memoria lineal exportada a JavaScript.
  ;; Una página = 64 KiB, así que 48 páginas son 3 MiB.
  ;;
  ;; La imagen más grande que usa la demo (640 x 576) ocupa
  ;; 640 * 576 * 4 bytes = 1,4 MiB de entrada y otro tanto de
  ;; salida, y cabe de sobra. Si llega una imagen mayor,
  ;; JavaScript amplía la memoria con memory.grow().
  (memory (export "memory") 48)


  ;; ------------------------------------------------------------
  ;; Devuelve un color de la paleta como 0xRRGGBB
  ;; ------------------------------------------------------------

  ;; Paleta de la Game Boy, de más oscuro a más claro:
  ;;
  ;; index 0 = #0F380F
  ;; index 1 = #306230
  ;; index 2 = #8BAC0F
  ;; index 3 = #9BBC0F

  (func $palette (param $index i32) (result i32)

    (if (result i32)
      (i32.eq (local.get $index) (i32.const 0))

      (then
        ;; #0F380F
        (i32.const 0x0F380F)
      )

      (else

        (if (result i32)
          (i32.eq (local.get $index) (i32.const 1))

          (then
            ;; #306230
            (i32.const 0x306230)
          )

          (else

            (if (result i32)
              (i32.eq (local.get $index) (i32.const 2))

              (then
                ;; #8BAC0F
                (i32.const 0x8BAC0F)
              )

              (else
                ;; #9BBC0F
                (i32.const 0x9BBC0F)
              )
            )
          )
        )
      )
    )
  )


  ;; ------------------------------------------------------------
  ;; Índice del color de la paleta más cercano a (r, g, b)
  ;;
  ;; Usa la distancia euclídea al cuadrado. No hace falta la raíz
  ;; cuadrada: solo se comparan distancias entre sí.
  ;; ------------------------------------------------------------

  (func $nearest (param $r i32) (param $g i32) (param $b i32) (result i32)

    ;; Contador
    (local $i i32)

    ;; Color de la paleta que se está probando
    (local $color i32)

    ;; Componentes de color de la paleta
    (local $pr i32)
    (local $pg i32)
    (local $pb i32)

    ;; Diferencias de color
    (local $dr i32)
    (local $dg i32)
    (local $db i32)

    ;; Distancia del color al color de la paleta
    (local $distance i32)

    ;; Guarda la distancia mínima encontrada hasta ahora
    (local $best_distance i32)

    ;; Guarda el mejor color encontrado hasta ahora
    (local $best i32)

    ;; Empieza con la mayor distancia posible
    (local.set $best_distance
      (i32.const 0x7FFFFFFF)
    )

    ;; Inicializa el mejor color a 0
    (local.set $best
      (i32.const 0)
    )

    ;; Contador a 0
    (local.set $i
      (i32.const 0)
    )

    (block $done

      (loop $colors

        ;; Color de la paleta número $i.
        (local.set $color
          (call $palette
            (local.get $i)
          )
        )

        ;; Extrae el rojo.
        ;;
        ;; 0xRRGGBB
        ;;  ^^^^^^
        ;;  desplazar 16 bits a la derecha -> 0x0000RR
        ;;
        (local.set $pr
          (i32.shr_u
            (local.get $color)
            (i32.const 16)
          )
        )

        ;; Extrae el verde (desplazar 8 bits y quedarse con 1 byte).
        (local.set $pg
          (i32.and
            (i32.shr_u
              (local.get $color)
              (i32.const 8)
            )
            (i32.const 255)
          )
        )

        ;; Extrae el azul (quedarse con el último byte).
        (local.set $pb
          (i32.and
            (local.get $color)
            (i32.const 255)
          )
        )


        ;; Diferencia en rojo.
        (local.set $dr
          (i32.sub
            (local.get $r)
            (local.get $pr)
          )
        )

        ;; Diferencia en verde.
        (local.set $dg
          (i32.sub
            (local.get $g)
            (local.get $pg)
          )
        )

        ;; Diferencia en azul.
        (local.set $db
          (i32.sub
            (local.get $b)
            (local.get $pb)
          )
        )


        ;; Calcula:
        ;;
        ;; distance =
        ;;   diferencia del rojo²
        ;; + diferencia del verde²
        ;; + diferencia del azul²
        ;;
        (local.set $distance

          (i32.add

            (i32.add

              (i32.mul
                (local.get $dr)
                (local.get $dr)
              )

              (i32.mul
                (local.get $dg)
                (local.get $dg)
              )
            )

            (i32.mul
              (local.get $db)
              (local.get $db)
            )
          )
        )


        ;; Si este color está más cerca, se guarda.
        (if
          (i32.lt_u
            (local.get $distance)
            (local.get $best_distance)
          )

          (then

            (local.set $best_distance
              (local.get $distance)
            )

            (local.set $best
              (local.get $i)
            )
          )
        )


        ;; i++
        (local.set $i
          (i32.add
            (local.get $i)
            (i32.const 1)
          )
        )


        ;; Termina después de probar los 4 colores.
        (br_if $done
          (i32.ge_u
            (local.get $i)
            (i32.const 4)
          )
        )

        ;; Siguiente color.
        (br $colors)
      )
    )

    ;; Devolver el índice de la paleta.
    (local.get $best)
  )


  ;; ------------------------------------------------------------
  ;; Procesar imagen
  ;; ------------------------------------------------------------

  ;; Función exportada. Recibe direcciones de la memoria lineal:
  ;;
  ;; src   = dirección de los píxeles RGBA de entrada
  ;; dst   = dirección de los píxeles RGBA de salida
  ;; count = número de píxeles (ancho * alto)
  ;;
  ;; Entrada:
  ;;
  ;; R G B A
  ;; R G B A
  ;; R G B A
  ;; ...
  ;;
  ;; Salida (mismo formato, con los colores de la paleta):
  ;;
  ;; R G B A
  ;; R G B A
  ;; R G B A
  ;; ...
  ;;
  ;; El canal alfa (A) se copia sin cambios.

  (func (export "process")
    (param $src i32)
    (param $dst i32)
    (param $count i32)

    (local $i i32)
    (local $input i32)
    (local $output i32)

    (local $r i32)
    (local $g i32)
    (local $b i32)
    (local $a i32)

    (local $index i32)
    (local $color i32)


    (local.set $i
      (i32.const 0)
    )


    (block $done

      ;; El bucle comprueba la condición al final, así que sin esta
      ;; comprobación procesaría un píxel aunque count fuera 0.
      (br_if $done
        (i32.eqz
          (local.get $count)
        )
      )

      (loop $pixels

        ;; ------------------------------------------------------
        ;; Dirección del píxel de entrada
        ;;
        ;; Cada píxel ocupa 4 bytes: src + i * 4 (i << 2)
        ;; ------------------------------------------------------

        (local.set $input

          (i32.add

            (local.get $src)

            (i32.shl
              (local.get $i)
              (i32.const 2)
            )
          )
        )


        ;; ------------------------------------------------------
        ;; Dirección del píxel de salida: dst + i * 4
        ;; ------------------------------------------------------

        (local.set $output

          (i32.add

            (local.get $dst)

            (i32.shl
              (local.get $i)
              (i32.const 2)
            )
          )
        )


        ;; ------------------------------------------------------
        ;; Lee R, G, B y A
        ;; ------------------------------------------------------

        (local.set $r
          (i32.load8_u
            (local.get $input)
          )
        )

        (local.set $g
          (i32.load8_u
            (i32.add
              (local.get $input)
              (i32.const 1)
            )
          )
        )

        (local.set $b
          (i32.load8_u
            (i32.add
              (local.get $input)
              (i32.const 2)
            )
          )
        )

        (local.set $a
          (i32.load8_u
            (i32.add
              (local.get $input)
              (i32.const 3)
            )
          )
        )


        ;; ------------------------------------------------------
        ;; Busca el color de la Game Boy más cercano
        ;; ------------------------------------------------------

        (local.set $index

          (call $nearest

            (local.get $r)
            (local.get $g)
            (local.get $b)

          )
        )


        ;; Convierte el índice en su color 0xRRGGBB.
        (local.set $color

          (call $palette
            (local.get $index)
          )
        )


        ;; ------------------------------------------------------
        ;; Escribe el rojo
        ;; ------------------------------------------------------

        (i32.store8

          (local.get $output)

          (i32.shr_u
            (local.get $color)
            (i32.const 16)
          )
        )


        ;; ------------------------------------------------------
        ;; Escribe el verde
        ;; ------------------------------------------------------

        (i32.store8

          (i32.add
            (local.get $output)
            (i32.const 1)
          )

          (i32.and

            (i32.shr_u
              (local.get $color)
              (i32.const 8)
            )

            (i32.const 255)
          )
        )


        ;; ------------------------------------------------------
        ;; Escribe el azul
        ;; ------------------------------------------------------

        (i32.store8

          (i32.add
            (local.get $output)
            (i32.const 2)
          )

          (i32.and
            (local.get $color)
            (i32.const 255)
          )
        )


        ;; ------------------------------------------------------
        ;; Copia el alfa tal cual
        ;; ------------------------------------------------------

        (i32.store8

          (i32.add
            (local.get $output)
            (i32.const 3)
          )

          (local.get $a)
        )


        ;; ------------------------------------------------------
        ;; Siguiente píxel
        ;; ------------------------------------------------------

        (local.set $i

          (i32.add
            (local.get $i)
            (i32.const 1)
          )
        )


        ;; ¿Se han procesado ya todos los píxeles?
        (br_if $done

          (i32.ge_u
            (local.get $i)
            (local.get $count)
          )
        )


        ;; Si no, se repite el bucle.
        (br $pixels)

      )
    )
  )
)
