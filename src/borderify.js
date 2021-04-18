const list_url='https://api.eps-dev.de:42070/list/all';

function getStreamsInDatabase(){
    return new Promise((resolve, reject) => {
        fetch(list_url)
        .then(response => response.json())
        .then(data => {

            let list = []

            data.forEach((i) => {
                list.push(i.stream_id);
            })
            resolve(list)
        });
    })
}

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}

function getCurrentID(){
    let url = window.location.href
    url = url.split("watch?v=")[1]
    url = url.slice(0,11);

    return url;
}

function isLivestream(){    
    return new Promise((resolve, reject) => {
        getStreamsInDatabase().then(r => {
            let id = getCurrentID()
            resolve(r.includes(id))
        })
    })
}

isLivestream().then((r) => {
    console.log(r);
    if(r) {
        
        let secondary = document.getElementById("secondary-inner");
        secondary.insertBefore(htmlToElement("<div style=\"background:white; padding:3%; margin-bottom: 3%; border-radius:10px;\"><h1>Hallo ich bin ein text</h1></div>"), secondary.firstChild);
        console.log(111111);
    }
})