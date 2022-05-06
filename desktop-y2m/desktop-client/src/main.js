const { app, BrowserWindow } = require('electron'); 

const createWindow = () => {
    const win = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    /*
    const splash = new BrowserWindow({
      width: 800,
      height: 600,
      frame: false,
      transparent: true,
      alwaysOnTop: true
    });*/

    win.removeMenu();
    win.maximize();

    //splash.loadFile('splash.html');
    win.loadFile('index.html');

    //win.hide();

    win.once('ready-to-show', () => {
      //splash.destroy();
      win.show();
      //win.webContents.openDevTools();
    });
}

app.whenReady().then(() => {
    createWindow();
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});