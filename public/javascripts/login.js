

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

    let $alert = $("#alert");

    $alert.hide();


    const urlParams = new URLSearchParams(window.location.search);

    const isError = urlParams.get("isError");

    if (isError){
        $("#loginForm").hide()
        $("#registerForm").show()
        $alert.show();
        $alert.text("Username or email is already in use");
    }





    const $registerForm = $("#registerForm");
    const $registerBtn = $("#registerBtn");



    $registerForm.submit(function (event) {
        // Disable the button to prevent multiple clicks
        $registerBtn.prop('disabled', true);

        let email = $("#email").val();
        let username = $("#username").val();
        let password = $("#password").val();


        function validateForm() {

            var confirmPassword = $("#confirmPassword").val();

            if (password !== confirmPassword) {
                return false; // Prevent form submission
            }

            // Continue with form submission if passwords match
            return true;
        }


        if (validateForm()){

            const getUsersAndEmailsPromise = new Promise(function (resolve, reject) {
                $.ajax({
                    url: '/getUsersAndEmails',
                    type: 'GET',
                    data: { username: username, email : email },
                    success: function (data) {
                        if (data){
                            reject("Username or email is already in use")
                        }else{
                            resolve(); // Resolve the Promise when the request is successful
                        }
                    },
                    error: function (xhr, status, error) {
                        reject(error); // Reject the Promise if there is an error
                    }
                });
            });

            getUsersAndEmailsPromise
                .then(function (){
                    $.ajax({
                        url: '/users',
                        type: 'POST',
                        data: JSON.stringify({ email: email, username: username, password: password }),
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
                })
                .catch(function (error) {

                    const isError = true;

                    // Redirect to /users with the isError query parameter
                    window.location.href = `/login?isError=${isError}`;
                    $("#registerBtn").prop('disabled', false);
                });



        }
        else{
            event.preventDefault();
            $("#confirmPassword").val("");
            $("#password").val("");
            $alert.show();
            $alert.text("Passwords do not match");
            $("#registerBtn").prop('disabled', false);
        }



    });

});




