<#
PowerShell helper to generate self-signed cert and export key+cert files.
Requires OpenSSL in PATH for PFX extraction, or mkcert for simpler flow.
#>

param(
    [string]$Method = "mkcert"
)

if ($Method -eq "mkcert") {
    Write-Host "Using mkcert (recommended). Make sure mkcert is installed and in PATH."
    Write-Host "Running: mkcert -install"
    mkcert -install
    Write-Host "Generating cert for localhost and 127.0.0.1"
    mkcert -key-file "ssl/server.key" -cert-file "ssl/server.crt" localhost 127.0.0.1 ::1
    Write-Host "Created ssl/server.crt and ssl/server.key"
    exit
}

if ($Method -eq "openssl") {
    Write-Host "Using OpenSSL to create a self-signed cert (valid for 1 year)"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl/server.key -out ssl/server.crt -subj "/CN=localhost"
    Write-Host "Created ssl/server.crt and ssl/server.key"
    exit
}

if ($Method -eq "pfx") {
    Write-Host "Using PowerShell New-SelfSignedCertificate -> PFX -> extract with OpenSSL"
    $cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My"
    $pwd = ConvertTo-SecureString -String "changeit" -Force -AsPlainText
    $pfxPath = "ssl/server.pfx"
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pwd
    Write-Host "Exported to $pfxPath. Now extract key/crt using openssl (if available):"
    Write-Host "openssl pkcs12 -in ssl/server.pfx -nocerts -nodes -out ssl/server.key"
    Write-Host "openssl pkcs12 -in ssl/server.pfx -clcerts -nokeys -out ssl/server.crt"
    exit
}

Write-Host "Unknown method. Use -Method mkcert | openssl | pfx"
