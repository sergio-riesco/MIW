terraform {
  required_version = ">= 1.0.0"
  required_providers {
    openstack = {
      source  = "terraform-provider-openstack/openstack"
      version = "~> 3.3.0"
    }
  }
}

provider "openstack" {
  auth_url                      = "http://156.35.95.8:5000/v3"
  user_name                     = "Quiroga"
  application_credential_id     = "47728a347edb499b90669fa1bf5f0764"
  application_credential_secret = "kq-gKJYcrDIe0UyaXzof6xJSjoO6M7aADQcobE-x6pkKKJEIgW9HfmSayyFy-jnoVAWIUmsUBrrwbEF7Tdz5yQ"
  domain_name                   = "Default"
  tenant_name                   = "Quiroga"
  region                        = "RegionOne"
}
