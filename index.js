"use strict";

const {
  keyboard,
  Key,
  mouse,
  left,
  right,
  up,
  down,
  screen,
  sleep,
} = require("@nut-tree/nut-js");
const os = require("os");

const CHECK_WORKER_STATS_EVERY_MINUTES = 15;

async function delay(seconds) {
  console.log(`Awaiting ${seconds} seconds`);
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function logAction(action) {
  console.log(`======================================== ${action} ========================================`);
}

async function awaitAndClickOnImage(
  imagePath,
  timeoutInSeconds,
  confidence = 0.9,
  corner = false
) {
  console.log("Awaiting for:", imagePath);
  console.log(`Time-out in ${timeoutInSeconds} seconds`);
  const element = await screen.waitFor(imagePath, 1000 * timeoutInSeconds, {
    confidence,
  });
  const x = randomInteger(1, 3) + element.left + element.width / 2;
  const y = randomInteger(1, 3) + element.top + element.height / 2;

  const realX = corner ? x - 13 : x;
  const realY = corner ? y - 13 : y;

  await mouse.move([
    {
      x: realX,
      y: realY,
    },
  ]);
  await delay(0.1);
  await mouse.leftClick();
  await delay(0.1);
  console.log("Found and clicked:", imagePath);
}

async function startPve() {
  await awaitAndClickOnImage("./images/start-pve-button.png", 30);
}

async function isImagePresent(imagePath, confidence = 0.91) {
  try {
    console.log("checking if image is present:", imagePath);
    await screen.find(imagePath, { confidence });
    console.log("Found");
    return true;
  } catch (e) {
    console.log("Not Found");
    return false;
  }
}

async function makeHeroesGoToWork() {
  try {
    while (await isImagePresent("./images/hero-go-work-button.png", 0.96)) {
      await awaitAndClickOnImage(
        "./images/hero-go-work-button.png",
        3,
        0.96,
        true
      );
      await delay(0.4);
    }
  } catch (error) {
    throw new Error("Restart game flow");
  }
}

async function dragDownHeroSelection() {
  let x = 0;
  while (x < 4) {
    const element = await screen.waitFor(
      "./images/hero-selection-drag-bar.png",
      1000 * 4,
      {
        confidence: 0.9,
      }
    );
  
    const left = element.left + 100;
    const top = element.top + 10;
  
    await mouse.move([
      {
        x: left,
        y: top,
      },
    ]);
    await delay(0.5);
    const dragArray = [];
    for (let index = 0; index < 110; index++) {
      dragArray.push({
        x: left,
        y: top - index,
      });
    }
    await mouse.drag(dragArray);
    await delay(2);
    x++;
  }
}

async function playGame() {
  while (true) {
    try {
      await awaitAndClickOnImage(
        "./images/new-map-button.png",
        60 * CHECK_WORKER_STATS_EVERY_MINUTES,
        0.93
      );
    } catch (e) {
      console.log("New map button wasn't found. Checking heroes..");
      return;
    }
    await delay(1);
    console.log("Map defeated! Lets continue.");
    continue;
  }
}

async function putHeroesToWork() {
  await delay(1);
  await awaitAndClickOnImage("./images/back-to-menu-button.png", 20);
  await delay(1);
  await awaitAndClickOnImage("./images/heroes-menu-button.png", 10, 0.92);
  await delay(1);

  logAction("Scrolling Heroes");
  await dragDownHeroSelection();

  logAction("Clicking work buttons");
  await makeHeroesGoToWork();

  await awaitAndClickOnImage("./images/close-button.png", 10);
  await startPve();
}

async function connectWallet() {
  await delay(10);
  await awaitAndClickOnImage("./images/connect-wallet-button.png", 30);
  await delay(10);
  await awaitAndClickOnImage("./images/metamask-fox.png", 30);
  await delay(10);
  await awaitAndClickOnImage("./images/assinar-button.png", 30);
}

async function restartGame() {
  while (true) {
    try {
      await keyboard.pressKey(Key.LeftControl, Key.LeftShift, Key.R)
      await keyboard.releaseKey(Key.LeftControl, Key.LeftShift, Key.R)
      
      // refresh page on MAC
      if (os.platform() === "darwin")
        await awaitAndClickOnImage("./images/mac-restart-button.png", 30);
      
      await delay(7);
      if (await isImagePresent("./images/connect-wallet-button.png"))
        await connectWallet();
      else await awaitAndClickOnImage("./images/play-button.png", 30);

      //await mouse.move([{ x: 0, y: 0 }]);
      await delay(4);
      if (await isImagePresent("./images/ok-button.png", 0.92)) {
        console.log("Game error. Restarting...");
        continue;
      }
      await screen.waitFor("./images/start-pve-button.png", 1000 * 50);
      console.log("restarted!");
      return;
    } catch (e) {
      console.log(e);
      continue;
    }
  }
}

async function checkingIfGameIsInMainScreen() {
  try {
    await delay(3);
    if (await isImagePresent("./images/start-pve-button.png", 0.92)) {
      console.log("Game is in main screen.");
      return true;
    }
    console.log("Game is NOT in main screen. Restarting...");
    return false;
  } catch (e) {
    console.log(
      "Error checking if game is in main screen. Restarting..."
    );
    return false;
  }
}

async function checkForWrongWindow() {
  await delay(2);
  if (await isImagePresent("./images/close-button.png", 0.92)) {
    await awaitAndClickOnImage("./images/close-button.png", 4, 0.92);
    await delay(3);
  }
  if (await isImagePresent("./images/back-to-menu-button.png", 0.92)) {
    await awaitAndClickOnImage("./images/back-to-menu-button.png", 4, 0.92);
    await delay(3);
  }
  if (await isImagePresent("./images/ok-button.png", 0.92)) {
    await awaitAndClickOnImage("./images/ok-button.png", 4, 0.92);
    await delay(3);
  }
}

(async () => {
  while (true) {
    try {
      logAction("Checking if game is on main screen");
      const isMainScreen = await checkingIfGameIsInMainScreen();
      
      if (!isMainScreen) {
        logAction("Restarting game");
        await restartGame();
      }
      
      logAction("Putting heroes to work");
      await putHeroesToWork();

      logAction("Starting PVE");
      await startPve();

      logAction("Waiting for new map");
      await playGame();

    } catch (e) {
      console.log(e);
      await checkForWrongWindow();
      continue;
    }
  }
})();
