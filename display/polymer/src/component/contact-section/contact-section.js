/**
 * Created by Lawrence.Ouyang on 1/27/2017.
 */
var PolymerExt = require('polymer-ext');
var template = require('raw!./contact-section.tmpl');
var stylesheet = require('raw!./contact-section.css');

var globeSource = require('../../img/globe.svg');

PolymerExt({
    is: "contact-section",

    template: template,
    stylesheet: stylesheet,

    /** Properties:
     * companyInfo: Information for the company, including display name, wheelchair, and contacts
     * globeSource: Information that is specific for the contact section such as display name, wheelchair, and contacts
     * phoneString: Phone number entry
     * websiteString: Website entry
     * curbsideString: Curbside entry
     *  */
    properties: {
        companyInfo: Object,
        globeSource: {
            type: String,
            value: function() {return globeSource;}
        },
        phoneString: {
            type: String,
            computed: '_computePhoneString(companyInfo.contacts)'
        },
        websiteString: {
            type: String,
            computed: '_computeWebsiteString(companyInfo.contacts)'
        },
        curbsideString: {
            type: String,
            computed: '_computeCurbsideString(companyInfo.contacts)'
        }
    },
    // Return the phone number from the contact list
    _computePhoneString: function (contacts) {
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].contact_type_name == 'phone_number')
                return contacts[i].contact_info;
        }
        return "";
    },
    // Return the website from the contact list
    _computeWebsiteString: function (contacts) {
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].contact_type_name == 'website')
                return contacts[i].contact_info;
        }
        return "";
    },
    // Return the curbside from the contact list
    _computeCurbsideString: function (contacts) {
        var curbsideString = "";
        var curbsideArray = [];
        // Find each curbside from the contact list, and format it correctly
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].contact_type_name == 'curbside') {
                var contactString = contacts[i].contact_info.replace('Terminal ', 'T');
                contactString = contactString.replace("Int'l Terminal", "INT'L");
                curbsideArray.push(contactString);
            }
        }
        // To keep the order organized, sort the array
        // Build the curbside string
        curbsideArray.sort();
        for (var j = 0; j < curbsideArray.length; j++) {
            (curbsideString.length == 0) ? curbsideString = curbsideArray[j] : curbsideString += " | " + curbsideArray[j];
        }
        if (curbsideArray.length != 0)
            (curbsideArray.length > 3 ) ? curbsideString += " Curbside" : curbsideString += " Curbside Check-in";
        return curbsideString;
    }
});