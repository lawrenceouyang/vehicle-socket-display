/**
 * Created by Lawrence.Ouyang on 1/27/2017.
 */
var PolymerExt = require('polymer-ext');
var template = require('raw!./location-select-display.tmpl');
var stylesheet = require('raw!./location-select-display.css');

PolymerExt({
    is: "location-select-display",

    template: template,
    stylesheet: stylesheet,
    properties: {
        url: String
    },
    selectT1: function () {
        window.location.href = this.url + "terminal-1"
    },
    selectT2: function () {
        window.location.href = this.url + "terminal-2"
    },
    selectT3: function () {
        window.location.href = this.url + "terminal-3"
    },
    selectITG: function () {
        window.location.href = this.url + "international-g"
    }
});