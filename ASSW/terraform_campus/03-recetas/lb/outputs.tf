output "lb_instance_id" {
  description = "ID de la instancia del balanceador"
  value       = openstack_compute_instance_v2.load_balancer.id
}

output "lb_instance_name" {
  description = "Nombre de la instancia del balanceador"
  value       = openstack_compute_instance_v2.load_balancer.name
}

output "lb_private_ip" {
  description = "Dirección IP privada de la instancia del balanceador"
  value       = openstack_compute_instance_v2.load_balancer.access_ip_v4
}

output "lb_public_ip" {
  description = "Dirección IP pública flotante del balanceador"
  value       = var.lb_floating_ip
}
