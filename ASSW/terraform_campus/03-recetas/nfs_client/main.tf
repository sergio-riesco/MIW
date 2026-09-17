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

# 1. Instancia Compute de OpenStack que actuará como Cliente NFS
resource "openstack_compute_instance_v2" "nfs_client" {
  name            = "nfs-client"
  image_id        = data.openstack_images_image_v2.vm_image.id
  flavor_id       = data.openstack_compute_flavor_v2.vm_flavor.id
  key_pair        = "prueba"
  security_groups = [data.openstack_networking_secgroup_v2.vm_secgroup.name]

  network {
    uuid = data.openstack_networking_network_v2.vm_network.id
  }

  user_data = templatefile("${path.module}/client-cloud-init.yaml", {
    vm_username   = var.username
    vm_password   = var.password
    nfs_server_ip = var.nfs_server_ip
    export_path   = var.nfs_export_path
    mount_point   = var.nfs_mount_point
  })
}
