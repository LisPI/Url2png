const puppeteer = require('puppeteer');
const pLimit = require('p-limit');
const limit = pLimit(2);

var pathForSavedScreenshot = ""

function go() {
  if(document.getElementById('path-output').innerText == ''){
    selectOutputFolder();
  }
  if(document.getElementById('urls-input').value == '')
  {
    alert("Add urls please.")
    return
  }
  pathForSavedScreenshot = document.getElementById('path-output').innerText
  runBrowser();
}

async function runBrowser() {
  // var t = { p : 0};
  // Object.observe('t', function (id, oldval, newval) {
  //   document.getElementById('active-count').innerText = newval.toString();
  //   return newval;
  // });


  const browser = await puppeteer.launch({headless: true});

  var arrayOfUrls = document.getElementById('urls-input').value.split('\n');
  var promises = []
  for(var i = 0; i < arrayOfUrls.length; i++){
    var name = getNameForPngByUrl(arrayOfUrls[i]);
    promises.push(limit(makeScreenshotByUrl,browser, i + 1, arrayOfUrls[i], name));
  }



  await Promise.all(promises)
  await browser.close();
}

async function makeScreenshotByUrl(browser, indexNumber, url, screenshotFilename) {
  const page = await browser.newPage();
  await page.setViewport({
    width: 1280,
    height: 720,
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
}

function getNameForPngByUrl(url) {
  return url.replace(/\//gi,'').replace(/\:/gi,'').replace(/\?/gi,'');
}

function selectOutputFolder() {
  var t = require('electron').remote.dialog.showOpenDialogSync({ properties: ['openDirectory']})
  document.getElementById('path-output').innerText = t.toString();
}
