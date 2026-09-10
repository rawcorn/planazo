# Demo Mock (Versión Autónoma)

Esta es una versión **completamente aislada e independiente** del MVP principal de Planazo. Ha sido diseñada específicamente para poder realizar pruebas, demostraciones y comparar la experiencia de usuario sin depender de una conexión a Supabase ni afectar la base de datos de producción o desarrollo.

## Diferencias respecto a la versión original con Supabase

1. **Datos Ficticios (Mock Data)**: En lugar de conectarse a Supabase, toda la información proviene del archivo `src/lib/mock-data.ts`. Este archivo contiene usuarios, eventos, intereses, regiones y chats predefinidos.
2. **Server Actions Sustituidas**: Los Server Actions ubicados en `src/app/actions` han sido reescritos para interactuar exclusivamente con la memoria (arreglos locales en `mock-data.ts`) en vez de ejecutar consultas a Supabase.
3. **Autenticación Simulada**: El proceso de registro (`signUp`) y de inicio de sesión (`signIn`) no requiere contraseña real ni interactúa con Supabase Auth. Utiliza cookies locales (`mock_session`) para identificar al usuario de demostración actual.
4. **Almacenamiento de Imágenes (Storage)**: El almacenamiento de imágenes simula el proceso de subida devolviendo la misma imagen codificada en formato `base64`, lo que permite probar la funcionalidad sin subir los archivos a ningún bucket.
5. **No requiere base de datos**: No es necesario ejecutar migraciones (`schema.sql`) ni tener configuradas variables de entorno de Supabase (`NEXT_PUBLIC_SUPABASE_URL`, etc.).
6. **Puerto Diferente**: La demo está configurada para ejecutarse en el puerto **3001** (en vez del clásico 3000) para que puedas tener ambas versiones ejecutándose en simultáneo y compararlas lado a lado.

## Cómo ejecutar la demo mock

### 1. Instalar dependencias
Asegúrate de estar ubicado en la carpeta `demo-mock` e instala las dependencias (puedes usar npm):

```bash
cd demo-mock
npm install
```

### 2. Iniciar el servidor de desarrollo
Ejecuta el siguiente comando para levantar la aplicación:

```bash
npm run dev
```

Esto iniciará el servidor en [http://localhost:3001](http://localhost:3001).

### 3. Iniciar sesión de prueba
Puedes usar cualquier usuario de prueba que se encuentre pre-registrado en `mock-data.ts`. Por ejemplo:

**Email**: `juan@demo.com`
**Contraseña**: (Puedes escribir cualquiera, la demo la ignora)

O puedes registrar un nuevo usuario y comenzar a interactuar de cero (los datos vivirán en la memoria de la aplicación mientras el servidor esté en ejecución).
