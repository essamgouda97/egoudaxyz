terraform {
  required_version = ">= 1.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# SSH Key
resource "digitalocean_ssh_key" "deploy" {
  name       = "${var.project_name}-deploy-key"
  public_key = var.ssh_public_key
}

# Single droplet for everything
resource "digitalocean_droplet" "app" {
  name       = var.project_name
  size       = var.droplet_size
  image      = "docker-20-04"
  region     = var.region
  ssh_keys   = [digitalocean_ssh_key.deploy.fingerprint]
  monitoring = true

  tags = [var.project_name]

  user_data = <<-EOF
    #!/bin/bash
    # Minimal setup - rest done in deploy script
    mkdir -p /opt/app

    # Install DigitalOcean metrics agent
    curl -sSL https://repos.insights.digitalocean.com/install.sh | bash
  EOF
}

# Project to organize resources (optional - comment out if project already exists)
# resource "digitalocean_project" "main" {
#   name        = var.project_name
#   description = "Personal website"
#   purpose     = "Web Application"
#   environment = "Production"
#
#   resources = [
#     digitalocean_droplet.app.urn,
#   ]
# }
