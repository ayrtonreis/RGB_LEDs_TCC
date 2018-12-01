// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron');

require('electron-reload')(__dirname);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow, textEditingWindow;

function createWindow () {

  // Used for Geolocation
  process.env.GOOGLE_API_KEY = 'AIzaSyDWZQPcwIwY8-UJJq-U4cK2a65_aGR2zXA';

  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1080, height: 600, minWidth: 300, minHeight: 200, show: false});
  textEditingWindow = new BrowserWindow({ width: 800, height: 600, minWidth: 300, minHeight: 200, show: false, parent: mainWindow});

  // and load the html files of the app.
  mainWindow.loadFile('index.html');
  textEditingWindow.loadFile('text-editing-window.html');

  mainWindow.once('ready-to-show', ()=>{
    mainWindow.show();
  });

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    textEditingWindow = null;
  });

  textEditingWindow.on('close', function (event) {
      textEditingWindow.hide();
      event.preventDefault();
  });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('showTextEditingWindow', (e, args)=>{
  textEditingWindow.show();
});

ipcMain.on('msgFromTextEditingWindow', (e, data)=>{
    mainWindow.webContents.send('channelTextEditing', data);
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
