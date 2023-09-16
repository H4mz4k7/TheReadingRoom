$(document).ready(function () {

    // Toggle between login and registration forms
    $("#toggleFormButton").click(function () {
        $("#loginForm").hide()
        $("#registerForm").show()

    });

    $("#toggleFormButton2").click(function () {
        $("#loginForm").show()
        $("#registerForm").hide()

    });


    function validateForm() {
        var password = $("#password").val();
        var confirmPassword = $("#confirmPassword").val();

        if (password !== confirmPassword) {
            alert("Password and Confirm Password do not match!");
            return false; // Prevent form submission
        }

        // Continue with form submission if passwords match
        return true;
    }


    // $("#registerBtn").click(function (){
    //     return validateForm(); // Prevent form submission if validation fails
    // });

    $("#registerBtn").click(function () {
        // Disable the button to prevent multiple clicks
        $(this).prop('disabled', true);

        let email = $("#email").val();
        let username = $("#username").val();
        let password = $("#password").val();

        $.ajax({
            url: '/users',
            type: 'POST',
            data: JSON.stringify({email: email, username: username, password: password}),
            contentType: 'application/json',
            success: function () {
                console.log('User saved successfully!');
                // You can redirect or display a success message here

                // Re-enable the button after success (if needed)
                $("#registerBtn").prop('disabled', false);
            },
            error: function (xhr, status, error) {
                console.error('Error saving user:', error);
                // Handle the error and provide feedback to the user

                // Re-enable the button after error (if needed)
                $("#registerBtn").prop('disabled', false);
            }
        });
    });

});




