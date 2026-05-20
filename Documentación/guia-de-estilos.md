# Guía de estilos — IADocuments

## Estructura del proyecto

El proyecto es una SPA (Single Page Application) construida con **React 19 + Vite**. No hay archivos HTML separados por página; toda la aplicación parte de un único `index.html` generado por Vite.

```
frontend/
├── public/
│   ├── images/          # Imágenes estáticas (logo, iconos SVG)
│   └── styles.css       # CSS global (accesibilidad, overrides globales)
└── src/
    ├── componentes/     # Componentes React (.jsx + .css por componente)
    ├── servicios/       # Lógica de llamadas a la API (.js)
    ├── styles/          # Variables CSS, base, media queries, estilos por página
    │   ├── root.css     # Variables CSS globales (:root)
    │   ├── base.css     # Reset y estilos base (html, body, nav)
    │   ├── landing.css  # Estilos de la landing page
    │   ├── registro.css # Estilos del registro
    │   ├── styles.css   # Estilos generales de la app
    │   └── media.css    # Media queries
    ├── App.jsx          # Componente raíz, gestiona rutas/vistas
    └── main.jsx         # Punto de entrada, monta React en el DOM
```

Backend (Express + TypeScript, Clean Architecture):

```
backend/
├── <Módulo>/
│   ├── domain/          # Interfaces y entidades
│   ├── application/     # Casos de uso
│   └── infrastructure/
│       └── rest/        # Controladores y rutas HTTP
└── context/
    ├── db/              # Conector PostgreSQL
    └── security/        # Middleware de autenticación JWT
```

---

## Convenciones de nombrado

| Elemento | Convención | Ejemplo |
|---|---|---|
| Variables y funciones | camelCase | `getToken`, `handleChange` |
| Constantes | MAYÚSCULAS con guión bajo | `URL_SERVER`, `MAX_SIZE` |
| Componentes React | PascalCase | `ChatPrincipal`, `AsideChats` |
| Archivos de componentes | PascalCase (`.jsx` + `.css`) | `Login.jsx`, `Login.css` |
| Archivos de servicios | camelCase (`.js`) | `peticiones.js`, `login.js` |
| Archivos de estilos generales | kebab-case | `landing.css`, `media.css` |
| Carpetas | kebab-case o minúsculas | `componentes/`, `servicios/` |
| Variables CSS | `--tipo-subtipo-especialización` | `--background-color-text-ia` |
| Rutas REST | plural | `/api/documentos`, `/api/chats` |

---

## Estilo del código

- **Indentación:** 2 espacios
- **Comillas:** dobles (`"`)
- **Punto y coma:** no se usan al final de las líneas
- **ESLint:** configurado para `.ts`/`.tsx`. Para `.jsx`/`.js` se siguen las mismas reglas de forma manual.

Ejemplo correcto:

```jsx
import { useState } from "react"
import "./Login.css"

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" })
  // ...
}
```

---

## Variables CSS globales (`root.css`)

Todas las variables de diseño están centralizadas en `:root`. Nunca se usan valores de color o tipografía directamente en los componentes; siempre se referencian con `var(--nombre)`.

```css
:root {
  /* Colores */
  --background-color: hsla(219, 34%, 62%, 100%);        /* Fondo aplicación */
  --background-color-chats: hsla(198, 31%, 67%, 100%);  /* Fondo lista de chats */
  --background-color-chat-selected: hsla(197, 30%, 63%, 100%); /* Fondo chat activo */
  --background-color-text-user: hsla(277, 41%, 66%, 100%);     /* Burbuja mensaje usuario */
  --background-color-text-user-doc: hsla(277, 14%, 57%, 100%); /* Documento del usuario */
  --background-color-text-ia: hsla(197, 77%, 44%, 100%);       /* Burbuja mensaje IA */
  --background-color-text-ia-selected: hsla(183, 59%, 45%, 100%); /* Borde animado */
  --background-color-text-ia-doc: hsla(197, 52%, 38%, 100%);   /* Documento de respuesta IA */
  --background-color-oscuro: rgb(26, 63, 78);           /* Modo oscuro */
  --background-color-menu: hsla(0, 10%, 92%, 0.966);    /* Fondo menú desplegable */
  --background-color-body: hsla(180, 90%, 92%, 0.75);   /* Fondo body app */
  --button-color: hsla(229, 46%, 9%, 100%);             /* Fondo landing */

  /* Tipografía */
  --family-font-conversacion: Verdana, Geneva, Tahoma, sans-serif;
  --font-size-chat: 16px;
  --font-size-menu: 14px;

  /* Tamaños */
  --img-height-menu: 25px;
  --img-height-menu-sub2: 16px;
  --logo-height-menu: 30px;
}
```

---

## Tipografía

**Verdana, Geneva, Tahoma, sans-serif**

Se eligió esta pila tipográfica por su alta legibilidad: altura de x grande, espaciado amplio entre caracteres y formas muy diferenciadas entre letras similares (como `l`, `I` y `1`). Funciona bien en pantallas de baja resolución y en tamaños pequeños, lo que la hace adecuada para una interfaz de chat con mucho texto.

- Tamaño base del chat: `16px`
- Tamaño menú y elementos secundarios: `14px`
- No se usan fuentes externas (Google Fonts, Adobe Fonts) para evitar peticiones de red adicionales.

---

## Paleta de colores

La paleta usa el espacio de color HSLA, que facilita ajustar luminosidad y saturación manteniendo el mismo tono base. Los colores de la aplicación giran en torno a dos tonos principales:

- **Azul-cian** (hue ~197–219): fondos de la aplicación, mensajes de la IA, elementos de navegación.
- **Violeta** (hue ~277): mensajes del usuario y documentos subidos por el usuario.
- **Azul marino oscuro** (hue ~229): fondo de la landing page, botones principales.

El fondo del body (`hsla(180, 90%, 92%, 0.75)`) es un cian muy claro y semitransparente para dar sensación de profundidad sobre el fondo de la landing.

---

## Orden de propiedades CSS

Dentro de cada regla CSS, las propiedades se ordenan así:

1. Display (`display`, `visibility`)
2. Tamaño y espaciado (`width`, `height`, `margin`, `padding`, `box-sizing`)
3. Bordes (`border`, `border-radius`, `outline`)
4. Tipografía y color (`font-family`, `font-size`, `font-weight`, `color`, `text-align`)
5. Fondo (`background`, `background-color`)
6. Comportamiento (`flex`, `grid`, `position`, `top`, `left`, `z-index`)
7. Overflow y visibilidad (`overflow`, `opacity`, `pointer-events`)
8. Efectos visuales (`box-shadow`, `filter`, `backdrop-filter`)
9. Animaciones (`transition`, `animation`)
10. Propiedades extra (`cursor`, `user-select`, `resize`)

---

## Iconos

Todos los iconos se usan en formato **SVG** (en `/public/images/`). No se usa ninguna librería de iconos externa. Esto garantiza que los iconos se escalan sin pérdida de calidad y no añaden dependencias al bundle.

---

## Boceto inicial

El boceto de referencia para el diseño de la interfaz principal se inspiró en un layout de mensajería minimalista: sidebar con lista de chats a la izquierda y área de conversación a la derecha. El objetivo era que cualquier usuario pudiera entender cómo funciona sin necesidad de formación previa.

La landing page sigue el mismo principio: fondo oscuro, título, y un único botón de acción ("Comenzar") para no abrumar al usuario con opciones desde el primer momento.
