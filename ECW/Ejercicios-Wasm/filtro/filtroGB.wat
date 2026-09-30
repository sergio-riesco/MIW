(module

  ;; ------------------------------------------------------------
  ;; Memoria
  ;; ------------------------------------------------------------

  ;; Consigue 256 páginas de memoria de Web Assembly.
  ;; Una página = 64 KiB.
  (memory (export "memory") 256)


  ;; ------------------------------------------------------------
  ;; Color de la separación entre píxeles del LCD
  ;; ------------------------------------------------------------

  ;; En la Game Boy original los píxeles no son cuadrados ni pegados:
  ;; entre cada píxel físico hay una separación verde muy oscura por
  ;; la que se ve el sustrato del LCD. Este es ese color.
  (global $gridColor i32 (i32.const 0x1B2A18))


  ;; ------------------------------------------------------------
  ;; Consigue un color de la paleta
  ;; ------------------------------------------------------------

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
  ;; Encuentra el color de GameBoy más cercano
  ;; ------------------------------------------------------------

  (func $nearest (param $r i32) (param $g i32) (param $b i32) (result i32)

    ;; Contador
    (local $i i32)

    ;; Color actual 
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

        ;; Consigue color de la paleta.
        (local.set $color
          (call $palette
            (local.get $i)
          )
        )

        ;; Extrae el rojo.
        ;;
        ;; 0xRRGGBB
        ;;  ^^^^^^
        ;;  shift a la derecha 16 bits -> 0x0000RR
        ;;
        (local.set $pr
          (i32.shr_u
            (local.get $color)
            (i32.const 16)
          )
        )

        ;; Extrae verde (shift a la derecha 8 bits).
        (local.set $pg
          (i32.and
            (i32.shr_u
              (local.get $color)
              (i32.const 8)
            )
            (i32.const 255)
          )
        )

        ;; Extract azul.
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


        ;; Si este color es más cercano, guárdalo 
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


        ;; Para después de 4 colores.
        (br_if $done
          (i32.ge_u
            (local.get $i)
            (i32.const 4)
          )
        )

        ;; Continuar loop.
        (br $colors)
      )
    )

    ;; Devolver el índice de la paleta.
    (local.get $best)
  )


  ;; ------------------------------------------------------------
  ;; Procesar imagen
  ;; ------------------------------------------------------------

  ;; src   = dirección de los pixels RGBA del input
  ;; dst   = dirección de los pixels RGBA del output
  ;; count = numero de pixeles
  ;;
  ;; Input:
  ;;
  ;; R G B A
  ;; R G B A
  ;; R G B A
  ;; ...
  ;;
  ;; Output:
  ;;
  ;; R G B A
  ;; R G B A
  ;; R G B A
  ;; ...
  ;;
  ;; Alfa (A) se preserva.

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

      (loop $pixels

        ;; ------------------------------------------------------
        ;; Calcula dirección input
        ;;
        ;; Cada pixel ocupa 4 bytes
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
        ;; Calcula la dirección de output
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
        ;; Read RGBA
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
        ;; Find nearest Game Boy color
        ;; ------------------------------------------------------

        (local.set $index

          (call $nearest

            (local.get $r)
            (local.get $g)
            (local.get $b)

          )
        )


        ;; Get actual RGB value.
        (local.set $color

          (call $palette
            (local.get $index)
          )
        )


        ;; ------------------------------------------------------
        ;; Write red
        ;; ------------------------------------------------------

        (i32.store8

          (local.get $output)

          (i32.shr_u
            (local.get $color)
            (i32.const 16)
          )
        )


        ;; ------------------------------------------------------
        ;; Write green
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
        ;; Write blue
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
        ;; Preserve alpha
        ;; ------------------------------------------------------

        (i32.store8

          (i32.add
            (local.get $output)
            (i32.const 3)
          )

          (local.get $a)
        )


        ;; ------------------------------------------------------
        ;; Next pixel
        ;; ------------------------------------------------------

        (local.set $i

          (i32.add
            (local.get $i)
            (i32.const 1)
          )
        )


        ;; Have we processed every pixel?
        (br_if $done

          (i32.ge_u
            (local.get $i)
            (local.get $count)
          )
        )


        ;; Process next pixel.
        (br $pixels)

      )
    )
  )


  ;; ------------------------------------------------------------
  ;; Procesar imagen en modo LCD (paleta + matriz de píxeles)
  ;; ------------------------------------------------------------

  ;; A diferencia de "process", esta función no escribe un píxel de
  ;; salida por cada píxel de entrada. Agrupa cada píxel en una celda
  ;; de `scale` x `scale` y dibuja la separación entre celdas, que es
  ;; justo la matriz de píxeles visible en la pantalla original.
  ;;
  ;; Es decir, el resultado se parece a la foto que le harías a una
  ;; Game Boy real en vez de a un simple filtro de 4 colores.
  ;;
  ;; src    = dirección de los píxeles RGBA del input (baja resolución)
  ;; dst    = dirección de los píxeles RGBA del output (alta resolución)
  ;; width  = ancho en píxeles lógicos de la imagen de entrada
  ;; height = alto en píxeles lógicos de la imagen de entrada
  ;; scale  = lado de la celda de cada píxel, en píxeles de salida
  ;; grid   = grosor de la separación, en píxeles de salida
  ;;
  ;; La salida mide (width * scale) x (height * scale).
  ;; El alfa (A) se preserva, también en la separación.
  ;;
  ;; Requisito: scale >= 1 y grid < scale (lo garantiza el calling JS,
  ;; si no la separación taparía la celda entera).

  (func (export "process_lcd")
    (param $src i32)
    (param $dst i32)
    (param $width i32)
    (param $height i32)
    (param $scale i32)
    (param $grid i32)

    ;; Dimensiones de la salida.
    (local $outWidth i32)
    (local $outHeight i32)

    ;; A partir de esta posición dentro de la celda empieza
    ;; la separación.
    (local $cellLimit i32)

    ;; Píxel de salida.
    (local $ox i32)
    (local $oy i32)
    (local $output i32)

    ;; Píxel de entrada al que pertenece esa celda.
    (local $sx i32)
    (local $sy i32)
    (local $input i32)

    ;; Posición del píxel de salida dentro de su celda.
    (local $fx i32)
    (local $fy i32)

    ;; Color final y alfa.
    (local $color i32)
    (local $a i32)


    ;; outWidth = width * scale
    (local.set $outWidth
      (i32.mul
        (local.get $width)
        (local.get $scale)
      )
    )

    ;; outHeight = height * scale
    (local.set $outHeight
      (i32.mul
        (local.get $height)
        (local.get $scale)
      )
    )

    ;; La separación se pega al final de la celda, así que empieza
    ;; en (scale - grid).
    (local.set $cellLimit
      (i32.sub
        (local.get $scale)
        (local.get $grid)
      )
    )


    ;; Empieza por la primera fila de píxeles de salida.
    (local.set $oy
      (i32.const 0)
    )

    (block $rowsDone

      (loop $rows

        ;; ------------------------------------------------------
        ;; ¿En qué píxel de la imagen de entrada cae esta fila?
        ;; ------------------------------------------------------
        ;;
        ;; sy = oy / scale
        ;;

        (local.set $sy
          (i32.div_u
            (local.get $oy)
            (local.get $scale)
          )
        )


        ;; ------------------------------------------------------
        ;; Posición vertical dentro de la celda
        ;; ------------------------------------------------------
        ;;
        ;; fy = oy % scale
        ;;

        (local.set $fy
          (i32.rem_u
            (local.get $oy)
            (local.get $scale)
          )
        )


        (local.set $ox
          (i32.const 0)
        )

        (block $colsDone

          (loop $cols

            ;; sx = ox / scale
            (local.set $sx
              (i32.div_u
                (local.get $ox)
                (local.get $scale)
              )
            )

            ;; fx = ox % scale
            (local.set $fx
              (i32.rem_u
                (local.get $ox)
                (local.get $scale)
              )
            )


            ;; ------------------------------------------------------
            ;; Dirección del píxel de entrada de esta celda
            ;; ------------------------------------------------------
            ;;
            ;; input = src + ((sy * width) + sx) * 4
            ;;

            (local.set $input

              (i32.add

                (i32.add
                  (local.get $src)

                  (i32.mul
                    (i32.mul
                      (local.get $sy)
                      (local.get $width)
                    )
                    (i32.const 4)
                  )
                )

                (i32.shl
                  (local.get $sx)
                  (i32.const 2)
                )
              )
            )


            ;; ------------------------------------------------------
            ;; Dirección del píxel de salida
            ;; ------------------------------------------------------
            ;;
            ;; output = dst + ((oy * outWidth) + ox) * 4
            ;;

            (local.set $output

              (i32.add

                (local.get $dst)

                (i32.mul

                  (i32.add

                    (i32.mul
                      (local.get $oy)
                      (local.get $outWidth)
                    )

                    (local.get $ox)
                  )

                  (i32.const 4)
                )
              )
            )


            ;; El canal alfa siempre viene del píxel original,
            ;; también para las separaciones, así las zonas
            ;; transparentes de la imagen siguen siéndolo.
            (local.set $a
              (i32.load8_u
                (i32.add
                  (local.get $input)
                  (i32.const 3)
                )
              )
            )


            ;; ------------------------------------------------------
            ;; Elige el color
            ;; ------------------------------------------------------
            ;;
            ;; Si el píxel cae en la separación horizontal o en la
            ;; vertical se pinta con el color del LCD, y si no se
            ;; cuantiza a la paleta de Game Boy.
            ;;

            (if

              (i32.or
                (i32.ge_u
                  (local.get $fx)
                  (local.get $cellLimit)
                )

                (i32.ge_u
                  (local.get $fy)
                  (local.get $cellLimit)
                )
              )

              (then
                ;; Separación entre píxeles.
                (local.set $color
                  (global.get $gridColor)
                )
              )

              (else

                ;; Píxel normal de la paleta.
                (local.set $color

                  (call $palette

                    (call $nearest

                      (i32.load8_u
                        (local.get $input)
                      )

                      (i32.load8_u
                        (i32.add
                          (local.get $input)
                          (i32.const 1)
                        )
                      )

                      (i32.load8_u
                        (i32.add
                          (local.get $input)
                          (i32.const 2)
                        )
                      )

                    )
                  )
                )
              )
            )


            ;; ------------------------------------------------------
            ;; Escribe R G B
            ;; ------------------------------------------------------

            (i32.store8

              (local.get $output)

              (i32.shr_u
                (local.get $color)
                (i32.const 16)
              )
            )

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
            ;; Escribe A
            ;; ------------------------------------------------------

            (i32.store8

              (i32.add
                (local.get $output)
                (i32.const 3)
              )

              (local.get $a)
            )


            ;; ------------------------------------------------------
            ;; Next pixel
            ;; ------------------------------------------------------

            (local.set $ox

              (i32.add
                (local.get $ox)
                (i32.const 1)
              )
            )


            ;; ¿Terminamos la fila?
            (br_if $colsDone
              (i32.ge_u
                (local.get $ox)
                (local.get $outWidth)
              )
            )


            ;; Siguiente píxel de la fila.
            (br $cols)

          )
        )


        ;; ¿Terminamos la imagen?
        (local.set $oy

          (i32.add
            (local.get $oy)
            (i32.const 1)
          )
        )

        (br_if $rowsDone
          (i32.ge_u
            (local.get $oy)
            (local.get $outHeight)
          )
        )


        ;; Siguiente fila.
        (br $rows)

      )
    )
  )
)
