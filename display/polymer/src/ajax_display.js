/**
 * Created by Lawrence.Ouyang on 1/30/2017.
 */
'use strict';
var helpers = require('./js/helpers.js');

require('style!css!../node_modules/flipclock/compiled/flipclock.css');

require('style!css!./css/display.css');

require('../node_modules/flipclock/compiled/flipclock.js');
require('../node_modules/webcomponents.js/webcomponents-lite.js');
require('./component/ajax-display-view/ajax-display-view.js');

require('./img/sfo-favicon.png');

$(function () {
    /** Wait for Polymer Components to finish loading before instantiating other objects */
    $(document).on('WebComponentsReady', function () {

        /* Instantiate a FlipClock instance */
        var flipClock = $('#flip-clock').FlipClock({
            clockFace: 'TwelveHourClock',
            showSeconds: false
        });

        /** Ajax function to get server time and set it to the FlipClock object */
        function getServerTime() {
            $.ajax({
                url: "/display/ajax/time/"
            }).done(function (data) {
                flipClock.setTime(moment(data.datetime, 'MM-DD-YYYY HH:mm:ss.SSS').toDate());
            });
        }

        getServerTime();

        /** Reset clock to have a more accurate time when re-focusing on window */
        $(window).on('focus', function () {
            getServerTime();
        });

        /**
         * Global Variables
         * {DOM Element} displayObject - Accessor to display component
         * {WebSocket} ws - Accessor to WebSocket object
         *
         * -Config-
         * {Integer} refreshIntervalTime - Time for page to randomly shuffle the companies
         * {String} unavailableMessage - Message when display is down, indicates no availabilities
         * {String, Nullable} contactMessage - Message when display is down, shows contact information
         * {String, HH:mm} resetTime - Time the display no longer shows availabilities
         * {String, HH:mm} startTime - Time the display starts showing availabilities
         * {Integer} checkoutIntervalTime - Time after checkout that the displays shows a location being available
         *
         * -Handler-
         * {Handler} refresh - Interval handler for shuffling the companies
         * {Handler} disconnect - Interval handler for attempting to reconnect to socket
         * {Handler} resetStart - Interval handler for checking when the display goes up or down
         * {Handler} disable - Interval handler for showing the no availability messages if the socket is not up
         * */
        var displayObject = $('ajax-display-view')[0],
            config = {
                'refreshIntervalTime': null,
                'unavailableMessage': null,
                'contactMessage': null,
                'resetTime': null,
                'startTime': null,
                'checkoutIntervalTime': null
            },
            handler = {
                'refresh': 0,
                'disconnect': 0,
                'resetStart': 0
            };

        /** Refresh functionality. Shuffles the companies randomly at specified interval. */
        function shuffleCompany() {
            // Create shuffled array and hide current availability
            var shuffledArray = helpers.shuffleArray(displayObject.availability);
            $('contact-section').animate({"opacity": "toggle"});
            $('availability-mark').animate({"opacity": "toggle"});
            // After availability is hidden, set it to the shuffled one and make it reappear
            setTimeout(function () {
                displayObject.set('availability', []);
                displayObject.set('availability', shuffledArray);
                $('contact-section').animate({"opacity": "toggle"});
                $('availability-mark').animate({"opacity": "toggle"});
            }, 500);
        }

        /** Apply the configurations received from REST API or WebSocket to the display
         * @param {Object} configData - The raw key value pairs of the config from the database */
        function setConfig(configData) {
            var newConfig = {};
            // Loop through the key value pairs, and create dictionary entries for each one
            for (var i = 0; i < configData.length; i++)
                newConfig[configData[i]['key']] = configData[i]['value'];

            // If new refresh interval is different, reapply the interval
            if (config.refreshIntervalTime != parseInt(newConfig['display_refresh_interval']) * 1000 * 60) {
                config.refreshIntervalTime = parseInt(newConfig['display_refresh_interval']) * 1000 * 60;

                if (handler.refresh) clearInterval(handler.refresh);

                handler.refresh = setInterval(shuffleCompany, config.refreshIntervalTime);
            }
            // If unavailable message is different, set display's unavailable message
            if (config.unavailableMessage != newConfig['display_message']) {
                config.unavailableMessage = newConfig['display_message'];
                displayObject.set('unavailableMessage', config.unavailableMessage)
            }

            // If unavailable contact message is different, set display's unavailable contact message
            if (config.contactMessage != newConfig['display_contact_message']) {
                config.contactMessage = newConfig['display_contact_message'];
                displayObject.set('contactMessage', config.contactMessage)
            }
            // If the reset time or start time is different, reapply the interval to check for open
            if (config.resetTime != newConfig['display_reset_time'] ||
                config.startTime != newConfig['display_start_time']) {
                config.resetTime = newConfig['display_reset_time'];
                config.startTime = newConfig['display_start_time'];

                if (handler.resetStart) clearInterval(handler.resetStart);

                handler.resetStart = setInterval(function () {
                    var startTime = moment(config.startTime, 'HH:mm'),
                        curTime = moment(flipClock.getTime().time),
                        endTime = moment(config.resetTime, 'HH:mm');
                    // If the endTime falls on the next day, look at the inactive interval
                    // If the endTime is on the same day, look at the active interval
                    if (endTime < startTime) {
                        if (curTime > endTime && curTime < startTime) {
                            displayObject.set('active', false);
                        }
                        else {
                            if (displayObject.availability.length > 0)
                                displayObject.set('active', true);
                        }
                    }
                    else if (endTime > startTime) {
                        if (curTime > startTime && curTime < endTime) {
                            if (displayObject.availability.length > 0) {
                                displayObject.set('active', true);
                            }
                        }
                        else {
                            displayObject.set('active', false);
                        }
                    }

                }, 1000);
            }

            // If new checkout interval is different, set the display's checkout timers
            if (config.checkoutIntervalTime != parseInt(newConfig['display_checkout_interval'])) {
                config.checkoutIntervalTime = parseInt(newConfig['display_checkout_interval']);
                displayObject.set('checkoutTimer', config.checkoutIntervalTime);
            }
        }

        $.ajax({
            url: "/display/ajax/load-availability-data/"
        }).done(function (data) {
            // Set the configurations and availability
            setConfig(data.config);
            displayObject.set('availability', data.availability);
            // If there are no companies in the system, deactivate the display
            if (data.availability.length == 0) displayObject.set('active', false);
        });

        setInterval(function() {
            $.ajax({
                url: "/display/ajax/load-availability-data/"
            }).done(function (data) {
                // Set the configurations and availability
                setConfig(data.config);
                displayObject.set('availability', data.availability);
                // If there are no companies in the system, deactivate the display
                if (data.availability.length == 0) displayObject.set('active', false);
            });
        }, 300000)

    });
});