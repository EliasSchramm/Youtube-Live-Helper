const list_url='https://api.eps-dev.de:42070/list/all';
const detail_url='https://api.eps-dev.de:42070/get/?'

const STYLE = 
`
@import url("https://fonts.googleapis.com/css?family=Poppins:300,400,500,600,700,800,900&display=swap");

.eps{
    background: #aca7cb;    

    padding:3%; 
    margin-bottom: 3%;     
    border-radius:5px;

    font-family: 'Poppins';
    font-size: 1.5em;
    color: #000;    
}

.eps h1{
    text-align: center;
    font-size: 2em;
}

.eps h2{
    text-align: center;
    font-size: 1.6em;
    padding: 2%;
}

.eps ul{
    text-align: center;
    list-style-type: none;
    padding: 0;
    margin: 0;
}
`;

var HTML = 
`
<h1>Stream Stats</h1>
<p>Messages Total: $mgs_total</p>
<p>Average Messages Per Minute: $mgs_pm</p>
<h2>Top 3 Used languages:</h2>
<ul>
    <li>1. $l_0</li>
    <li>2. $l_1</li>
    <li>3. $l_2</li>
</ul> 
`

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

function getStreamDetails(){
    return new Promise((resolve, reject) => {
        fetch(detail_url.replace("?", getCurrentID()))
        .then(response => response.json())
        .then(data => {
            var details = {
                mgs_total: 0,
                avg_mgs_pm: Math.round(data.avg_mgs_per_min),
                lang: []
            }

            let total_identified = 0;
            let lang_map = new Map();

            data.msg_times.forEach((i) => {
                details.mgs_total += i.count;
                
                let map = new Map(Object.entries(i.langs));
                
                map.forEach((v, k) => {                             
                        if(lang_map.has(k)){
                            lang_map.set(k, lang_map.get(k) + v)
                        }else{
                            lang_map.set(k, v)
                        }

                        total_identified += v;
                })                      
            })             

            lang_map = new Map([...lang_map.entries()].sort((a, b) => b[1] - a[1]))
            details.lang = Array.from(lang_map.keys())

            resolve(details)
        });
    })
}

function insertStyle(){
    let head = document.getElementsByTagName("head")[0]
    head.append(htmlToElement("<style>?</style>".replace("?", STYLE)))
}

isLivestream().then((r) => {
    console.log(r);
    if(r) {        
        getStreamDetails().then((details) => {
            insertStyle();

            let secondary = document.getElementById("secondary-inner");
            let ln = new Intl.DisplayNames(['en'], {type: 'language'});

            HTML = HTML.replace("$mgs_pm", details.avg_mgs_pm)
            HTML = HTML.replace("$mgs_total", details.mgs_total)
            HTML = HTML.replace("$l_0", ln.of(details.lang[0]))
            HTML = HTML.replace("$l_1", ln.of(details.lang[1]))
            HTML = HTML.replace("$l_2", ln.of(details.lang[2]))

            secondary.insertBefore(htmlToElement("<div class=\"eps\">?</div>".replace("?", HTML)), secondary.firstChild);
        })        
    }
})