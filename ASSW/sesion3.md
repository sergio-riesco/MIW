# Sesión 2 - Terraform

## Instalar Terraform

Buscar los pasos en la web oficial [https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli]().
Descargar el ejecutable para Windows en [https://developer.hashicorp.com/terraform/install]() y colocarlo en el PATH.


```bash
sudo apt-get update && sudo apt-get install -y gnupg software-properties-common
wget -O- https://apt.releases.hashicorp.com/gpg | \
gpg --dearmor | \
sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(grep -oP '(?<=UBUNTU_CODENAME=).*' /etc/os-release || lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update
sudo apt-get install terraform
```

## Actividad 1 - Entender el primer ejemplo

* Revisa el contenido de la carpeta 01-alumno-crea-instancia.
* Revisa la documentación del provider de Openstack: [https://registry.terraform.io/providers/terraform-provider-openstack/openstack/latest/docs]()
* Consulta una cheatsheet con los comandos típicos: [https://www.pluralsight.com/resources/blog/cloud/the-ultimate-terraform-cheatsheet]() o [https://github.com/devops-cheat-sheets/terraform-cheat-sheet]()

