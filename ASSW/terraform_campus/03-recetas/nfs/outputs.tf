output "nfs_instance_id" {
  description = "ID de la instancia del servidor NFS"
  value       = openstack_compute_instance_v2.nfs_server.id
}

output "nfs_instance_name" {
  description = "Nombre de la instancia del servidor NFS"
  value       = openstack_compute_instance_v2.nfs_server.name
}

output "nfs_private_ip" {
  description = "Dirección IP privada de la instancia NFS"
  value       = openstack_compute_instance_v2.nfs_server.access_ip_v4
}

output "nfs_export_info" {
  description = "Información del recurso NFS compartido"
  value       = "${openstack_compute_instance_v2.nfs_server.access_ip_v4}:${var.export_path}"
}
