const { app, BrowserWindow, desktopCapturer, ipcMain, screen,powerMonitor } = require("electron");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data"); // Import form-data package
const player = require("play-sound")(); 

let mainWindow;
let screenshotInterval;
let userToken = null; // Global token to store user authentication
let userData = null; // Store user data after login
let screenshots = []; // Array to store screenshot paths
let apiCallInterval;

app.on("ready", () => {
  console.log("App is ready, creating main window.");

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: false, // Disable security (not recommended for production)
    },
  });

  const staticUrl = `file://${path.join(__dirname, "app")}`;
  console.log(`Loading URL: ${staticUrl}/signin.html`);
  mainWindow.loadURL(`${staticUrl}/signin.html`);

  mainWindow.on("closed", () => {
    console.log("Main window closed.");
    mainWindow = null;
  });
});

app.on("window-all-closed", async () => {
  await sendScreenshotsToAPI();
  console.log("All windows closed. Quitting application.");
  if (process.platform !== "darwin") app.quit();
});

// Detect when the screen turns off or the system goes idle
powerMonitor.on("suspend", () => {
  console.log("System is going to sleep (Screen OFF).");
});

powerMonitor.on("resume", () => {
  console.log("System is waking up (Screen ON).");
});

powerMonitor.on("lock-screen", () => {
  console.log("Screen is locked.");
});

powerMonitor.on("unlock-screen", () => {
  console.log("Screen is unlocked.");
});
// Listen for the "start-screenshot" event to start taking screenshots every 10 seconds
ipcMain.on("start-screenshot", () => {
  console.log("IPC Event: 'start-screenshot' received. Starting interval.");

  // Ensure the screenshot directory exists
  const screenshotFolder = path.join(__dirname, "screenshots");
  if (!fs.existsSync(screenshotFolder)) {
    console.log(`Screenshot folder does not exist. Creating folder: ${screenshotFolder}`);
    fs.mkdirSync(screenshotFolder);
  }

  // Start taking screenshots every 10 seconds
  screenshotInterval = setInterval(() => {
    takeScreenshot(screenshotFolder);
  }, 3000); // 10 seconds interval
  //  Start hitting API every 1 minute (60 seconds)
  // apiCallInterval = setInterval(() => {
  //   sendScreenshotsToAPI(); // Call the API every 1 minute
  // }, 610000); // 10 minute interval (60,000 ms)
});
// Debugging: Log preload path
console.log("Preload path:", path.join(__dirname, "preload.js"));
// Listen for the "stop-screenshot" event to stop the interval
ipcMain.on("stop-screenshot", async () => {
  console.log("IPC Event: 'stop-screenshot' received. Stopping interval.");
  if (screenshotInterval) {
    clearInterval(screenshotInterval); // Stop the interval
    console.log("Screenshot interval stopped.");
    // After stopping, send the stored screenshots to the API
    await sendScreenshotsToAPI();
  }
});

// Function to capture and save a full-screen screenshot
async function takeScreenshot(saveFolder) {
  console.log("Taking full-size screenshot...");
  console.log(userToken, "userToken@123")
  try {
    // Play a sound before taking the screenshot
  const soundFilePath = path.join(__dirname, "beep.mp3"); // Add a beep sound file in your project directory
  console.log(soundFilePath),"soundFilePath"
  player.play(soundFilePath, (err) => {
    if (err) console.error("Error playing sound:", err);
  });

    // Get the primary display's native resolution
    const { width, height } = screen.getPrimaryDisplay().size;
    console.log(`Screen resolution: ${width}x${height}`);
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width, height }, // Set thumbnailSize to native resolution
    });

    const screenSource = sources[0]; // Assuming the first source is the main screen

    if (screenSource) {
      console.log("Screen source found. Capturing full-size screen.");
      const image = screenSource.thumbnail.toPNG(); // Captures the image at full resolution
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const screenshotPath = path.join(saveFolder, `screenshot-${timestamp}.png`);

      // Save the screenshot to the file system
      fs.writeFileSync(screenshotPath, image);
      screenshots.push(screenshotPath); // Add to array
      console.log(userToken, "userTokenuserToken")
      console.log(`Screenshot saved to: ${screenshotPath}`);
    } else {
      console.error("No screen source available.");
    }
  } catch (err) {
    console.error("Failed to take screenshot:", err);
  }
}

// Function to send screenshots to the API
async function sendScreenshotsToAPI() {
  console.log("Sending screenshots to API...");

  try {
    if (screenshots.length === 0) {
      console.log("No screenshots to send.");
      return;
    }

    // Validate existing files
    const validScreenshots = screenshots.filter((screenshotPath) => {
      if (fs.existsSync(screenshotPath)) {
        return true;
      } else {
        console.warn(`File does not exist: ${screenshotPath}. Skipping.`);
        return false;
      }
    });

    if (validScreenshots.length === 0) {
      console.log("No valid screenshots to upload.");
      return;
    }

    // Create a new FormData object
    const formData = new FormData();
    validScreenshots.forEach((screenshotPath, index) => {
      const fileStream = fs.createReadStream(screenshotPath); // Create a readable stream for each file
      formData.append(`images[${index}]`, fileStream, path.basename(screenshotPath));
    });

    // API headers
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${userToken}`,
      ...formData.getHeaders(), // Get headers generated by form-data
    };

    // Make the POST request to upload screenshots
    const response = await axios.post(
      "https://screenshot.rmcmgroup.in/api/upload-images",
      formData,
      { headers }
    );

    if (response.status === 200) {
      console.log("Screenshots successfully uploaded. Cleaning up...");

      // Delete only the screenshots that were successfully uploaded
      validScreenshots.forEach((screenshotPath) => {
        try {
          fs.unlinkSync(screenshotPath); // Delete the file
          console.log(`Deleted screenshot: ${screenshotPath}`);
        } catch (err) {
          console.error(`Failed to delete screenshot: ${screenshotPath}`, err);
        }
      });

      // Update screenshots array to remove uploaded files
      screenshots = screenshots.filter(
        (screenshotPath) => !validScreenshots.includes(screenshotPath)
      );
    } else {
      console.error("Failed to upload screenshots:", response.statusText);
    }
  } catch (err) {
    console.error("Error sending screenshots to API:", err.message);
  }
}
// Handle login request
ipcMain.handle("user:login", async (event, credentials) => {
  try {
    const response = await axios.post("https://screenshot.rmcmgroup.in/api/login", credentials);
    console.log(response)
    if (response.data) {
      userToken = response.data.token; // Save token globally
      userData = response.data.user; // Save user data globally

      // Notify renderer of success
      mainWindow.webContents.send("login-success", userData);
      console.log("first")
      // Redirect to home page
      mainWindow.loadFile(path.join(__dirname, "app", "attendance-employee.html"));
    } else {
      mainWindow.webContents.send("login-failed", response.data.message || "Login failed.");
    }
  } catch (error) {
    console.error("Login failed:", error.message || error);
    mainWindow.webContents.send("login-failed", "Login failed. Please try again.");
  }
});

// Handle getting screenshots dynamically from the user's screenshot directory or app directory
ipcMain.handle('get-screenshots', () => {
  const screenshotFolder = path.join(app.getPath('userData'), 'screenshots');
  const screenshotPaths = [];

  if (fs.existsSync(screenshotFolder)) {
    const files = fs.readdirSync(screenshotFolder);
    files.forEach((file) => {
      if (file.endsWith('.png')) {
        screenshotPaths.push(path.join(screenshotFolder, file));  // full absolute path
      }
    });
  }

  return screenshotPaths;  // Return full paths to the renderer
});
// Handle logout
ipcMain.on("user:logout", () => {
  userToken = null;
  userData = null;
  mainWindow.loadFile(path.join(__dirname, "app", "signin.html")); // Redirect to login page
});

// Handle user status request
ipcMain.handle("user:get", () => {
  return { isLoggedIn: !!userToken, user: userData };
});



