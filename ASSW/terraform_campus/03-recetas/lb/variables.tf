variable "username" {
  type        = string
  description = "Nombre de usuario por defecto para la VM de balanceo"
  default     = "user"
}

variable "password" {
  type        = string
  description = "Contraseña para el usuario"
  default     = "1234"
}

variable "lb_floating_ip" {
  type        = string
  description = "IP pública flotante asociada al balanceador"
  default     = "156.35.98.175"
}

variable "backend_ips" {
  type        = list(string)
  description = "Lista de IPs privadas de los servidores backend para balancear"
  default     = ["192.168.1.208", "192.168.1.247", "192.168.1.52"]
}
