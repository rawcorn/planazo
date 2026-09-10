# Documentación de Planazo

## Descripción General
**Planazo** es una aplicación web (construida con Next.js y React) orientada a ser una plataforma social para conectar personas a través de la creación y participación en eventos o actividades (llamados "planazos"). La aplicación facilita conocer gente nueva y organizar salidas basadas en intereses comunes y ubicación geográfica (regiones). Además, cuenta con un robusto sistema de chat integrado para facilitar la comunicación comunitaria y privada.

## Arquitectura y Tecnologías
- **Frontend:** Next.js (App Router), React, TailwindCSS.
- **Estado Global:** Zustand.
- **Formularios y Validación:** React Hook Form, Zod.
- **Backend / BaaS:** Supabase (Autenticación, Base de datos relacional PostgreSQL, Storage para imágenes).
- **Iconografía:** Lucide React.

## Funcionalidades Principales

### 1. Autenticación y Perfil de Usuario
- **Registro e Inicio de Sesión:** Sistema de autenticación de usuarios gestionado por Supabase.
- **Perfiles Detallados:** Cada usuario cuenta con un perfil enriquecido que incluye:
  - Datos básicos (nombre de usuario, edad, género).
  - Región de residencia (para filtrar eventos y salas de chat).
  - Intereses o categorías favoritas.
  - Enlaces a redes sociales (Instagram, Facebook).
  - Foto de perfil (Avatar).

### 2. Gestión de Eventos (Planazos)
- **Cartelera de Eventos:** Los usuarios pueden explorar los eventos disponibles segmentados por región o intereses.
- **Creación de Eventos:** Cualquier usuario autenticado puede organizar un "planazo", definiendo:
  - Título, descripción e imagen representativa (subida y alojada en Supabase Storage).
  - Fecha, hora y dirección física del encuentro.
  - Región y Categoría (interés).
  - Reglas de participación: edad mínima/máxima, y cupo máximo de asistentes.
- **Participación:** Los usuarios pueden unirse a eventos existentes o abandonarlos. El sistema gestiona dinámicamente la lista de asistentes.

### 3. Sistema de Chat y Comunicación Integrada
La comunicación es un pilar central, organizada en "Salas" (Rooms):
- **Salas de Región:** Chats públicos comunitarios donde participan todos los usuarios de una misma región. El sistema anuncia aquí automáticamente la creación de nuevos eventos.
- **Salas de Evento:** Espacios de comunicación específicos vinculados a un evento.
- **Mensajes Directos (DMs):** Los usuarios pueden visitar el perfil de otra persona e iniciar conversaciones privadas uno a uno.

### 4. Interfaz de Usuario (UI) de Tres Columnas
La aplicación presenta una interfaz moderna y fluida de tres paneles (estilo aplicaciones de mensajería como Telegram/Discord), totalmente responsiva para dispositivos móviles:
- **Columna Izquierda (Navegación):** Funciona como menú principal. Permite cambiar entre diferentes salas de chat de regiones, ver conversaciones de mensajes directos, y acceder al perfil propio.
- **Columna Central (Chat):** Muestra el historial de mensajes de la sala activa (Región, Evento o DM), permitiendo enviar mensajes de texto y ver notificaciones del sistema.
- **Columna Derecha (Contexto y Detalles):** Es un panel dinámico que cambia según la acción del usuario para mostrar:
  - La **"Cartelera"** (lista de eventos disponibles en la región activa).
  - El formulario de **"Creación de Eventos"**.
  - Los **"Detalles de un Evento"** específico (información completa y lista de asistentes).
  - El **"Perfil de Usuario"** de otro miembro de la plataforma.

## Flujo de Uso Típico
1. Un usuario se registra, completa sus datos y selecciona su región principal.
2. Ingresa directamente a la sala de chat de su región (Columna Central) para interactuar con la comunidad.
3. Observa en la Cartelera (Columna Derecha) un planazo que le interesa.
4. Hace clic para ver los detalles, decide unirse y luego entra al chat privado de ese evento o envía un mensaje directo al creador del plan para coordinar.
