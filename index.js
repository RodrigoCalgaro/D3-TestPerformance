const { app, BrowserWindow } = require('electron');

const url = require('url');
const path = require('path');


let mainWindow;

app.on('ready', () => {
    // The Main Window
    mainWindow = new BrowserWindow();
    mainWindow.maximize()
    
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'views/index.html'),
      protocol: 'file',
      slashes: true
    }))
    
    /* mainWindow.setMenu(null) */

    // If we close main Window the App quit
    mainWindow.on('closed', () => {
      app.quit();
    });
  
  });