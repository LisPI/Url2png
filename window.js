const puppeteer = require('puppeteer');
const pLimit = require('p-limit');
const getUrls = require('get-urls');

let limit = pLimit(3);
let pathForSavedScreenshot = "";
let resolutionX = 1920;
let resolutionY = 1080;

$(function() {
    proxyCheck().then(r => "")

});

async function proxyCheck() {
    const browser = await puppeteer.launch({});
    const page = await browser.newPage();
    let response = await page.goto('http://google.by', {waitUntil: 'networkidle2'});
    let headers = response.headers();
    for(let prop in headers) {
        //if(prop == "status" && headers[prop] == 200  )
        //    alert("Its OK")
        if(prop === "proxy-authenticate" )
            addProxySettingsElements();
    }
    await page.close();
    await browser.close();
}

function addProxySettingsElements() {
    document.getElementById('div-in-proxy-row').className = "col-xs-6 col-sm-6 col-md-6 col-lg-6";
    let proxyDiv = document.createElement('div');
    proxyDiv.className = "col-xs-6 col-sm-6 col-md-6 col-lg-6";
    proxyDiv.innerHTML = '<h3 class="url2png-heading">Proxy settings</h3>\n' +
        '<input class="text-input form-control" type="text" id="username" placeholder="Enter username">\n' +
        '<input class="text-input form-control" type="password" id="password" placeholder="Enter password">';
    document.getElementById('row-with-proxy').appendChild(proxyDiv);
}

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

  if(document.getElementById('password') !== null){
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

  if(document.getElementById('password') !== null) {
      const page = await browser.newPage();
      await page.authenticate({password: document.getElementById('password').value, username: document.getElementById('username').value});
      let response = await page.goto('http://google.by', {waitUntil: 'networkidle2'});
      let headers = response.headers();
      for(let prop in headers) {
          if(prop === "proxy-authenticate" )
          {
              alert("Error. Check proxy user/password");
              browser.close();
              return;
          }
      }
      await page.close();
  }

  let urlsSet = getUrls(document.getElementById('urls-input').value);
  let arrayOfUrls = Array.from(urlsSet);
  let promises = [];
  for(let i = 0; i < arrayOfUrls.length; i++){
    let name = getNameForPngByUrl(arrayOfUrls[i]);
    promises.push(limit(makeScreenshotByUrl,browser, i + 1, arrayOfUrls[i], name));
  }

  document.getElementById('urls-left-count').innerText = (limit.activeCount + limit.pendingCount).toString();
  await Promise.all(promises);
  document.getElementById('urls-left-count').innerText = (limit.activeCount + limit.pendingCount).toString();
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
  document.getElementById('urls-left-count').innerText = (limit.activeCount + limit.pendingCount).toString();
}

function getNameForPngByUrl(url) {
  return url.replace(/\//gi,'').replace(/:/gi,'').replace(/\?/gi,'').substring(0,100);
}

function selectOutputFolder() {
  let dialogSyncResult = require('electron').remote.dialog.showOpenDialogSync({properties: ['openDirectory']});
  if(dialogSyncResult !== undefined)
    document.getElementById('path-output').innerText = dialogSyncResult.toString();
}
