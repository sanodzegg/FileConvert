const { ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

function registerFileSaveHandlers(mainWindow) {
  ipcMain.handle('pick-download-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select auto-download folder',
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('save-converted-file', async (_event, folderPath, fileName, buffer) => {
    const dest = path.join(folderPath, fileName)
    fs.writeFileSync(dest, Buffer.from(buffer))
    return dest
  })
}

module.exports = { registerFileSaveHandlers }
