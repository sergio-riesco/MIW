terraform {
  required_providers {
    openstack = {
      source  = "terraform-provider-openstack/openstack"
      version = ">= 3.2.0"
    }
  }
}

provider "openstack" {
  auth_url                      = "http://156.35.95.8:5000/v3"
  application_credential_id     = ""    # TODO: Ajustar parámetro
  application_credential_secret = ""    # TODO: Ajustar parámetro
  domain_name                   = "Default"
  tenant_name                   = "admin"
  region                        = "RegionOne"
}

# TODO: Ajustar parámetro
data "openstack_images_image_v2" "ubuntu_24_04" {
  name = "Ubuntu-26.04"
}

# TODO: Ajustar parámetro
data "openstack_compute_flavor_v2" "small_flavor" {
  name = "ephym_small_1"
}

# TODO: Ajustar parámetro
data "openstack_networking_network_v2" "quiroga_network" {
  name = "quiroga_network"
}


resource "openstack_compute_instance_v2" "quiroga_vm" {
  name      = "QuirogaTest"   # TODO: Ajustar parámetro
  image_id  = data.openstack_images_image_v2.ubuntu_24_04.id
  flavor_id = data.openstack_compute_flavor_v2.small_flavor.flavor_id
  #key_pair        = "my_key_pair_name"
  #security_groups = ["default"]

  security_groups = [openstack_networking_secgroup_v2.ssh_secgroup.name, "default"] # TODO: Ajustar parámetro

  network {
    name = data.openstack_networking_network_v2.quiroga_network.name
  }
  user_data = <<-EOF
    #cloud-config
    users:
      - name: user                 # TODO: Ajustar parámetro
        plain_text_passwd: '1234'   # TODO: Ajustar parámetro
        lock_passwd: false
        sudo: ALL=(ALL) NOPASSWD:ALL
        shell: /bin/bash
        ssh-authorized-keys:
          - ${openstack_compute_keypair_v2.quiroga_keypair.public_key} # TODO: Ajustar parámetro
    ssh:
      install-server: true
      allow-pw: false
    locale: es_ES.UTF-8
    timezone: Europe/Madrid

    runcmd:             # TODO: Ajustar parámetro
      - apt -y install qemu-guest-agent



  EOF
}


data "openstack_networking_network_v2" "ext_network" {
  name = "public"
}

data "openstack_networking_subnet_ids_v2" "ext_subnets" {
  network_id = data.openstack_networking_network_v2.ext_network.id
}

#resource "openstack_networking_floatingip_v2" "floatip_1" {
#  pool       = data.openstack_networking_network_v2.ext_network.name
#  subnet_ids = data.openstack_networking_subnet_ids_v2.ext_subnets.ids
#}

data "openstack_networking_port_v2" "quiroga_vm_port" {
  device_id  = openstack_compute_instance_v2.quiroga_vm.id
  network_id = openstack_compute_instance_v2.quiroga_vm.network[0].uuid
}

resource "openstack_networking_floatingip_associate_v2" "student_fip_assoc" {
  port_id = data.openstack_networking_port_v2.quiroga_vm_port.id
  floating_ip = "156.35.98.175"         # TODO: Ajustar parámetro
}

resource "openstack_networking_secgroup_v2" "ssh_secgroup" {
  name        = "ssh-ingress-quiroga"
  description = "Permitir acceso SSH"
}

# Regla de entrada para puerto 22 TCP desde cualquier IP
resource "openstack_networking_secgroup_rule_v2" "student_ssh_ingress_rule" {
  direction         = "ingress"
  ethertype         = "IPv4"
  protocol          = "tcp"
  port_range_min    = 22
  port_range_max    = 22
  remote_ip_prefix  = "0.0.0.0/0"
  security_group_id = openstack_networking_secgroup_v2.ssh_secgroup.id
}

resource "openstack_compute_keypair_v2" "quiroga_keypair" {
  name = "quiroga_keypair"
}


resource "local_file" "private_key" {
  content  = openstack_compute_keypair_v2.quiroga_keypair.private_key
  filename = "my_private"   # TODO: Ajustar parámetro
}

resource "local_file" "public_key" {
  content  = openstack_compute_keypair_v2.quiroga_keypair.public_key
  filename = "my_private.pub"     # TODO: Ajustar parámetro
}

resource "time_sleep" "wait_30_seconds" {
  depends_on = [openstack_compute_instance_v2.quiroga_vm]

  create_duration = "30s"       # TODO: Ajustar o borrar este elemento
}


# Copiar carpeta local ./datos/ al volumen montado en la VM
resource "null_resource" "copy_datos" {
  depends_on = [
    #openstack_compute_instance_v2.quiroga_vm,
    #openstack_compute_volume_attach_v2.attach
    time_sleep.wait_30_seconds
  ]

  provisioner "file" {
    source      = "provision/"            # carpeta local
    destination = "/home/user"        # carpeta remota (ya montada)

    connection {
      type        = "ssh"
      user        = "user"
      #private_key = file("~/.ssh/id_rsa") # tu clave privada local
      private_key = openstack_compute_keypair_v2.quiroga_keypair.private_key
      host        = openstack_networking_floatingip_associate_v2.student_fip_assoc.floating_ip
    }
  }
}