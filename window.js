const puppeteer = require('puppeteer');
const pLimit = require('p-limit');

let limit = pLimit(3);
let pathForSavedScreenshot = "";
let resolutionX = 1920;
let resolutionY = 1080;

function go() {
  if(document.getElementById('path-output').innerText === ''){
    selectOutputFolder();
    return;
  }

  if(document.getElementById('urls-input').value === '')
  {
    alert("Add urls please.");
    return;
  }

  if(!document.getElementById('proxy-switcher').checked){
      if(document.getElementById('password').value === '')
      {
        alert("Input proxy password please.");
        return;
      }
      if(document.getElementById('username').value === '')
      {
        alert("Add proxy username please.");
        return;
      }
  }

  let resolution = document.getElementById("resolution-list");
  let screenResolution = resolution.options[resolution.selectedIndex].text;
  resolutionX = parseInt(screenResolution.split('x')[0]);
  resolutionY = parseInt(screenResolution.split('x')[1]);
  pathForSavedScreenshot = document.getElementById('path-output').innerText;
  limit = pLimit(parseInt(document.getElementById("speed-input-field").value));
  runBrowser().then(r => '');
}

async function runBrowser() {

  const browser = await puppeteer.launch({
    //args: ['--proxy-server=http://192.164.1.1:8080'],
    //headless: false
    });
  //TODO: handle proxy !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  const page = await browser.newPage();
  await page.authenticate({password:'12qwaszX', username:'user734'});
  await page.goto('http://google.by', {waitUntil: 'networkidle2'})
  await page.close();

  let arrayOfUrls = document.getElementById('urls-input').value.split('\n');
  let promises = [];
  for(let i = 0; i < arrayOfUrls.length; i++){
    let name = getNameForPngByUrl(arrayOfUrls[i]);
    promises.push(limit(makeScreenshotByUrl,browser, i + 1, arrayOfUrls[i], name));
  }

  await Promise.all(promises);
  //await browser.close();
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
  //await page.authenticate({password:'12qwasZXC', user:'user734'});

  await page.screenshot({path: require('path').join(pathForSavedScreenshot, indexNumber + '. ' +screenshotFilename+'.png')});
  await page.close();
  document.getElementById('urls-left-count').innerText = limit.pendingCount.toString()
}

function getNameForPngByUrl(url) {
  return url.replace(/\//gi,'').replace(/:/gi,'').replace(/\?/gi,'').substring(0,100);
}

function selectOutputFolder() {
  let dialogSyncResult = require('electron').remote.dialog.showOpenDialogSync({properties: ['openDirectory']});
  if(dialogSyncResult !== undefined)
    document.getElementById('path-output').innerText = dialogSyncResult.toString();
}

function proxySwitch() {
  if(document.getElementById('proxy-switcher').checked){
    document.getElementById('username').disabled = true;
    document.getElementById('password').disabled = true;
  }
  else{
  document.getElementById('username').disabled = false;
  document.getElementById('password').disabled = false;
  }
}
