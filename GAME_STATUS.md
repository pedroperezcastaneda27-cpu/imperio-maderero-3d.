# Imperio Maderero 3D — registro de funciones

El hito del 50% solo cuenta funciones principales implementadas **y verificadas en ejecución**. La presencia de código por sí sola no cuenta.

| Función principal | Estado | Evidencia / pendiente |
|---|---|---|
| Carga del juego y escena 3D | Verificada | La página publicada responde y Three.js renderiza en la prueba de navegador. |
| Movimiento táctil Android/Chrome | Lógica reforzada y probada; dispositivo pendiente | Se cubren Pointer Events, Touch Events, captura, cancelación y centrado del joystick en pruebas automatizadas. Falta una pasada táctil real en Android Chrome. |
| Tala automática por proximidad | Lógica integrada y probada; ejecución móvil pendiente | La lógica golpea por proximidad, respeta radio y capacidad, y entrega un tronco tras tres golpes. Prueba dirigida en Node aprobada; falta confirmar el ciclo con controles táctiles reales en el dispositivo. |
| Carga de troncos y camión | Parcial | El botón valida proximidad; la ruta, carga, descarga y retorno necesitan prueba de extremo a extremo. |
| Aserradero y producción de tablas | Implementada, pendiente de verificación | Banda, rodillos y conversión están en el código; falta prueba de extremo a extremo. |
| Almacén y venta | Implementada, pendiente de verificación | Botón y comprador están programados; falta completar el ciclo real. |
| Trabajadores y automatización | Implementada, pendiente de verificación | Contratación y generación periódica de troncos están en el código. |
| Mejoras y economía | Parcialmente verificada | El modal abre; faltan pruebas de compras, costes y efectos. |
| Desbloqueo de terrenos y oficinas | Implementada, pendiente de verificación | Lógica presente; falta validar acceso a todos los árboles y automatización. |
| Inversionista | Implementada, pendiente de verificación | Oferta directa con aceptación/rechazo; falta probar el evento completo. |
| Anuncios recompensados con confirmación del proveedor | No implementada | No se simulará una recompensa como si proviniera de un proveedor real. |

## Pruebas

- Añadidas pruebas unitarias para tala automática por proximidad, límite de mochila, arrastre por Pointer Events y compatibilidad Touch Events.
- Cuatro pruebas dirigidas de Node para los nuevos controladores pasaron en el entorno de trabajo.
- La prueba de navegador confirma carga de Three.js y la escena publicada. La herramienta no pudo sintetizar el arrastre del joystick, así que no se declara verificado el movimiento táctil real.
- La ejecución completa de npm test queda pendiente de confirmar en GitHub Actions.
