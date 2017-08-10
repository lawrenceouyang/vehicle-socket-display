/**
 * Created by Lawrence.Ouyang on 1/27/2017.
 */
var PolymerExt = require('polymer-ext');
var template = require('raw!./location-error.tmpl');
var stylesheet = require('raw!./location-error.css');

require('../../img/sfo-logo.png');

PolymerExt({
    is: "location-error",
    
    template: template,
    stylesheet: stylesheet
});