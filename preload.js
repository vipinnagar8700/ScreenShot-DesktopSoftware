const { contextBridge, ipcRenderer } = require("electron");

// Expose functions to the renderer process (front-end)
contextBridge.exposeInMainWorld("electronAPI", {
  startScreenshot: () => ipcRenderer.send("start-screenshot"),
  stopScreenshot: () => ipcRenderer.send("stop-screenshot"),
  login: (credentials) => ipcRenderer.invoke("user:login", credentials),
  logout: () => ipcRenderer.send("user:logout"),
  getUser: () => ipcRenderer.invoke("user:get"),
  onLoginSuccess: (callback) => ipcRenderer.on("login-success", callback),
  onLoginFailed: (callback) => ipcRenderer.on("login-failed", callback),
  getScreenshots: () => ipcRenderer.invoke("get-screenshots")
});

