# Imperio Maderero 3D — registro de funciones

El hito del 50% solo cuenta funciones principales implementadas **y verificadas en ejecución**. La presencia de código por sí sola no cuenta.

| Función principal | Estado | Evidencia / pendiente |
|---|---|---|
| Carga del juego y escena 3D | Verificada | La página publicada responde y Three.js renderiza en la prueba de navegador. |
| Movimiento táctil Android/Chrome | Lógica reforzada y probada; dispositivo pendiente | Se cubren Pointer Events, Touch Events, captura, cancelación y centrado del joystick en pruebas automatizadas. Falta una pasada táctil real en Android Chrome. |
| Tala automática por proximidad | Lógica integrada y probada; ejecución móvil pendiente | La lógica golpea por proximidad, respeta radio y capacidad, y entrega un tronco tras tres golpes. Las pruebas automatizadas pasan; falta confirmar el ciclo en un dispositivo Android con almacenamiento limpio. |
| Carga de troncos y camión | Lógica de ruta verificada; escena pendiente | Pruebas de fases de carga, viaje, descarga y retorno. La integración visual aún requiere comprobación en navegador. |
| Aserradero y producción de tablas | Lógica e integración verificadas por pruebas | Cada tronco se mueve por la banda, se convierte una sola vez al cruzar la sierra y genera una tabla al llegar al almacén. Prueba determinista de lote incluida. |
| Almacén y venta | Lógica e integración verificadas por pruebas | El almacén recibe tablas y el comprador captura el precio al iniciar; el pago se aplica una sola vez al completar la salida. Prueba de ciclo camión→aserradero→almacén→venta incluida. |
| Trabajadores y automatización | Implementada, pendiente de verificación | Contratación y generación periódica de troncos están en el código. |
| Mejoras y economía | Parcialmente verificada | El modal abre; faltan pruebas de compras, costes y efectos. |
| Desbloqueo de terrenos y oficinas | Implementada, pendiente de verificación | Lógica presente; falta validar acceso a todos los árboles y automatización. |
| Inversionista | Implementada, pendiente de verificación | Oferta directa con aceptación/rechazo; falta probar el evento completo. |
| Anuncios recompensados con confirmación del proveedor | No implementada | No se simulará una recompensa como si proviniera de un proveedor real. |

## Última revisión técnica

- Ciclo logístico ampliado: producción de tablas y venta ahora comparten transiciones deterministas con el motor del juego; se capturan precio/cantidad al iniciar la venta y se evita pagar dos veces.
- Pruebas añadidas: conversión/almacenamiento de cada tronco una sola vez, precio congelado y ciclo lógico completo camión→aserradero→almacén→venta.


- Commit de controles y tala automática: 84bd4de01dd5855bd4e4619b4aaaca64f5553995.
- GitHub Actions: npm test completado correctamente en https://github.com/pedroperezcastaneda27-cpu/imperio-maderero-3d./actions/runs/42676116929.
- GitHub Pages: compilación y despliegue completados correctamente en https://github.com/pedroperezcastaneda27-cpu/imperio-maderero-3d./actions/runs/42676117317.
- El asset publicado game-logic.js contiene advanceAutoChop y el manejador lostpointercapture.
- La prueba de navegador confirma carga de Three.js y la escena publicada. La herramienta no pudo sintetizar el arrastre del joystick; no se declara verificado el movimiento táctil real en Android.
