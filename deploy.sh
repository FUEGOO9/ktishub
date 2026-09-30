#!/bin/bash
# ==============================================================================
# Script de Despliegue Automático para VPS (Ubuntu / Debian)
# ==============================================================================

set -e

echo "🚀 Iniciando despliegue de KitsHub Store..."

# 1. Instalar dependencias del sistema si faltan
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    sudo npm install -g pm2
fi

# 2. Instalar dependencias del proyecto
echo "📦 Instalando paquetes npm..."
npm install

# 3. Compilar aplicación
echo "🔨 Compilando aplicación para producción..."
npm run build

# 4. Iniciar / Reiniciar proceso con PM2
echo "🔄 Iniciando servidor Node en segundo plano..."
pm2 startOrRestart ecosystem.config.cjs

# 5. Guardar configuración PM2 para que inicie automáticamente al reiniciar el VPS
pm2 save

echo "✅ ¡Despliegue completado con éxito! La tienda está corriendo en el puerto 3000."
