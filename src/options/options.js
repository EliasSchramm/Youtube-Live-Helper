function saveOptions(e) {
  e.preventDefault();
  browser.storage.sync.set({
    servers: document.querySelector("#servers").value
  });
}

function restoreOptions() {

  function setCurrentChoice(result) {
    document.querySelector("#servers").innerHTML = result.servers || "api.eps-dev.de:42070;";
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  let getting = browser.storage.sync.get("servers");
  getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);


