var ASSET_TYPE = 'text';

var EventHandler       = require('../Events/EventHandler');

var TextLoader  = {};
var Storage  = {};

TextLoader.eventInput      = new EventHandler();
TextLoader.eventOutput     = new EventHandler();

EventHandler.setInputHandler(TextLoader, TextLoader.eventInput);
EventHandler.setOutputHandler(TextLoader, TextLoader.eventOutput);

TextLoader.load = function load(asset)
{
    var source = asset.source;
    if (!Storage[source])
    {
        var request = new XMLHttpRequest();
        request.open('GET', source);
        request.onreadystatechange = function(response){
            if(response.currentTarget.readyState === 4) {
                Storage[source] = response.currentTarget.responseText;
                finishedLoading(source);
            }
        }
        request.send();
    }
};

TextLoader.get  = function get(source)
{
    return Storage[source];
};

TextLoader.toString = function toString()
{
    return ASSET_TYPE;
};

function finishedLoading(source)
{
    TextLoader.eventOutput.emit('doneLoading', {source: source, type: ASSET_TYPE});
}

module.exports = TextLoader;