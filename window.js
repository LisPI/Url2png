$(() => {
})

function makeScreenshotByUrl(indexNumber, url, screenshotFilename) {
  const puppeteer = require('puppeteer');

  (async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
    });
    await Promise.race([
      page.goto(url, {waitUntil: 'networkidle2'}),
      new Promise(x => require('electron').remote.getGlobal('setTimeout')(x, 30000).unref()),
    ]);

    //await page.goto(contents);
    //await page.waitForNavigation({ waitUntil: 'networkidle0' })
    await page.screenshot({path: require('path').join(document.getElementById('path-output').innerText, indexNumber + '. ' +screenshotFilename+'.png')});

    await browser.close();
  })();
}

function getNameForPngByUrl(url) {
  return url.replace(/\//gi,'').replace(/\:/gi,'').replace(/\?/gi,'');
}

function go() {
  if(document.getElementById('path-output').innerText == ''){
    selectOutputFolder();
  }
  if(document.getElementById('urls-input').value == '')
  {
    alert("Add urls please.")
    return
  }
  var arrayOfUrls = document.getElementById('urls-input').value.split('\n');
  for(var i = 0; i < arrayOfUrls.length; i++){
    var name = getNameForPngByUrl(arrayOfUrls[i]);
    makeScreenshotByUrl(i+1, arrayOfUrls[i], name);
  }
}

function selectOutputFolder() {
  var t = require('electron').remote.dialog.showOpenDialogSync({ properties: ['openDirectory']})
  document.getElementById('path-output').innerText = t.toString();
}
