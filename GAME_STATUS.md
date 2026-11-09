# Imperio Maderero 3D — registro de funciones

El hito del 50% solo cuenta funciones principales implementadas **y verificadas en ejecución**. La presencia de código por sí sola no cuenta.

| Función principal | Estado | Evidencia / pendiente |
|---|---|---|
| Carga del juego y escena 3D | Verificada | Página publicada responde y Three.js renderiza en la prueba de navegador. |
| Movimiento táctil Android/Chrome | Implementada, pendiente de verificación | Joystick visible; falta comprobar arrastre real en viewport móvil. |
| Tala automática por proximidad | Implementada, pendiente de verificación | El golpe manual cambia el contador; falta validar el ciclo automático moviendo al jugador. |
| Carga de troncos y camión | Parcial | El botón valida proximidad; la ruta y el retorno del camión requieren reparación y prueba. |
| Aserradero y producción de tablas | Implementada, pendiente de verificación | Banda, rodillos y conversión están en el código; falta prueba de extremo a extremo. |
| Almacén y venta | Implementada, pendiente de verificación | Botón y comprador están programados; falta completar el ciclo real. |
| Trabajadores y automatización | Implementada, pendiente de verificación | Contratación y generación periódica de troncos están en el código. |
| Mejoras y economía | Parcialmente verificada | Modal de mejoras abre; falta probar compras, costes y efectos. |
| Desbloqueo de terrenos y oficinas | Implementada, pendiente de verificación | Lógica presente; falta validar acceso a todos los árboles y automatización. |
| Inversionista | Implementada, pendiente de verificación | Oferta directa con aceptación/rechazo; falta probar el evento completo. |
| Anuncios recompensados con confirmación del proveedor | No implementada | No se simulará una recompensa como si proviniera de un proveedor real. |

## Pruebas locales

Ejecutar `npm test`. El workflow de GitHub Actions ejecuta las mismas pruebas en cada push y pull request a `main`.
