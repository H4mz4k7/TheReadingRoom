
import {addUserToIDB} from './utility.js';
let db;

$(document).ready(function () {


    //open indexeddb for reviews db to use later

    const request = indexedDB.open('userDatabase', 1);


    request.onsuccess = function(event) {
        // Get the reference to the database
        db = event.target.result;
    };

    request.onerror = function(event) {
        // Handle errors
        console.error('IndexedDB error:', event.target.error);
    };

    // Toggle between login and registration forms
    $("#toggleFormButton").click(function () {
        $("#loginForm").hide()
        $("#registerForm").show()

    });

    $("#toggleFormButton2").click(function () {
        $("#loginForm").show()
        $("#registerForm").hide()

    });

    let $alert = $("#alert");

    $alert.hide();


    //retrieve error param from url (if it is there) and display relevant alert
    const urlParams = new URLSearchParams(window.location.search);

    const isError = urlParams.get("isError");

    const $registerForm = $("#registerForm");

    if (isError){
        $("#loginForm").hide()
        $registerForm.show()
        $alert.show();
        $alert.text("Username or email is already in use");
    }






    const $registerBtn = $("#registerBtn");



    $registerForm.submit(function (event) {
        // Disable the button to prevent multiple clicks
        $registerBtn.prop('disabled', true);


        //extract data from form
        let email = $("#email").val();
        let username = $("#username").val();
        let $password = $("#password");
        let password = $password.val();


        //check passwords match
        function validateForm() {

            const confirmPassword = $("#confirmPassword").val();

            if (password !== confirmPassword) {
                return false; // Prevent form submission
            }

            // Continue with form submission if passwords match
            return true;
        }


        if (validateForm()){
            registerUser(username, email, password);
        }
        else{
            //alert if passwords do not match
            event.preventDefault();
            $("#confirmPassword").val("");
            $password.val("");
            $alert.show();
            $alert.text("Passwords do not match");
            $("#registerBtn").prop('disabled', false);
        }



    });

});




async function registerUser(username, email, password) {
    try {
        const response = await $.ajax({
            url: '/getUsersAndEmails',
            type: 'GET',
            data: { username, email }
        });

        if (response.length !== 0) {
            throw new Error("Username or email is already in use");
        }

        const userResponse = await $.ajax({
            url: '/users',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email, username, password })
        });

        
        $("#registerBtn").prop('disabled', false);

    } catch (error) {
        console.error('Error:', error);
        window.location.href = `/login?isError=true`;
        $("#registerBtn").prop('disabled', false);
    }
}