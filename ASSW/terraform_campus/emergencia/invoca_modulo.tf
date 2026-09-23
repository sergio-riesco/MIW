

provider "openstack" {
  auth_url    = "http://156.35.95.8:5000/v3"
  user_name   = "UOXXXXX"  # TU USUARIO DE OPENSTACK
  application_credential_id     = ""  # Se puede utilizar en lugar de user/pass
  application_credential_secret = ""  # Se puede utilizar en lugar de user/pass
  domain_name = "Default"
  tenant_name = "UOXXXXX_project"
  region      = "RegionOne"
}

module "instancia_estudiante_00" {
  source     = "./instance"
  username   = "UOXXXXX" 
  password   = "1234" #contraseña para la MV
  vm_network = "UOXXXXX_network"
  vm_ip      = "156.35.98.XX" 

}
