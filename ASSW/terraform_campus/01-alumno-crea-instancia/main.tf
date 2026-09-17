terraform {
  required_providers {
    openstack = {
      source  = "terraform-provider-openstack/openstack"
      version = ">= 3.2.0"
    }
  }
}

provider "openstack" {
  auth_url  = "http://156.35.95.8:5000/v3"
  user_name = "Quiroga" # TU USUARIO DE OPENSTACK
  password  = "1234"
  #application_credential_id     = ""    # TODO: Ajustar parámetro
  #application_credential_secret = ""    # TODO: Ajustar parámetro
  domain_name = "Default"
  tenant_name = "Quiroga_project"
  region      = "RegionOne"
}

data "openstack_images_image_v2" "ubuntu" {
  name        = "Ubuntu-26.04"
}

data "openstack_compute_flavor_v2" "small" {
  name = "ephym_small_2"
}
resource "openstack_compute_instance_v2" "quiroga_vm" {
  name            = "Nombre" # TODO: Ajustar parámetro
  image_id        = data.openstack_images_image_v2.ubuntu.id
  flavor_id       = data.openstack_compute_flavor_v2.small.id
  security_groups = ["default"]

  network {
    name = "Quiroga_network"
  }
  user_data = <<-EOF
    #cloud-config
    users:
      - name: user
        plain_text_passwd: '1234'
        lock_passwd: false
        sudo: ALL=(ALL) NOPASSWD:ALL
        shell: /bin/bash
    ssh_pwauth: True # En el futuro será 'False'
    package_update: true
    package_upgrade: true
    locale: es_ES.UTF-8
    timezone: Europe/Madrid
    packages:
        - qemu-guest-agent
    runcmd:
        - touch hola.txt
  EOF
}
