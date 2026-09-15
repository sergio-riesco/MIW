# Sesión 2 - Docker

## Instalar Docker

Se puede instalar de los repositorios oficiales, pero normalmente las actualizaciones tardan mucho en llegar. Buscar tutoriales o ir a la página oficial [https://docs.docker.com/engine/install/ubuntu/]().


```bash
sudo apt remove $(dpkg --get-selections docker.io docker-compose docker-compose-v2 docker-doc docker-buildx podman-docker containerd runc | cut -f1)
sh -c "curl -fsSL https://get.docker.com | bash"
sudo usermod -aG docker $USER
```

## Actividad 1 - Crear una imagen

Ejercicio muy sencillo. Crear una imagen personalizada a partir de un fichero ```Dockerfile```. Debatiremos varios detalles sobre el proceso de creación de imágenes (Fichero ```Dockerfile``` = Imperativo, interactividad en los comandos, qué pasa si un paso intermedio falla, seguridad en las imágenes base, nombrado de las imágenes) 

* Crear un fichero ```hola.py``` con el siguiente contenido
```bash
print('hola')
```

* Crear un fichero ```Dockerfile``` con el siguiente contenido

```bash
FROM ubuntu
RUN apt update
RUN apt install -y python3
COPY hola.py .
CMD ["python3", "hola.py"]
```

* Generar la imagen con el comando ```docker build . -t mi_primera_imagen```
* Ejecutar la imagen con ```docker run mi_primera_imagen```
* Otros comandos interesantes son:
    * ```docker image ls```
    * ```docker contanier ls --all```
    * ```docker volume ls```
    * ```docker system prune --all```
    * ```docker run -it --name contenedor_debug --rm ubuntu:24.04 bash```
        * ```Ctrl-P``` + ```Ctrl-Q```
        * ```docker attach contenedor_debug```
        * ```docker exec contenedor_debug ls /etc```

## Actividad 2 - Subir la imagen a un repositorio de imágenes

### Alternativa 1 - Repositorio de imágenes local/privado/corporativo

* Crear un contenedor que es un repositorio de imagenes con el siguiente comando:

```bash
docker run -d -p 5000:5000 --name registry registry:2.7
```

* Habilitar registro de imagenes inseguro (solución rápida) o instalar certificados etc. para que sea un [repositorio seguro](https://docs.docker.com/engine/security/certificates/) (no lo vamos a hacer).
    * Editar ```/etc/docker/daemon.json``` para añadir una línea similar. Puedes incluir tu registro de imágenes o el de un compañero de grupo.
```bash
{
    "insecure-registries" : [ "156.35.98.175:5000" ]
}
```
* Reiniciar el servicio
```bash
sudo systemctl restart docker
```
* Etiquetar la imagen para que podamos subirla al repositorio
```bash
docker tag mi_primera_imagen 156.35.98.175:5000/hola_mundo_python
```
* Subir (empujar) la imagen al repositorio

```bash
docker push 156.35.98.175:5000/hola_mundo_python
```

### Alternativa 2 - Repositorio públicos: GHCR

* Crear un token de aplicación en (GitHub Container Repository)[https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry]
    * Usuario / Settings / Developer settings / Personal access tokens / Tokens (classic) / Generate new token (classic).
    * Habilitar permisos ```write:packages```

* Crea o copia el fichero app.py
    * Nota imporantete: Para el login se puede utilizar EMAIL o nombre de usuario. Para hacer el ```tag``` y ```push```, NO se puede usar EMAIL. Da error de parseo del comando (carácter ```@```).
```bash
echo MI_TOKEN | docker login ghcr.io -u TU_USUARIO --password-stdin
```
Por ejemplo:
```bash
echo ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX | docker login ghcr.io -u uoxxxx@uniovi.es --password-stdin

WARNING! Your credentials are stored unencrypted in '/home/Quiroga/.docker/config.json'.
Configure a credential helper to remove this warning. See
https://docs.docker.com/go/credential-store/

Login Succeeded
Quiroga@miw:~$
```
*Subimos la imagen de manera similar a como haríamos en un registro local
* Etiquetar la imagen para que podamos subirla al repositorio
```bash
docker tag mi_primera_imagen ghcr.io/infraestructuraseii/ejemplo1:latest
docker push ghcr.io/infraestructuraseii/ejemplo1:latest
```
Por ejemplo
```bash
Quiroga@miw:~$ docker tag mi_primera_imagen ghcr.io/infraestructuraseii/ejemplo1:latest
Quiroga@miw:~$ docker push ghcr.io/infraestructuraseii/ejemplo1:latest
The push refers to repository [ghcr.io/infraestructuraseii/ejemplo1]
963162be4c81: Pushed
6a7c4f6d8c38: Pushed
08f5f5b2a2b0: Pushed
4c1996258d43: Pushed
e1e3b6f10141: Pushed
latest: digest: sha256:38f39bb97d0141b97a70e8e8933caa489392c7acaa5056105abf30ddc4642f9f size: 1610
Quiroga@miw:~$
```

## Actividad Opcional - Utilizar una interfaz web

Desplegar y configurar (***Portainer***)[https://docs.portainer.io/start/install-ce/server/docker/linux]

```bash
docker run -d -p 8000:8000 -p 9443:9443 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:lts
```

* **NOTA**: El puerto ```9443``` no está abierto en la instancia Openstack. Valorar alternativas (cambiar el puerto, añadir regla del grupo de seguridad, hacer túnel ssh, ...).
* **NOTA2**: El protocolo es por tanto ```https```.
* **NOTA3**: Ejecuta ```docker logs portainer``` para encontrar el token (setup_token).


## Actividad Opcional - Volumenes

* Hacer varias pruebas con mapeos de volumenes:

```Dockerfile
FROM ubuntu:24.04

RUN mkdir -p /temp
RUN touch /temp/hola
RUN echo "Hola Mundo" > /temp/hola
```

```bash
docker build . -t container2
docker run -it --rm -p 5000:5000 container2
docker run -it --rm -p 5000:5000 -v my_local_dir:/temp container2
docker run -it --rm -p 5000:5000 -v ./my_local_dir/:/temp/ container2
docker volume inspect my_local_dir
sudo su
cd /var/lib/docker/volumes/my_local_dir/_data
ls
```

## Actividad 3 - Tomcat Sesion 

* Ejercicio obligatorio. Ver ```docker_tomcat.zip```
