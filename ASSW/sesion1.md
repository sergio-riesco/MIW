
# Sesión 1 - Introducción


## Actividad 1 - Conocer los recursos disponibles

* Revisar todos los recursos de infraestructura disponibles:
    * Máquina Física Windows
        * Conectarse por RDP
        * Cambiar la contraseña
    * Abrir la interfaz de Wake On Lan
        * Abrir y hacer login en [http://156.35.98.1:8090/]()
        * Proyecto de Github: [https://github.com/seriousm4x/upsnap]()
        * Cambiar contraseña del usuario
    * Plataforma Openstack
        * Abrir y hacer login en [http://156.35.95.9]()
        * Cambiar la contraseña
        * Analizar y explicar las principales secciones
            * Computacion
            * Volumenes
            * Credenciales
            * Otros
        * Buscar la dirección IP de la instancia
            * Conectarse por ```ssh```
            * ***Opcional*** Conectarse por ```sftp``` y subir/bajar ficheros
            * Abrir la página web [http://156.35.98.175]()
            * Buscar el código asociado a esa página web
    * Grafana
        * Hacer login en [http://156.35.95.8:3000/]()
        * Cambiar la contraseña
        * Buscar el panel de ejemplo
        * ***Opcional*** Crear nuestros propios paneles

## Actividad 2 - Configurar la máquina Linux para no permitir login ```ssh``` con contraseña
* Conectarse por ```ssh``` a la máqiuna en cuestión (paso ya realicado en la actividad 1)
* Generar un certificado con comandos ```ssh``` o Puttygen
* Asociar la clave pública del certificado al usuario
* Conectarse con la máquina sin usar contraseña (parámetro -i)
* Deshabilitar login con contraseña

### Avanzado
* Arrancar *daemon* de ```ssh```
* Añadir la identidad (clave privada) al servicio de ssh

## Actividad 3 - Comandos avanzados ```ssh```
* Conexión con usuario y clave
```bash
ssh SERVIDOR_SSH -l usuario -i fichero_clave_privada
```

* Redirigir puertos

```bash
ssh -L PUERTO_LOCAL:HOST_DESTINO:PUERTO_DESTINO usuario@SERVIDOR_SSH
```

```bash
ssh -L 8080:servidor-web:80 -L 5432:servidor-db:5432 \
  -L 8443:servidor-admin:443 usuario@bastion
```

* Ejecución de comandos remotos

```bash
ssh usuario@SERVIDOR_SSH "docker container ls"
```

```bash
for h in controller01 controller02 controller03; do 
   echo "===== $h =====";
   ssh "$h" "python3 --version; ls -l /usr/bin/python3*";
done
```

## Actividad 4 - Conexión remota con Visual Studio Code
* Configurar host remoto
    * Fichero ```.ssh\config```
* Conectarse y abrir una carpeta
* Fichero de hosts: ```C:\Windows\System32\drivers\etc``` (WIN) y ```/etc/hosts``` (Linux)


## Trabajo futuro

En el futuro en la asignatura, realizaremos estos pasos con un fichero de configuración ```cloud-init```

``` yaml
#cloud-config
users:
  - name: user
    plain_text_passwd: '1234'
    lock_passwd: false
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    ssh_authorized_keys:
    - ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCtB065O4/x6/5+gN9IHQ8lSyOiVe7OtUShycKFMKMfCcVfQbbjNXFC+9TDXMnDqsPq8dh5r8mVdhazqMWsjqvFt4b3qMCAW03fZfYqMSpkuYd10GIbteML0P4z6H7GSBeZiYF3Q4Z9OrQcTNbxWy7fqvaXn0J93EdxogS2uSXigUA03j+KJ2FlijAPqctFKxwiAUq2r+pAYmCLrihQaflkp8oeIXTMJCqy+UP6lHOdJIF7ld5FOQ5DlW1B0vwpWMRreWKhVcxO15VeNn47w0KJLzqWjG1y72jEB1kWc+n+RGUsuGaPXjJYOHwmiG0/B06vczFLhikT4zyAG1INuAAYD8aYejN6fp2+RA95wGZZBHRE0+L+1N/XbPTOHsshnUWhMt5bGrBmluH8HN5pdbJdF4px/jtz65wb4xbwe+DqOWH4eNnH13Q9DAJaHFvt8KnlfsBs0xzT16yamiyEjWVg4HfenErQpPhlIEeZT3rL7otc+xxg6QPkA+y3t03f6e2YlQeY7yVOpQMRxnBCamw8bvyA++108zZ542NCpvOjIscOV36ZTpSaxMK5pwdBMJmU6jp2N8VShYaIHovZp7SBN8SNTrx3XmK4lfFCyS0P0AaN+YdaX+cWHpdmLPfiuFmraaqXywslOPhNf4RciUcrbkvdsPblxoND4z9WRTm2YQ== imported-openssh-key
ssh_pwauth: False
package_update: true
package_upgrade: true
locale: es_ES.UTF-8
timezone: Europe/Madrid
```