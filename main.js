const { app, BrowserWindow } = require('electron');
const path = require('path');

// Prevent visual flashing by ensuring hardware acceleration is stable
app.disableHardwareAcceleration();

function createWindow () {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 960,
        minHeight: 540,
        autoHideMenuBar: true, // Hides File/Edit/View menu
        backgroundColor: '#000000', // Matches your game background
        icon: path.join(__dirname, 'assets/icons/icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            // Enables local file loading for your JSON/assets
            webSecurity: true 
        }
    });

    // Start maximized for the best RPG experience
    win.maximize();

    // Load your game
    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
