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

# 1. Grupo de seguridad para habilitar HTTP en el puerto 80 para los nodos
resource "openstack_networking_secgroup_v2" "node_http_secgroup" {
  name        = "node-http-secgroup"
  description = "Grupo de seguridad para permitir trafico HTTP en los nodos backend"
}

resource "openstack_networking_secgroup_rule_v2" "http_80" {
  direction         = "ingress"
  ethertype         = "IPv4"
  protocol          = "tcp"
  port_range_min    = 80
  port_range_max    = 80
  remote_ip_prefix  = "0.0.0.0/0"
  security_group_id = openstack_networking_secgroup_v2.node_http_secgroup.id
}

# 2. Array de 3 instancias Compute usando count
resource "openstack_compute_instance_v2" "web_nodes" {
  count           = 3
  name            = "lb-node-${count.index + 1}"
  image_id        = data.openstack_images_image_v2.vm_image.id
  flavor_id       = data.openstack_compute_flavor_v2.vm_flavor.id
  key_pair        = "prueba"
  security_groups = [
    data.openstack_networking_secgroup_v2.vm_secgroup.name,
    openstack_networking_secgroup_v2.node_http_secgroup.name
  ]

  network {
    uuid = data.openstack_networking_network_v2.vm_network.id
  }

  user_data = templatefile("${path.module}/node-cloud-init.yaml", {
    vm_username = var.username
    vm_password = var.password
    node_index  = count.index + 1
  })
}
