data "openstack_images_image_v2" "default_image" {
  name = "Ubuntu-26.04"
}
data "openstack_compute_flavor_v2" "default_flavor" {
  name = "small_2"
}
data "openstack_networking_network_v2" "default_network" {
  name = var.vm_network
}

resource "openstack_blockstorage_volume_v3" "filesystem" {
  name              = "${var.username}-vm1"
  size              = 10
  image_id          = data.openstack_images_image_v2.default_image.id
  volume_type       = "__DEFAULT__"
}

resource "openstack_compute_instance_v2" "vm01" {
  name      = "${var.username}-ubuntu-26.04-nueva"
  image_id  = data.openstack_images_image_v2.default_image.id
  flavor_id = data.openstack_compute_flavor_v2.default_flavor.id

  security_groups = [
    data.openstack_networking_secgroup_v2.ssh_ingress.name,
    data.openstack_networking_secgroup_v2.http_ingress.name
  ]


  user_data = templatefile("${path.module}/vm1-cloud-init.yaml", {
    vm_username = var.username,
    vm_password = var.password
  })

  network {
    uuid = data.openstack_networking_network_v2.default_network.id
  }

    block_device {
    uuid                  = openstack_blockstorage_volume_v3.filesystem.id
    source_type           = "volume"
    destination_type      = "volume"
    boot_index            = 0
    delete_on_termination = true
  }
}

data "openstack_networking_port_v2" "vm01_port" {
  device_id  = openstack_compute_instance_v2.vm01.id
  network_id = data.openstack_networking_network_v2.default_network.id
}

resource "openstack_networking_floatingip_associate_v2" "vm01_fip_assoc" {
  port_id     = data.openstack_networking_port_v2.vm01_port.id
  floating_ip = var.vm_ip
}