# ☁️ Guía Paso a Paso: Configurar Cloudflare en tu Tienda Oficial

Usar **Cloudflare (Plan Gratuito)** te ofrece:
1. **Velocidad Extrema (CDN Mundial)**: Carga las 5.088 fotos de camisetas al instante desde servidores cercanos a cada cliente.
2. **Protección Anti-DDoS y Firewall WAF**: Bloquea ataques de bots maliciosos.
3. **Certificado SSL Gratuito y Automático**: Candado verde HTTPS garantizado.
4. **Oculta la IP real de tu VPS**: Nadie sabrá en qué servidor está alojada la tienda.

---

## 📋 PASO 1: Crear cuenta en Cloudflare y Añadir Dominio

1. Entra en [dash.cloudflare.com](https://dash.cloudflare.com/) y crea una cuenta gratuita.
2. Haz clic en el botón azul **"Add a Site"** (Añadir un sitio).
3. Escribe tu dominio (ejemplo: `mitienda.com`) y selecciona el **Plan Free** (0 €/mes).
4. Cloudflare escaneará automáticamente tus registros DNS actuales.

---

## 📋 PASO 2: Configurar los Registros DNS en Cloudflare

En la pestaña **DNS** de Cloudflare, asegúrate de tener estos dos registros con la **Nube Naranja (Proxied / Con proxy)** activada:

| Tipo | Nombre | Contenido / Valor | Proxy status |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `IP_DE_TU_VPS` | 🟠 **Proxied** |
| **A** o **CNAME** | `www` | `IP_DE_TU_VPS` (o `@`) | 🟠 **Proxied** |

---

## 📋 PASO 3: Cambiar los Nameservers en tu Registrador de Dominio

Cloudflare te mostrará 2 servidores de nombres (Nameservers), por ejemplo:
- `ns1.cloudflare.com`
- `ns2.cloudflare.com`

1. Entra al panel donde compraste el dominio (Namecheap, GoDaddy, Hostinger, DonDominio, etc.).
2. Ve a la sección **Nameservers / Servidores DNS**.
3. Selecciona **"Custom DNS" (DNS personalizados)** y pega los 2 Nameservers de Cloudflare.
4. Guarda los cambios *(puede tardar entre 5 y 30 minutos en propagarse)*.

---

## 📋 PASO 4: Configurar SSL/TLS en Cloudflare

1. En el menú lateral de Cloudflare, ve a **SSL/TLS**.
2. En el modo de cifrado, selecciona **Full (Strict)** si ya generaste el certificado en tu VPS con Certbot, o **Full** si estás en proceso.
3. Ve a **SSL/TLS > Edge Certificates**:
   - Activa **"Always Use HTTPS"** (Siempre usar HTTPS).
   - Activa **"Automatic HTTPS Rewrites"**.
   - Activa **"TLS 1.3"**.

---

## 📋 PASO 5: Optimización de Velocidad en Cloudflare

En el menú lateral de Cloudflare:
1. Ve a **Speed > Optimization**:
   - Activa **Brotli** (compresión ultra eficiente).
   - Activa **Early Hints**.
2. Ve a **Caching > Configuration**:
   - Browser Cache TTL: **4 hours** o **Respect Existing Headers**.

---

## 📋 PASO 6: Aplicar la Configuración Nginx en tu VPS

Para que tu servidor VPS reconozca la IP real de los clientes (y no la de Cloudflare), hemos creado el archivo `nginx-cloudflare.conf`.

En tu VPS, ejecuta:
```bash
# Copiar la plantilla optimizada de Cloudflare
sudo cp /var/www/kitshub/nginx-cloudflare.conf /etc/nginx/sites-available/kitshub

# Editar para poner tu dominio real
sudo nano /etc/nginx/sites-available/kitshub
```
*(Reemplaza `tudominio.com` por tu dominio real, guarda con `Ctrl+O` y sal con `Ctrl+X`).*

```bash
# Probar y reiniciar Nginx
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🎉 ¡Comprobación Final!

Abre tu navegador y entra a `https://tudominio.com`:
- Verás el candado de seguridad SSL activo.
- La velocidad de carga de las camisetas será casi instantánea gracias al CDN.
- Tu IP de servidor estará protegida y segura.
