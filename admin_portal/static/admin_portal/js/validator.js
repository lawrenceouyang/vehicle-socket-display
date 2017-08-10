/**
* Return true if the field value matches the given format RegExp
*
* @example $.validator.methods.pattern("AR1004",element,/^AR\d{4}$/)
* @result true
*
* @example $.validator.methods.pattern("BR1004",element,/^AR\d{4}$/)
* @result false
*
* @name $.validator.methods.pattern
* @type Boolean
* @cat Plugins/Validate/Methods
*/
$.validator.addMethod( "pattern", function( value, element, param ) {
	if ( this.optional( element ) ) {
		return true;
	}
	if ( typeof param === "string" ) {
		param = new RegExp( "^(?:" + param + ")$" );
	}
	return param.test( value );
}, "Invalid format." );


// Validates whether selected at least San Mateo / San Francisco
$.validator.addMethod( "destinationsValid", function(value, element, param){
        var selected_dests = $("#destinations option:selected").text();
        return (selected_dests.indexOf("San Francisco") !== -1 && selected_dests.indexOf("San Mateo") !== -1)
}, "All providers must serve San Francisco and San Mateo");

// Validates whether selected at least San Mateo / San Francisco
$.validator.addMethod( "requiredField", function(value){
    return value.length > 0
});


// Validates whether selected at least San Mateo / San Francisco
$.validator.addMethod( "destinationValid", function(value){
        var selected_dests = $("#destination option:selected").text();
        return (selected_dests.indexOf("San Francisco") !== -1 && selected_dests.indexOf("San Mateo") !== -1)
}, "All providers must serve San Francisco and San Mateo");

// Validates if one user field is entered, all must be entered
$.validator.addMethod( "validProviderUser", function(value, element, param){
        var $first = $('#su_first').val();
        var $last = $('#su_last').val();
        var $email = $('#su_email').val();
        var $phone = $('#su_phone').val();

        /* No Options are allowed */
        if ($first.length == 0 && $last.length == 0 && $email.length == 0 && $phone.length == 0) {
            return true;
        }
        else {
            return value.length > 0;
        }

}, "Please");

$.validator.addMethod( "phoneValid", function(value, element, param){

    var s2 = (""+value).replace(/\D/g, '');
    var m = s2.match(/^(\d{3})(\d{3})(\d{4})$/);
    return (!m) ? null : "(" + m[1] + ") " + m[2] + "-" + m[3];

}, "Please");


$.validator.addMethod( "differentTimes", function(value, element, param){

    var $reset_hour = $('#display_reset_time_h').val();
    var $reset_minute = $('#display_reset_time_m').val();
    var $reset_ampm = $('#display_reset_time_ampm').val();
    var $start_hour = $('#display_start_time_h').val();
    var $start_minute = $('#display_start_time_m').val();
    var $start_ampm = $('#display_start_time_ampm').val();

    var $reset = $reset_hour+$reset_minute+$reset_ampm;
    var $start = $start_hour+$start_minute+$start_ampm;

    return ($reset.localeCompare($start) != 0)


}, "The enable check-ins time must be different from the disable check-ins time. ");






