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

# 1. Grupo de seguridad específico para el servicio NFS
resource "openstack_networking_secgroup_v2" "nfs_secgroup" {
  name        = "nfs-secgroup"
  description = "Grupo de seguridad para permitir tráfico NFS y RPC"
}

resource "openstack_networking_secgroup_rule_v2" "nfs_tcp_2049" {
  direction         = "ingress"
  ethertype         = "IPv4"
  protocol          = "tcp"
  port_range_min    = 2049
  port_range_max    = 2049
  remote_ip_prefix  = "0.0.0.0/0"
  security_group_id = openstack_networking_secgroup_v2.nfs_secgroup.id
}

resource "openstack_networking_secgroup_rule_v2" "rpc_tcp_111" {
  direction         = "ingress"
  ethertype         = "IPv4"
  protocol          = "tcp"
  port_range_min    = 111
  port_range_max    = 111
  remote_ip_prefix  = "0.0.0.0/0"
  security_group_id = openstack_networking_secgroup_v2.nfs_secgroup.id
}

# 2. Instancia Compute de OpenStack con Servidor NFS
resource "openstack_compute_instance_v2" "nfs_server" {
  name            = "nfs-server"
  image_id        = data.openstack_images_image_v2.vm_image.id
  flavor_id       = data.openstack_compute_flavor_v2.vm_flavor.id
  key_pair        = "prueba"
  security_groups = [
    data.openstack_networking_secgroup_v2.vm_secgroup.name,
    openstack_networking_secgroup_v2.nfs_secgroup.name
  ]

  network {
    uuid = data.openstack_networking_network_v2.vm_network.id
  }

  user_data = templatefile("${path.module}/nfs-cloud-init.yaml", {
    vm_username         = var.username
    vm_password         = var.password
    nfs_allowed_network = var.nfs_allowed_network
    export_path         = var.export_path
  })
}
