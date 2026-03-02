export default function WelcomeGuide() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏈</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">¡Bienvenido al Creador de Jugadas!</h1>
          <p className="text-gray-500 text-lg">
            Tu herramienta para diseñar y organizar todas las jugadas de tu equipo de fútbol americano de banderas.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                1
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Crea tu primer cuaderno de jugadas</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  En el panel izquierdo, hacé clic en <strong>+ New</strong> dentro de la sección{" "}
                  <strong>Playbooks</strong>. Escribí un nombre (por ejemplo, <em>&ldquo;Semana 1&rdquo;</em> o{" "}
                  <em>&ldquo;Torneo de verano&rdquo;</em>) y presioná <strong>Save</strong>. Podés tener varios cuadernos para
                  distintos partidos o entrenamientos.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                2
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Agregá una jugada</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Con un cuaderno seleccionado, aparece el botón <strong>+ New Play</strong> en la parte inferior del
                  panel. Hacé clic, escribí el nombre de la jugada y elegí si es de <strong>ataque</strong> (Offense) o
                  de <strong>defensa</strong> (Defense). Luego presioná <strong>Create</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                3
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Posicioná a los jugadores en la cancha</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Al abrir una jugada, verás la cancha con los jugadores ya colocados. Usá la herramienta{" "}
                  <strong>✋ Select/Drag</strong> (en la barra superior) para arrastrar cada jugador a la posición que
                  quieras. También podés cambiar el color de cada jugador seleccionándolo y usando el selector de color.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                4
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Dibujá las rutas de los jugadores</h2>
                <p className="text-gray-600 text-sm mb-3">
                  Las rutas muestran el recorrido que debe hacer cada jugador durante la jugada. Para dibujarlas:
                </p>
                <ol className="text-gray-600 text-sm space-y-2 list-none">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">①</span>
                    <span>
                      Hacé clic en <strong>🏈 Route</strong> en la barra de herramientas.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">②</span>
                    <span>Hacé clic sobre el jugador al que querés asignarle una ruta.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">③</span>
                    <span>
                      Hacé clic en los puntos del campo para trazar el recorrido paso a paso (podés hacer tantos puntos
                      como necesites).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">④</span>
                    <span>
                      Para terminar la ruta, hacé <strong>doble clic</strong> en el último punto.
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                5
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Guardá y reutilizá formaciones</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Cuando tengas a los jugadores bien ubicados, podés guardar esa disposición como una{" "}
                  <strong>formación</strong> haciendo clic en <strong>💾 Save Formation</strong>. La próxima vez que
                  crees una jugada, podés cargar esa formación con el menú desplegable <strong>Load Formation</strong>{" "}
                  y tener a todos los jugadores ya colocados automáticamente.
                </p>
              </div>
            </div>
          </div>

          {/* Step 6 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                6
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Guardá rutas de tus jugadores favoritos</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  En la sección <strong>Player Templates</strong> del panel izquierdo, podés guardar las rutas
                  habituales de cada jugador. Así, cuando estés diseñando una jugada, podés aplicar una ruta guardada
                  al instante con el menú <strong>Load Route</strong> y ahorrar tiempo.
                </p>
              </div>
            </div>
          </div>

          {/* Step 7 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                7
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Imprimí tu cuaderno de jugadas</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Cuando estés listo para el partido, hacé clic en el ícono de impresora{" "}
                  <span className="inline-block">🖨️</span> que aparece junto al nombre de tu cuaderno en el panel
                  izquierdo. Se abrirá una vista lista para imprimir con todas las jugadas y sus diagramas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <span>💡</span> Consejos rápidos
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1.5">
            <li>• Usá <strong>✏️ Pen</strong> para agregar anotaciones libres sobre la cancha (flechas, notas visuales).</li>
            <li>• Podés tener múltiples cuadernos para distintos partidos o categorías de jugadas.</li>
            <li>• Las jugadas se guardan automáticamente cada vez que hacés un cambio.</li>
            <li>• Para eliminar una jugada o cuaderno, usá el botón <strong>×</strong> que aparece al pasar el cursor.</li>
          </ul>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Seleccioná o creá una jugada desde el panel izquierdo para comenzar a diseñar.
        </p>
      </div>
    </div>
  );
}
