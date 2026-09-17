variable "username" {
  type        = string
  description = "Nombre de usuario por defecto para la VM"
  default     = "user"
}

variable "password" {
  type        = string
  description = "Contraseña para el usuario"
  default     = "1234"
}

variable "nfs_allowed_network" {
  type        = string
  description = "Red o IP desde la que se permite conectar clientes NFS (por defecto red 192.168.1.0/24 o IP 192.168.1.1)"
  default     = "192.168.1.0/24"
}

variable "export_path" {
  type        = string
  description = "Ruta del directorio compartido NFS"
  default     = "/srv/nfs"
}
