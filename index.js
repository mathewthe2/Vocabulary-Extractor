let $ = s => document.querySelector(s);
let worker = new Worker("worker.js");
let segementer = null;
// kuromoji.builder({ dicPath: "kuromoji/dict/" }).build(function (err, tokenizer) {
//     segementer = tokenizer;
//     showInterface();
// });
let nextId = 1;
let currentResults = [];

const symbols = '*，! " # $ % & ( ) * + , - . / : ; < = > ? @ [ \ ] ^ _ ` { | } ~0123456789０１２３４５６７８９'

function showInterface() {
    $("#setup").hidden = true;
    $("#main").hidden = false;
}

console.log('hello')

rma_ja = new RakutenMA(model_ja);
rma_ja.featset = RakutenMA.default_featset_ja;
rma_ja.hash_func = RakutenMA.create_hash_func(15);

showInterface()

// const text = '彼は新しい仕事できっと成功するだろう'

// tokens = rma_ja.tokenize(HanZenKaku.hs2fs(HanZenKaku.hw2fw(HanZenKaku.h2z(text))));
// console.log(tokens)

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
        // var tokens = segementer.tokenize(line);
        var tokens = rma_ja.tokenize(HanZenKaku.hs2fs(HanZenKaku.hw2fw(HanZenKaku.h2z(line))))
        console.log(tokens)
        tokens.forEach(token=>{
            if (isNoun(token) && !symbols.includes(token[0])) {
            // if (token.pos === "名詞" && !symbols.includes(token.basic_form)) {
                // const translationObject = rcxData.translate(token.basic_form) 
                const translationObject = rcxData.translate(token[0]) 
                translation = translationObject?.data[0][0];

                if (translation !== undefined) {
                    results.add(translation)
                }
            }
        })
    })
    currentResults = Array.from(results);
    $("#output").innerText = currentResults.join('\n');
    $("#download").disabled = false;
  }