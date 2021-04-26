function openPage() {
browser.tabs.create({
    url: "options/options.html"
});
}

browser.browserAction.onClicked.addListener(openPage);
/*
  function onOpened() {
    console.log(`Options page opened`);
  }
  
  function onError(error) {
    console.log(`Error: ${error}`);
  }
  
  var opening = browser.runtime.openOptionsPage();
  opening.then(onOpened, onError);*/