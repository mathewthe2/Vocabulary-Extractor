let reader = new FileReaderSync();

async function addFiles(id, files, opts) {
    // TODO
}

async function addFile(id, file, opts) {
    try {
    let text = reader.readAsText(file);
    const lines = text.split(/[\r\n]+/g);
    postMessage({lines: lines});
    } catch (e) {
      postMessage({id: id, error: e});
    }
}

onmessage = async ev => {
    if (ev.data.action == "addFile")
      await addFile(ev.data.id, ev.data.file, ev.data.opts);
    else if (ev.data.action == "addFiles")
      await addFiles(ev.data.id, ev.data.files, ev.data.opts);
    else
      throw "unknown action " + ev.data.action;
  };