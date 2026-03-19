const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  convert: (buffer, targetFormat, quality, imageOptions) => ipcRenderer.invoke('convert-file', buffer, targetFormat, quality, imageOptions),
  convertDocument: (buffer, targetFormat, sourceFormat) => ipcRenderer.invoke('convert-document', buffer, targetFormat, sourceFormat),
  convertVideo: (buffer, sourceExt, targetFormat, videoOptions) => ipcRenderer.invoke('convert-video', buffer, sourceExt, targetFormat, videoOptions),
  convertFavicon: (buffer) => ipcRenderer.invoke('convert-favicon', buffer),
})
