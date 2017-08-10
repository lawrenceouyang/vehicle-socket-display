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

$.validator.addMethod( "resetPasswordsMatch", function(value, element, param){


    var $password = $('#password').val();
    var $confirm_password = $('#confirm_password').val();

    return ( $password.localeCompare($confirm_password) == 0)


}, "Passwords don't match!");


$.validator.addMethod( "activatePasswordsMatch", function(value, element, param){

    var $password = $('#new_password').val();
    var $confirm_password = $('#confirm_password').val();

    return ( $password.localeCompare($confirm_password) == 0)


}, "Passwords don't match!");


/* Courtesy of Stack Overflow User 'Bergi'
* http://stackoverflow.com/questions/18746234/jquery-validate-plugin-password-check-minimum-requirements-regex
* */

$.validator.addMethod("passwordRules", function(value) {

    console.log(/[a-z]/.test(value));
    console.log(/[A-Z]/.test(value));
    console.log(/\d/.test(value));
    console.log(/[!@#$%^&*()_=\[\]{};':"\\|,.<>\/?+-]/.test(value));

   return /[a-z]/.test(value) // has at least one lowercase letter
       && /[A-Z]/.test(value) // has at least one uppercase letter
       && /\d/.test(value) // has at least one digit
       && /[!@#$%^&*()_=\[\]{};':"\\|,.<>\/?+-]/.test(value); // has atleast special character

}, "Password does not meet rules listed above! ");






