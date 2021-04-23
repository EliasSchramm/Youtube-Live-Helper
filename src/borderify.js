const list_url='https://api.eps-dev.de:42070/list/all';
const detail_url='https://api.eps-dev.de:42070/get/?'

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
    background: rgb(2,0,36);
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

var STREAMS = undefined;
var LAST_ID = "";

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

function getCurrentDuration(){
    let ele = document.getElementsByClassName('ytp-time-duration')[0]
    let _content = ele.innerHTML.split(":")
    return (parseInt(_content[0]) * 60 * 60 + parseInt(_content[1]) * 60 + parseInt(_content[2])) * 1000
}

function getCurrentID(){
    let url = window.location.href
    url = url.split("watch?v=")[1]
    url = url.slice(0,11);

    return url;
}

function isLivestream(){    
    return new Promise((resolve, reject) => {
        if(STREAMS === undefined){
            getStreamsInDatabase().then(r => {
                let id = LAST_ID
                STREAMS = r;
                resolve(r.includes(id))                
            })
        }else{
            resolve(STREAMS.includes(LAST_ID))
        }
    })
}

function array_avg(array){
    i = 0;

    array.forEach(x => {
        i += x
    })

    return i / array.length
}

function getStreamDetails(){
    return new Promise((resolve, reject) => {
        fetch(detail_url.replace("?", LAST_ID))
        .then(response => response.json())
        .then(data => {

            var details = {
                mgs_total: 0,
                avg_mgs_pm: Math.round(data.avg_mgs_per_min),
                lang: [],
                lang_p: [],
                highlights: []
            }

            let total_identified = 0;
            let lang_map = new Map();


            let first_msg = data.date
            let length = getCurrentDuration()
            let last = [0,0,0,0,0,0,0,0,0,0]

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

                        if(i.count > array_avg(last) * 5){
                            details.highlights.push((Date.parse(i.time) - first_msg))
                        }

                        last.push(i.count)
                        last.shift()                        
                })                 
            })             

            lang_map = new Map([...lang_map.entries()].sort((a, b) => b[1] - a[1]))
            details.lang = Array.from(lang_map.keys())
            details.lang_p = Array.from(lang_map.values())

            details.lang_p[0] = (details.lang_p[0]/total_identified*100).toPrecision(2)
            details.lang_p[1] = (details.lang_p[1]/total_identified*100).toPrecision(2)
            details.lang_p[2] = (details.lang_p[2]/total_identified*100).toPrecision(2)

            let interpoled = []
            let _last = 0
            
            let t = []

            details.highlights.forEach((x) => {
                if((x - 1000 * 60) > _last){
                    interpoled.push([(x - 1000 * 30)/length, (x + 1000 * 30)/length])
                    _last = x;
                    t.push([(x - 1000 * 30), (x + 1000 * 30)])
                }
            })
            console.log(t)
            console.log(interpoled);
            details.highlights = interpoled;

            resolve(details)
        });
    })
}

function insertStyle(){
    let head = document.getElementsByTagName("head")[0]
    head.append(htmlToElement("<style>?</style>".replace("?", STYLE)))
}

function insertYT_BAR_STYLE(points){
    let gradient_config = ""
    let last_endpoint = 0;

    points.forEach(point => {
        let startpoint = Math.max(0 , point[0]) * 100
        let endpoint = Math.min(0.9999999999 , point[1]) * 100

        gradient_config += YT_BAR_COLOR + " " + last_endpoint + "%" + " " + startpoint + "%, \n"
        gradient_config += HIGHLIGHTIN_COLOR + " " + startpoint + "%" + " " + endpoint + "%, \n"
        
        last_endpoint = endpoint;
    })   

    gradient_config += YT_BAR_COLOR + " " + last_endpoint + "%" + " 100%"
    let head = document.getElementsByTagName("head")[0]
    head.append(htmlToElement("<style>?</style>".replace("?", YT_BAR_STYLE.replace("?", gradient_config))))
}


function remove(){
    let ele = document.getElementsByClassName("eps")
    if(ele.length != 0){
        ele[0].remove()
    }
}

function refresh(){
    if(getCurrentID() != LAST_ID || document.getElementsByClassName("eps").length === 0){        
        LAST_ID = getCurrentID()

        isLivestream().then((r) => {                
            if(r) {          
                getStreamDetails().then((details) => { 
                    remove()
                    let secondary = document.getElementById("secondary-inner");
                    let ln = new Intl.DisplayNames(['en'], {type: 'language'});

                    insertYT_BAR_STYLE(details.highlights)

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
            }else remove()

        })
        
    }    
}

insertStyle();
refresh()
setInterval(refresh, 500)