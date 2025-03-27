// Polyfill for Node.js globals in the browser
window.global = window
window.process = {
  env: { DEBUG: undefined },
  version: "",
  nextTick: (cb) => setTimeout(cb, 0),
}
window.Buffer = window.Buffer || require("buffer").Buffer

