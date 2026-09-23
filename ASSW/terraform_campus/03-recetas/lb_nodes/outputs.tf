output "node_ips" {
  description = "Direcciones IP de los 3 nodos web creados"
  value       = {
    for instance in openstack_compute_instance_v2.web_nodes :
    instance.name => instance.access_ip_v4
  }
}

output "node_details" {
  description = "Detalles de los nodos"
  value = [
    for instance in openstack_compute_instance_v2.web_nodes : {
      name = instance.name
      ip   = instance.access_ip_v4
      id   = instance.id
    }
  ]
}
