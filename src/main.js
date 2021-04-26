const list_url = 'https://<server>/list/all';
const detail_url = 'https://<server>/get/?';

const YT_BAR_COLOR = "#2f4858"
const HIGHLIGHTIN_COLOR = "#FF0000"

const STYLE =
    `
@import url("https://fonts.googleapis.com/css?family=Roboto:300,400,500,600,700,800,900&display=swap");

.eps{
    background: #181818;   
    
    padding:3%; 
    margin-bottom: 3%;     

    border-radius:1px;

    font-family: 'Roboto';
    font-size: 1.5em;
    color: #ffffff;    
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

const YT_BAR_STYLE =
    `
.ytp-progress-list{
    background: linear-gradient(to right, 
        ?
    );
}
`

var HTML =
    `
<h1>Stream Stats</h1>
<p>Messages Total: $mgs_total</p>
<p>Average Messages Per Minute: $mgs_pm</p>
<h2>Top 3 Used languages:</h2>
<ul>
    <li>1. $l_0 ($p_0%)</li>
    <li>2. $l_1 ($p_1%)</li>
    <li>3. $l_2 ($p_2%)</li>
</ul> 
<p>ID: $id</p>
`
var SERVERS = []
var STREAMS = undefined;
var LAST_ID = "";

async function getServers() {
    function get(result) {
        var ret = result.servers || "api.eps-dev.de:42070;"
        SERVERS = ret.split(";")
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getting = browser.storage.sync.get("servers");
    await getting.then(get, onError);
}

function getStreamsInDatabase() {

    return new Promise(async (resolve, reject) => {
        getServers().then(() => {
            //This whole thing is utterly retarded. But it took me 2 hours to get working. I. HATE. JAVA SCRIPT. 
            //Why the hell is it possible that something just decides "oh btw I am async" 

            new Promise(async (res, rej) => {
                let raw_list = []
                while(SERVERS.length != 0){     
                    let server = SERVERS.pop()            
                    fetch(list_url.replace("<server>",server))
                            .then(response => response.json())
                            .then(data => {   
                                data.forEach((id) => {
                                    if(!raw_list.includes(id["stream_id"])){
                                        raw_list.push(server)
                                        raw_list.push(id["stream_id"])
                                    }
                                })                                
                                if(SERVERS.length === 0) res(raw_list)
                            })
                }         
            }).then((raw_list) => {
                resolve(raw_list);
            })
        })
    })
}

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}

function getCurrentID() {
    let url = window.location.href
    url = url.split("watch?v=")[1]
    url = url.slice(0, 11);

    return url;
}

function isLivestream() {
    return new Promise((resolve, reject) => {
        if (STREAMS === undefined) {
            getStreamsInDatabase().then(r => {
                let id = LAST_ID
                STREAMS = r;
                resolve(r.includes(id))
            })
        } else {
            resolve(STREAMS.includes(LAST_ID))
        }
    })
}

function getStreamDetails() {
    return new Promise((resolve, reject) => {     
          fetch(detail_url.replace("?", LAST_ID).replace("<server>", STREAMS[STREAMS.indexOf(LAST_ID) - 1]))
            .then(response => response.json())
            .then(data => {
                resolve(data)
            });
    })
}

function insertStyle() {
    let head = document.getElementsByTagName("head")[0]
    head.append(htmlToElement("<style>?</style>".replace("?", STYLE)))
}

function insertYT_BAR_STYLE(points) {
    let gradient_config = ""
    let last_endpoint = 0;

    points.forEach(point => {
        let startpoint = Math.max(0, point[0]) * 100
        let endpoint = Math.min(0.9999999999, point[1]) * 100

        gradient_config += YT_BAR_COLOR + " " + last_endpoint + "%" + " " + startpoint + "%, \n"
        gradient_config += HIGHLIGHTIN_COLOR + " " + startpoint + "%" + " " + endpoint + "%, \n"

        last_endpoint = endpoint;
    })

    gradient_config += YT_BAR_COLOR + " " + last_endpoint + "%" + " 100%"
    let body = document.getElementsByTagName("body")[0]
    body.append(htmlToElement("<style class=\"eps\">?</style>".replace("?", YT_BAR_STYLE.replace("?", gradient_config))))
}

function remove() {
    let ele = document.getElementsByClassName("eps")

    if (ele.length != 0) {
        for (var i = ele.length - 1; i >= 0; --i) {
            ele[i].remove();
        }
    }
}

function refresh() {
    if (getCurrentID() != LAST_ID || document.getElementsByClassName("eps").length === 0) {
        LAST_ID = getCurrentID()

        isLivestream().then((r) => {
            if (r) {
                getStreamDetails().then((details) => {
                    remove()
                    let secondary = document.getElementById("secondary-inner");
                    let ln = new Intl.DisplayNames(['en'], { type: 'language' });

                    insertYT_BAR_STYLE(details.highlights[4])

                    let _HTML = HTML;
                    _HTML = _HTML.replace("$mgs_pm", details.avg_mgs_pm)
                    _HTML = _HTML.replace("$mgs_total", details.mgs_total)
                    _HTML = _HTML.replace("$l_0", ln.of(details.lang[0]))
                    _HTML = _HTML.replace("$l_1", ln.of(details.lang[1]))
                    _HTML = _HTML.replace("$l_2", ln.of(details.lang[2]))
                    _HTML = _HTML.replace("$p_0", details.lang_p[0])
                    _HTML = _HTML.replace("$p_1", details.lang_p[1])
                    _HTML = _HTML.replace("$p_2", details.lang_p[2])
                    _HTML = _HTML.replace("$id", LAST_ID)

                    secondary.insertBefore(htmlToElement("<div class=\"eps\">?</div>".replace("?", _HTML)), secondary.firstChild);
                })
            } else remove()

        })

    }
}

insertStyle();
refresh()
setInterval(refresh, 500)