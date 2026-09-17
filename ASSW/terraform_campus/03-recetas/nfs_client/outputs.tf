output "client_instance_id" {
  description = "ID de la instancia del cliente NFS"
  value       = openstack_compute_instance_v2.nfs_client.id
}

output "client_instance_name" {
  description = "Nombre de la instancia del cliente NFS"
  value       = openstack_compute_instance_v2.nfs_client.name
}

output "client_private_ip" {
  description = "Dirección IP privada de la instancia cliente"
  value       = openstack_compute_instance_v2.nfs_client.access_ip_v4
}

output "client_mount_point" {
  description = "Punto de montaje configurado en el cliente"
  value       = var.nfs_mount_point
}
