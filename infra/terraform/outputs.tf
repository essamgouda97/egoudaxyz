output "droplet_ip" {
  description = "Public IP address of the droplet"
  value       = digitalocean_droplet.app.ipv4_address
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh root@${digitalocean_droplet.app.ipv4_address}"
}

output "cloudflare_dns_record" {
  description = "Add this A record in Cloudflare DNS"
  value       = "Type: A, Name: @, Content: ${digitalocean_droplet.app.ipv4_address}, Proxy: ON"
}
