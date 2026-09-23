variable "username" {
  type        = string
  description = "Nombre de usuario por defecto para la VM cliente"
  default     = "user"
}

variable "password" {
  type        = string
  description = "Contraseña para el usuario"
  default     = "1234"
}

variable "nfs_server_ip" {
  type        = string
  description = "IP privada del servidor NFS"
  default     = "192.168.1.170" # Puedes cambiar esta IP por la IP real de tu servidor NFS
}

variable "nfs_export_path" {
  type        = string
  description = "Ruta compartida en el servidor NFS"
  default     = "/srv/nfs"
}

variable "nfs_mount_point" {
  type        = string
  description = "Punto de montaje local para el recurso NFS"
  default     = "/mnt/nfs"
}
