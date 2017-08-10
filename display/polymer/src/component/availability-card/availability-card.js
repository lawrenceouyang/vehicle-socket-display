/**
 * Created by Lawrence.Ouyang on 1/27/2017.
 */
var PolymerExt = require('polymer-ext');
var template = require('raw!./availability-card.tmpl');
var stylesheet = require('raw!./availability-card.css');

require('../availability-mark/availability-mark.js');
require('../contact-section/contact-section.js');

PolymerExt({
    is: "availability-card",

    template: template,
    stylesheet: stylesheet,
    
    /** Properties:
     * companyData: Information for the company, including ID, name, availability, and contacts
     * contactInfo: Information that is specific for the contact section such as display name, wheelchair, and contacts
     * checkoutTimer: Timer for the availability marks to disappear, needs to be passed down the chain
     *  */
    properties: {
        companyData: Object,
        contactInfo: {
            type: Object,
            computed: '_computeContact(companyData.contacts, companyData.display_name, companyData.wheelchair, companyData.enabled)'
        },
        checkoutTimer: Number
    },
    // Return a subset of companyData to the contact component
    _computeContact: function (contacts, displayName, wheelchair, enabled) {
        return {
            'contacts': contacts,
            'display_name': displayName,
            'wheelchair': wheelchair,
            'enabled': enabled
        }
    },
     // Find the associated destination availability for the associated component and return it
    _getDestinationData: function (enabled, companyDestinations, destination) {
        if (enabled) {
            for (var i = 0; i < companyDestinations.length; i++) {
                if (companyDestinations[i].destination_name == destination)
                    return companyDestinations[i];
            }
        }
        return {
            available: null,
            deleted: null,
            destination_id: null,
            destination_name: null,
            timestamp: null
        };
    }
});