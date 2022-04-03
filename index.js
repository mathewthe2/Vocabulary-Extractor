let $ = s => document.querySelector(s);
let worker = new Worker("worker.js");
let nextId = 1;
let currentResults = [];

const symbols = '*，! " # $ % & ( ) * + , - . / : ; < = > ? @ [ \ ] ^ _ ` { | } ~'

function isNumeric(value) {
    return value.match(/[０-９]/g) || value.match(/[0-9]/g)
}

function showInterface() {
    $("#setup").hidden = true;
    $("#main").hidden = false;
}

rma_ja = new RakutenMA(model_ja);
rma_ja.featset = RakutenMA.default_featset_ja;
rma_ja.hash_func = RakutenMA.create_hash_func(15);

showInterface()

$("#files").addEventListener("change", async ev => {
    let files = [];
    for (let i = 0; i < ev.target.files.length; i++) {
      files.push(ev.target.files.item(i));
    }
    submit(files);
});

$('#download').addEventListener('click', ()=>{
    const rows = getRows();
    let csvContent = "data:text/csv;charset=utf-8," 
        + rows.map(e => e.join(",")).join("\n");

    var encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
})

function getRows() {
    return currentResults.map(result=>{
        if (result?.length > 0) {
            const basicForm = result.split(" ")[0];
            const reading = result.includes('[') ? result.split("[")[1]?.split("]")[0] : '';
            const pos = result.split("(")[1]?.split(")")[0];
            const glossary = result.split(") ")[1];
            return [basicForm === undefined ? '' : basicForm,
            reading === undefined ? '' : reading,
            pos === undefined ? '' : pos,
            glossary === undefined ? '' : glossary]
        }
    })
}

function submit(files) {
    files.forEach(f => addFiles([f]));
}

function addFiles(files) {
    let id = nextId++;
    let cmd = { id: id, opts: null };
    if (files.length == 1) {
      cmd.action = "addFile";
      cmd.file = files[0];
    } else {
      cmd.action = "addFiles";
      cmd.files = files;
    }
    $('#processing').hidden = false;
    worker.postMessage(cmd);
}

function isNoun(token) {
    if (token.length > 1) {
        if (token[1].length > 0) {
            return token[1][0] === 'N'
        }
    }
    return false
}

worker.onmessage = function(e) {
    let result = e.data;
    const results = new Set();
    result.lines?.forEach(line=>{
        var tokens = rma_ja.tokenize(HanZenKaku.hs2fs(HanZenKaku.hw2fw(HanZenKaku.h2z(line))))
        tokens.forEach(token=>{
            if (isNoun(token) && !symbols.includes(token[0]) && !isNumeric(token[0])) {
                const translationObject = rcxData.translate(token[0]) 
                translation = translationObject?.data[0][0];

                if (translation !== undefined) {
                    results.add(translation)
                }
            }
        })
    })
    currentResults = Array.from(results);
    $('#processing').hidden = true;
    $("#output").innerText = currentResults.join('\n');
    $("#download").disabled = false;
  }