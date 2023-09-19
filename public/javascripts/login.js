

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




    const $registerForm = $("#registerForm");
    const $registerBtn = $("#registerBtn");

    // $("#registerBtn").click(function (){
    //     return validateForm(); // Prevent form submission if validation fails
    // });

    $registerForm.submit(function (event) {
        // Disable the button to prevent multiple clicks
        $registerBtn.prop('disabled', true);

        let email = $("#email").val();
        let username = $("#username").val();
        let password = $("#password").val();


        function validateForm() {

            var confirmPassword = $("#confirmPassword").val();

            if (password !== confirmPassword) {
                alert("Password and Confirm Password do not match!");
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
                    console.log(event)
                    event.preventDefault();
                    $("#registerBtn").prop('disabled', false);
                    alert(error);
                });



        }
        else{
            console.log(event)
            event.preventDefault();
            $("#registerBtn").prop('disabled', false);
        }



    });

});




