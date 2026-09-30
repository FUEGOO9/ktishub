# 🚀 Guía Completa de Lanzamiento Oficial: Dominio, VPS y SSL

Esta guía te explica paso a paso cómo conectar tu propio dominio (ej: `kitshub.com` o `tutienda.com`) y montar la tienda en un servidor VPS en menos de 10 minutos.

---

## 📋 Requisitos Previos

1. **Un Dominio propio**: Comprado en Namecheap, GoDaddy, DonDominio, Hostinger, Porkbun o Cloudflare.
2. **Un Servidor VPS**: Cualquier VPS básico con **Ubuntu 22.04 / 24.04** (recomendados: Hetzner Cloud, Contabo, DigitalOcean, OVH o Linode por 3€ - 5€/mes).

---

## Paso 1: Configurar los DNS de tu Dominio

Entra al panel donde compraste tu dominio y añade estos 2 registros DNS tipo **A**:

| Tipo | Nombre (Host) | Valor (IP) | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `IP_DE_TU_VPS` | Automático / 300 |
| **A** | `www` | `IP_DE_TU_VPS` | Automático / 300 |

*(Reemplaza `IP_DE_TU_VPS` por la IP pública que te dio tu proveedor de VPS).*

---

## Paso 2: Conectarte al VPS por Terminal

Abre tu terminal (o programa como PuTTY) y conéctate como root:

```bash
ssh root@IP_DE_TU_VPS
```

---

## Paso 3: Subir o Clonar el Código en el VPS

1. Clona tu repositorio o copia la carpeta del proyecto en `/var/www/kitshub`:

```bash
mkdir -p /var/www/kitshub
cd /var/www/kitshub
# Clona tu repositorio de GitHub:
git clone <URL_DE_TU_REPOSITORIO> .
```

---

## Paso 4: Despliegue Automático con 1 Comando

Hemos incluido un script automático que instala Node.js 20, compila la tienda y la deja corriendo 24/7 con **PM2**:

```bash
chmod +x deploy.sh
./deploy.sh
```

*(La tienda ya estará funcionando internamente en el puerto 3000).*

---

## Paso 5: Configurar Nginx y Certificado SSL (HTTPS Gratuito)

1. Instala Nginx y Certbot:
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

2. Copia la configuración de Nginx:
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/kitshub
```

3. Edita el archivo y pon tu dominio real:
```bash
sudo nano /etc/nginx/sites-available/kitshub
```
*(Cambia `tudominio.com` por tu dominio y guarda con `Ctrl+O` y `Enter`, luego `Ctrl+X`).*

4. Activa el sitio en Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/kitshub /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

5. Genera el **Certificado SSL (HTTPS) con candado verde**:
```bash
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```
*(Sigue las 2 preguntas de Certbot e introduce tu email. ¡Se renovará automáticamente solo!).*

---

## Opción Alternativa: Despliegue con Docker 🐳

Si prefieres usar Docker y Docker Compose:

```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Levantar la tienda
docker compose up -d --build
```

---

## 🎉 ¡Listo para Vender!

Tu tienda estará online en `https://tudominio.com` con:
- 5.088 camisetas y prendas cargadas al instante.
- Pasarela de pago segura con Tarjeta / Apple Pay / Klarna / PayPal / Cripto.
- Panel de administración protegido con PIN para gestionar pedidos y catálogo.
