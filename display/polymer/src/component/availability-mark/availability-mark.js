/**
 * Created by Lawrence.Ouyang on 1/27/2017.
 */
var PolymerExt = require('polymer-ext');
var template = require('raw!./availability-mark.tmpl');
var stylesheet = require('raw!./availability-mark.css');

var moment = require('moment');

PolymerExt({
    is: "availability-mark",

    template: template,
    stylesheet: stylesheet,
    
    /** Properties:
     * availabilityData: Availability for this particular destination
     * available: Boolean that determines whether this location is available or not
     * timerOn: Boolean that determines whether a timer has been started for this mark
     * asyncHandle: Handler for the timer async function
     * checkoutTimer: Timer for the availability marks to disappear
     *  */
    properties: {
        availabilityData: {
            type: Object
        },
        available: {
            type: Boolean,
            computed: '_available(availabilityData)'
        },
        timerOn: {
            type: Boolean,
            value: false
        },
        asyncHandle: Number,
        checkoutTimer: Number
    },
    // Recursive call where it evaluates the time every second to see if the check mark can be removed or not
    _intervalCheck: function () {
        if (!this.timerOn) {
            this.cancelAsync(this.asyncHandle);
        }
        else if (moment(this.availabilityData.timestamp.replace('Z', '')).add(this.checkoutTimer, 'm') < moment()) {
            this.cancelAsync(this.asyncHandle);
            this.set('timerOn', false);
        }
        else {
            this.async(this._intervalCheck, 1000);
        }
    },
    /* On instantiation of a mark, returns whether it is available or not. If not, but there is a timestamp within the
     * checkout timer, create a timer to determine when to remove the check mark. */
    _available: function (availability) {
        if (this.asyncHandle) {
            this.cancelAsync(this.asyncHandle);
            this.set('timerOn', false);
        }
        if (!availability.available && availability.status == 0 && availability.timestamp) {
            // Time format is returned incorrectly, parsing it out as a temporary fix
            if (moment(availability.timestamp.replace('Z', '')).add(this.checkoutTimer, 'm') > moment()) {
                this.set('timerOn', true);
                this.asyncHandle = this.async(this._intervalCheck, 1000);
                return availability.available;
            }
        }
        return availability.available;
    },
    // Return whether the check mark should be shown: if it is either available or a timer is executed.
    _check: function (available, timerOn) {
        return available || timerOn;
    }
});