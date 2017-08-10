/**
 * Created by Lawrence.Ouyang on 1/27/2017.
 */
var PolymerExt = require('polymer-ext');
var template = require('raw!./display-view.tmpl');
var stylesheet = require('raw!./display-view.css');

require('../availability-card/availability-card.js');
require('../empty-card/empty-card.js');

require('../../img/sfo-logo.png');

PolymerExt({
    is: "display-view",
    
    template: template,
    stylesheet: stylesheet,
    
    /** Properties:
     * availability: Information for the company, including ID, name, availability, and contacts
     * unavailableMessage: Message that indicates the display is unavailable
     * contactMessage: Message for contact information on the display
     * active: Boolean that determines if the display is currently active
     * checkoutTimer: Timer for the availability marks to disappear, needs to be passed down the chain
     *  */
    properties: {
        availability: {
            type: Object
        },
        unavailableMessage: String,
        contactMessage: String,
        active: {
            type: Boolean
        },
        location: String,
        checkoutTimer: Number
    },
    // Determines whether to make the card white or gray
    _classColor: function (index) {
        if ((index % 2) == 1)
            return "default";
        return "none";
    }
});