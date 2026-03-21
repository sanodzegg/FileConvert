const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const { PDFDocument } = require('pdf-lib')

let mergedBuffer = null

function registerPdfToolsHandlers(mainWindow) {
  ipcMain.handle('pdf-merge', async (_event, { filePaths }) => {
    const merged = await PDFDocument.create()

    for (const fp of filePaths) {
      const buf = fs.readFileSync(fp)
      const doc = await PDFDocument.load(buf)
      const pages = await merged.copyPages(doc, doc.getPageIndices())
      pages.forEach(p => merged.addPage(p))
    }

    mergedBuffer = await merged.save()
    return {}
  })

  ipcMain.handle('pdf-merge-save', async () => {
    if (!mergedBuffer) return { canceled: true }
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save merged PDF',
      defaultPath: 'merged.pdf',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })
    if (canceled || !filePath) return { canceled: true }
    fs.writeFileSync(filePath, mergedBuffer)
    return { canceled: false, filePath }
  })

  ipcMain.handle('pdf-pick-files', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select PDF files',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      properties: ['openFile', 'multiSelections'],
    })
    if (canceled || !filePaths.length) return { canceled: true, files: [] }
    const files = filePaths.map(fp => ({
      path: fp,
      name: path.basename(fp),
      size: fs.statSync(fp).size,
    }))
    return { canceled: false, files }
  })
}

module.exports = { registerPdfToolsHandlers }
