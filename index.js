const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const si = require('systeminformation');
const fetch = require('electron-fetch').default;

/**
 * method to create the desktop window.
 */
const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

};

/**
 * This method will be called when Electron has finished initialization and is ready to create browser windows.
*/
app.on('ready', createWindow);

/**
 * Quit when all windows are closed, except on macOS. There, it's common for applications and their menu bar to stay active 
 * until the user quits explicitly with Cmd + Q.
 */
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// listen to load event from the renderer process - and get cpu temperature on page load and send to the main process
// this method round the temp to 2 decimal places if it is available
// send the type of result - (success | error)
ipcMain.on('appload', (e) => {
    si.cpuTemperature()
        .then(data => e.sender.send("appload-task-finished", { text: data.main.toFixed(2), type: 'success' }))
        .catch(() => e.sender.send("appload-task-finished", { text: '', type: 'error' }));
})

// listen to btnclick (check button) event from the renderer process - and get current weather on page load and send to the main process
// this method floor the weather response
// send the type of result - (success | error)
ipcMain.on('btnclick', (e, arg) => {
    const API_KEY = "e7e1977d1df2ac01940366abe59ce906";

    if (arg.length === 0) {
        e.sender.send("btnclick-task-finished", { text: '', type: 'error' });
        return;
    }

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${arg}&appid=${API_KEY}&units=metric`)
        .then(response => response.json())
        .then(data => e.sender.send("btnclick-task-finished", { text: Math.floor(data.main.temp), type: 'success' }))
        .catch(() => e.sender.send("btnclick-task-finished", { text: '', type: 'error' }))
})

