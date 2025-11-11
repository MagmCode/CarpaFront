Guía para generar certificados de desarrollo

Opciones recomendadas:

1) mkcert (recomendado, sencillo)
- Instala mkcert (https://github.com/FiloSottile/mkcert)
- mkcert crea certificados de confianza localmente.

Ejemplo (PowerShell):

# instalar mkcert (si no está)
# choco install mkcert -y    # usando chocolatey (opcional)

# crear CA local y certificados para localhost
mkcert -install
mkcert -key-file "ssl/server.key" -cert-file "ssl/server.crt" localhost 127.0.0.1 ::1

2) OpenSSL (si tienes openssl instalado)

# crear key y cert autofirmado (válido para desarrollo)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl/server.key -out ssl/server.crt -subj "/CN=localhost"

3) PowerShell / Windows (New-SelfSignedCertificate)

# crea un certificado en el almacén personal y exporta a PFX
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My"
$pwd = ConvertTo-SecureString -String "changeit" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "ssl\server.pfx" -Password $pwd

# Para extraer .crt y .key desde el PFX necesitarás openssl:
# openssl pkcs12 -in ssl/server.pfx -nocerts -nodes -out ssl/server.key
# openssl pkcs12 -in ssl/server.pfx -clcerts -nokeys -out ssl/server.crt

Uso con el proyecto
- Coloca `server.crt` y `server.key` en la carpeta `ssl/` del repo (ya ignoradas por git si lo prefieres).
- Ejecuta `npm run start-ssl` para levantar el servidor de desarrollo con HTTPS.

Navegador y certificados autofirmados
- Si usas mkcert, el navegador confiará en el certificado automáticamente.
- Si usas certificados autofirmados, el navegador mostrará advertencia; añade excepción o importa la CA generada en mkcert.

Notas
- No subas keys privadas a repositorios públicos. Añade `ssl/*` a `.gitignore` si procede.
- Para integración con Docker, monta la carpeta `ssl` en el contenedor y usa los mismos flags de ng serve o configura el servidor reverse-proxy con HTTPS.
