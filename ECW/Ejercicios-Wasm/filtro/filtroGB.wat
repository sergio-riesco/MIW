(module

  ;; 48 páginas de 64 KiB = 3 MiB. La imagen más grande de la demo
  ;; (640x576) ocupa 1,4 MiB de entrada y otro tanto de salida, así que
  ;; sobra. Si hace falta más, JS la amplía con memory.grow().
  (memory (export "memory") 48)


  ;; Paleta de la Game Boy, de más oscura a más clara.
  ;; Devuelve el color como 0xRRGGBB.
  (func $palette (param $index i32) (result i32)
    (if (result i32) (i32.eq (local.get $index) (i32.const 0))
      (then (i32.const 0x0F380F))
      (else
        (if (result i32) (i32.eq (local.get $index) (i32.const 1))
          (then (i32.const 0x306230))
          (else
            (if (result i32) (i32.eq (local.get $index) (i32.const 2))
              (then (i32.const 0x8BAC0F))
              (else (i32.const 0x9BBC0F))))))))


  ;; Índice del color de la paleta más parecido a (r, g, b).
  ;; Uso la distancia al cuadrado: para comparar no hace falta la raíz.
  (func $nearest (param $r i32) (param $g i32) (param $b i32) (result i32)
    (local $i i32)
    (local $color i32)
    (local $pr i32) (local $pg i32) (local $pb i32)
    (local $dr i32) (local $dg i32) (local $db i32)
    (local $distance i32)
    (local $best_distance i32)
    (local $best i32)

    (local.set $best_distance (i32.const 0x7FFFFFFF))
    (local.set $best (i32.const 0))
    (local.set $i (i32.const 0))

    (block $done
      (loop $colors
        (local.set $color (call $palette (local.get $i)))

        ;; 0xRRGGBB -> r, g, b
        (local.set $pr (i32.shr_u (local.get $color) (i32.const 16)))
        (local.set $pg (i32.and (i32.shr_u (local.get $color) (i32.const 8)) (i32.const 255)))
        (local.set $pb (i32.and (local.get $color) (i32.const 255)))

        (local.set $dr (i32.sub (local.get $r) (local.get $pr)))
        (local.set $dg (i32.sub (local.get $g) (local.get $pg)))
        (local.set $db (i32.sub (local.get $b) (local.get $pb)))

        ;; dr² + dg² + db²
        (local.set $distance
          (i32.add
            (i32.add
              (i32.mul (local.get $dr) (local.get $dr))
              (i32.mul (local.get $dg) (local.get $dg)))
            (i32.mul (local.get $db) (local.get $db))))

        (if (i32.lt_u (local.get $distance) (local.get $best_distance))
          (then
            (local.set $best_distance (local.get $distance))
            (local.set $best (local.get $i))))

        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br_if $done (i32.ge_u (local.get $i) (i32.const 4)))
        (br $colors)))

    (local.get $best))


  ;; Filtro: recorre count píxeles RGBA desde src y escribe en dst el
  ;; color de la paleta más cercano. El alfa se copia tal cual.
  ;; src y dst son direcciones de la memoria lineal.
  (func (export "process") (param $src i32) (param $dst i32) (param $count i32)
    (local $i i32)
    (local $input i32)
    (local $output i32)
    (local $r i32) (local $g i32) (local $b i32) (local $a i32)
    (local $index i32)
    (local $color i32)

    (local.set $i (i32.const 0))

    (block $done
      ;; El loop comprueba la condición al final; sin esto, con count = 0
      ;; se procesaría un píxel igualmente.
      (br_if $done (i32.eqz (local.get $count)))

      (loop $pixels
        ;; 4 bytes por píxel: i << 2
        (local.set $input (i32.add (local.get $src) (i32.shl (local.get $i) (i32.const 2))))
        (local.set $output (i32.add (local.get $dst) (i32.shl (local.get $i) (i32.const 2))))

        (local.set $r (i32.load8_u (local.get $input)))
        (local.set $g (i32.load8_u (i32.add (local.get $input) (i32.const 1))))
        (local.set $b (i32.load8_u (i32.add (local.get $input) (i32.const 2))))
        (local.set $a (i32.load8_u (i32.add (local.get $input) (i32.const 3))))

        (local.set $index (call $nearest (local.get $r) (local.get $g) (local.get $b)))
        (local.set $color (call $palette (local.get $index)))

        (i32.store8 (local.get $output)
          (i32.shr_u (local.get $color) (i32.const 16)))
        (i32.store8 (i32.add (local.get $output) (i32.const 1))
          (i32.and (i32.shr_u (local.get $color) (i32.const 8)) (i32.const 255)))
        (i32.store8 (i32.add (local.get $output) (i32.const 2))
          (i32.and (local.get $color) (i32.const 255)))
        (i32.store8 (i32.add (local.get $output) (i32.const 3))
          (local.get $a))

        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br_if $done (i32.ge_u (local.get $i) (local.get $count)))
        (br $pixels))))
)
