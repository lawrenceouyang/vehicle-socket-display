/**
 * Created by Lawrence.Ouyang on 2/2/2017.
 */
'use strict';

require('../node_modules/flipclock/compiled/flipclock.min.js');
require('style!css!../node_modules/flipclock/compiled/flipclock.css');

require('style!css!./css/display.css');

require('../node_modules/flipclock/compiled/flipclock.js');

require('../node_modules/webcomponents.js/webcomponents-lite.js');
require('./component/location-error/location-error.js');

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
    });
});