data "openstack_networking_secgroup_v2" "ssh_ingress" {
  name        = "ssh-ingress"
}



data "openstack_networking_secgroup_v2" "http_ingress" {
  name        = "http-ingress"
}

