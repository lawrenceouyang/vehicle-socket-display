/**
 * Created by Lawrence.Ouyang on 1/30/2017.
 * display.js
 * 
 * The main display file. Loads all components used by 
 */
'use strict';

var helpers = require('./js/helpers.js');

require('style!css!../node_modules/flipclock/compiled/flipclock.css');
require('style!css!./css/display.css');

require('../node_modules/flipclock/compiled/flipclock.js');
require('../node_modules/webcomponents.js/webcomponents-lite.js');
require('./component/display-view/display-view.js');

require('./img/sfo-favicon.png');

$(function () {
    // Wait for Polymer Components to finish loading before instantiating other objects
    $(document).on('WebComponentsReady', function () {
        console.log('Shared Ride Vans Information Display', 'VERSION: ' + window.version);

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
        var displayObject = $('display-view')[0],
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
                'resetStart': 0,
                'disable': 0
            },
            ws = null;

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

        /** WebSocket Functionality 
         * initWS() - This function will both initialize the websocket as well as declare the event handlers that the
         * websocket will listen for. */
        function initWS() {
            ws = new WebSocket(window.socketURL + "?client=" + window.displayLocation);
            
            ws.onopen = function () {
                // On successfully opening a socket connection, remove the interval for attempting to reconnect
                if (handler.disconnect) window.clearInterval(handler.disconnect);
                if (handler.disable) window.clearTimeout(handler.disable);
                // Make an ajax call to get the most recent availabilities by REST API
                $.ajax({
                    url: "/display/ajax/load-availability-data/"
                }).done(function (data) {
                    console.log(data);
                    // Set the configurations and availability
                    setConfig(data.config);
                    displayObject.set('availability', data.availability);
                    // If there are no companies in the system, deactivate the display
                    if (data.availability.length == 0) displayObject.set('active', false);
                });
            };
            ws.onmessage = function (e) {
                // On receiving a message, process the message based on the content of the header
                console.log('Message Received.', e);
                if (e.data != 'hello' && e.data != 'No client id provided. Closing connection') {
                    // JSONify the message
                    var messageData = JSON.parse(e.data);
                    messageData.body = JSON.parse(messageData.body);
                    console.log('Message Data', messageData);

                    var availabilityCard = $('#availability-card-' + messageData.header.company_id)[0];

                    // Update a specific company's contact
                    if (messageData.header.content_type == 'company_contacts')
                        availabilityCard.set('companyData.contacts', messageData.body);

                    // Update a specific company's destinations
                    else if (messageData.header.content_type == 'company_destinations')
                        availabilityCard.set('companyData.destinations', messageData.body.destinations);

                    // Update the configs
                    else if (messageData.header.content_type == 'config')
                        setConfig(messageData.body);

                    // Update a specific company's information
                    else if (messageData.header.content_type == 'company_info') {
                        var tempAvailability,
                            companyExists = false;
                        for (var i = 0; i < displayObject.availability.length; i++) {
                            if (displayObject.availability[i].company_id == messageData.header.company_id) {
                                companyExists = true;
                                // If there is a company_id match and the body is null, then it is a delete
                                // Splice the entry from the array and do a full refresh
                                if (messageData.body == null) {
                                    displayObject.splice('availability', i, 1);
                                    tempAvailability = displayObject.availability;
                                    displayObject.set('availability', []);
                                    displayObject.set('availability', tempAvailability);
                                }
                                // If there is a company_id match and the body is not null, then it is an edit
                                // Update only the pertinent information
                                else {
                                    availabilityCard.set('companyData.wheelchair', messageData.body.wheelchair);
                                    availabilityCard.set('companyData.display_name', messageData.body.display_name);
                                    availabilityCard.set('companyData.enabled', messageData.body.enabled);
                                }
                                break;
                            }
                        }
                        // If there is no match and the body is not null, then this it is an add
                        // Push the company into the array
                        if (messageData.body != null && !companyExists) {
                            displayObject.push('availability', messageData.body);
                        }
                    }
                }
            };
            ws.onclose = function () {
                // On socket disconnect or closing, set a function to run every 5 seconds to attempt to reconnect to the display
                // If the display is empty, show the empty messages
                if (displayObject.availability.length == 0) displayObject.set('active', false);
                // Instantiate a reconnect interval
                if (!handler.disconnect) {
                    handler.disconnect = setInterval(function () {
                        console.log('Attempting socket reconnect...');
                        initWS();
                    }, 10000)
                }
                // Hide all availability while the socket is down for a certain time
                if (!handler.disable) {
                    handler.disable = setTimeout(function () {
                        displayObject.set('availability', []);
                        displayObject.set('active', false);
                    }, 5 * 1000 * 60)
                }
            };
        }

        // Start WebSocket
        initWS();
    });
});