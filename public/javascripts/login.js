

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

            //check if there is a user already registered with same email or username
            const getUsersAndEmailsPromise = new Promise(function (resolve, reject) {
                $.ajax({
                    url: '/getUsersAndEmails',
                    type: 'GET',
                    data: { username: username, email : email },
                    success: function (data) {
                        if (data.length !== 0){ //if data extracted then username/email is in use
                            reject("Username or email is already in use")
                        }else{
                            resolve(); // Resolve if no data is found
                        }
                    },
                    error: function (xhr, status, error) {
                        reject(error);
                    }
                });
            });

            //after db is checked this block is called
            getUsersAndEmailsPromise
                .then(function (){
                    //create new user
                    $.ajax({
                        url: '/users',
                        type: 'POST',
                        data: JSON.stringify({ email: email, username: username, password: password }),
                        contentType: 'application/json',
                        success: function () {
                            console.log('User saved successfully!');

                            $("#registerBtn").prop('disabled', false);
                        },
                        error: function (xhr, status, error) {
                            console.error('Error saving user:', error);

                            $("#registerBtn").prop('disabled', false);
                        }
                    });
                })
                .catch(function (error) {
                    //if username/email is in use add error to search param and reload page
                    const isError = true;

                    // Redirect to /users with the isError query parameter
                    window.location.href = `/login?isError=${isError}`;
                    $("#registerBtn").prop('disabled', false);
                });



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




