// React necesita saber que está en un entorno de pruebas para que act() no avise.
declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

/**
 * jsdom no implementa Blob.prototype.text() ni arrayBuffer(), que todos los
 * navegadores soportan desde hace años. Sin este relleno no se puede probar
 * nada que lea un fichero elegido por la persona, como la restauración de un
 * respaldo. Es una carencia del entorno de pruebas, no del código.
 */
if (typeof Blob !== 'undefined' && typeof Blob.prototype.text !== 'function') {
  const leer = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsText(blob)
    })
  Object.defineProperty(Blob.prototype, 'text', {
    configurable: true,
    writable: true,
    value(this: Blob) { return leer(this) },
  })
}

export {}
