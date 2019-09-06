const puppeteer = require('puppeteer');
const pLimit = require('p-limit');

var limit = pLimit(3);
var pathForSavedScreenshot = "";
var screenResolution = "1920x1080";
var resolutionX = 1920;
var resolutionY = 1080;

function go() {
  if(document.getElementById('path-output').innerText == ''){
    selectOutputFolder();
    return;
  }
  if(document.getElementById('urls-input').value == '')
  {
    alert("Add urls please.");
    return;
  }

  var resolution = document.getElementById("resolution-list");
  screenResolution = resolution.options[resolution.selectedIndex].text;
  resolutionX = parseInt(screenResolution.split('x')[0]);
  resolutionY = parseInt(screenResolution.split('x')[1]);
  pathForSavedScreenshot = document.getElementById('path-output').innerText;
  limit = pLimit(parseInt(document.getElementById("speed-input-field").value));
  runBrowser();
}

async function runBrowser() {
//TODO: add proxy support, add in UI too https://github.com/GoogleChrome/puppeteer/issues/336, https://stackoverflow.com/questions/52777757/how-to-use-proxy-in-puppeteer-and-headless-chrome
  const browser = await puppeteer.launch({headless: true});

  var arrayOfUrls = document.getElementById('urls-input').value.split('\n');
  var promises = [];
  for(var i = 0; i < arrayOfUrls.length; i++){
    var name = getNameForPngByUrl(arrayOfUrls[i]);
    promises.push(limit(makeScreenshotByUrl,browser, i + 1, arrayOfUrls[i], name));
  }

  await Promise.all(promises);
  await browser.close();
  alert("You are welcome!")
}

async function makeScreenshotByUrl(browser, indexNumber, url, screenshotFilename) {
  const page = await browser.newPage();
  await page.setViewport({
    width: resolutionX,
    height: resolutionY,
    deviceScaleFactor: 1,
  });
  try {
    await Promise.race([
      page.goto(url, {waitUntil: 'networkidle2'}),
        new Promise(x => require('electron').remote.getGlobal('setTimeout')(x, 30000).unref()),
    ]);
  }
  catch (e) {
    alert('Error ' + e + ' URL:' + url)
  }
  await page.screenshot({path: require('path').join(pathForSavedScreenshot, indexNumber + '. ' +screenshotFilename+'.png')});
  await page.close();
  document.getElementById('urls-left-count').innerText = limit.pendingCount.toString()
}

function getNameForPngByUrl(url) {
  return url.replace(/\//gi,'').replace(/\:/gi,'').replace(/\?/gi,'').substring(0,100);
}

function selectOutputFolder() {
  var t = require('electron').remote.dialog.showOpenDialogSync({ properties: ['openDirectory']})
  if(t!= undefined)
    document.getElementById('path-output').innerText = t.toString();
}
