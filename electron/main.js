const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const isDev = !app.isPackaged;
  
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: "Fusion Tier Simulator",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Allows simplifying local setup for this use case
      webSecurity: false // Optional: helpful if loading local images from disk in some scenarios
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/icon.ico') // Optional: Add an icon if you have one
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});