# 0. Recursos Data para obtener información de OpenStack
data "openstack_images_image_v2" "vm_image" {
  name = "Ubuntu-26.04"
}

data "openstack_compute_flavor_v2" "vm_flavor" {
  name = "ephym_small_1"
}

data "openstack_networking_network_v2" "vm_network" {
  name = "Quiroga_network"
}

data "openstack_networking_secgroup_v2" "vm_secgroup" {
  name = "basicos-quiroga-2"
}

# 1. Grupo de seguridad para permitir tráfico HTTP en el puerto 80 del balanceador
resource "openstack_networking_secgroup_v2" "lb_secgroup" {
  name        = "lb-secgroup"
  description = "Grupo de seguridad para permitir trafico HTTP en balanceador"
}

resource "openstack_networking_secgroup_rule_v2" "http_80" {
  direction         = "ingress"
  ethertype         = "IPv4"
  protocol          = "tcp"
  port_range_min    = 80
  port_range_max    = 80
  remote_ip_prefix  = "0.0.0.0/0"
  security_group_id = openstack_networking_secgroup_v2.lb_secgroup.id
}

# 2. Instancia Compute del Balanceador de Carga (Nginx)
resource "openstack_compute_instance_v2" "load_balancer" {
  name            = "load-balancer"
  image_id        = data.openstack_images_image_v2.vm_image.id
  flavor_id       = data.openstack_compute_flavor_v2.vm_flavor.id
  key_pair        = "prueba"
  security_groups = [
    data.openstack_networking_secgroup_v2.vm_secgroup.name,
    openstack_networking_secgroup_v2.lb_secgroup.name
  ]

  network {
    uuid = data.openstack_networking_network_v2.vm_network.id
  }

  user_data = templatefile("${path.module}/lb-cloud-init.yaml", {
    vm_username = var.username
    vm_password = var.password
    backend_ips = var.backend_ips
  })
}

# 3. Asociación de la IP flotante pública proporcionada
data "openstack_networking_port_v2" "lb_port" {
  device_id  = openstack_compute_instance_v2.load_balancer.id
  network_id = data.openstack_networking_network_v2.vm_network.id
}

resource "openstack_networking_floatingip_associate_v2" "lb_fip_assoc" {
  port_id     = data.openstack_networking_port_v2.lb_port.id
  floating_ip = var.lb_floating_ip
}
