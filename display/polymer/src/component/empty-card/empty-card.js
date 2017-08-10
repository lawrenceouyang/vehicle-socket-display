/**
 * Created by Lawrence.Ouyang on 1/27/2017.
 */
var PolymerExt = require('polymer-ext');
var template = require('raw!./empty-card.tmpl');
var stylesheet = require('raw!./empty-card.css');

PolymerExt({
    is: "empty-card",
    
    template: template,
    stylesheet: stylesheet,
    
    /** Properties:
     * unavailableMessage: Message that indicates the display is unavailable
     * contactMessage: Message for contact information on the display
     *  */    
    properties: {
        unavailableMessage: {
            type: String,
            value: 'No Shared Ride Vans Available At This Time'
        },
        contactMessage: {
            type: String
        }
    }
});