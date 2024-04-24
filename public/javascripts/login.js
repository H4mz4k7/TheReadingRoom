let db;

$(document).ready(function () {
    configureFormToggle();
    handleURLParameters();
    handleRegistrationForm();
});

//toggle between register or login
function configureFormToggle() {
    $("#toggleFormButton").on("click", () => {
        $("#loginForm").hide();
        $("#registerForm").show();
    });

    $("#toggleFormButton2").on("click", () => {
        $("#loginForm").show();
        $("#registerForm").hide();
    });
}

function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const isError = urlParams.get("isError");
    if (isError) {
        $("#loginForm").hide();
        $("#registerForm").show();
        $("#alert").show().text("Username or email is already in use");
    }
}

//check passwords are the same
function validateForm() {
    const password = $("#password").val();
    const confirmPassword = $("#confirmPassword").val();
    return password === confirmPassword;
}

function showPasswordMismatchError($alert, $registerBtn) {
    $("#confirmPassword").val("");
    $("#password").val("");
    $alert.show().text("Passwords do not match");
    $registerBtn.prop('disabled', false);
}

function handleRegistrationForm() {
    const $registerForm = $("#registerForm");
    const $alert = $("#alert").hide();
    const $registerBtn = $("#registerBtn");

    $registerForm.submit(event => {
        event.preventDefault(); 
        $registerBtn.prop('disabled', true);
        
        if (!validateForm()) {
            showPasswordMismatchError($alert, $registerBtn);
            return;
        }

        const email = $("#email").val();
        const username = $("#username").val();
        const password = $("#password").val();

        registerUser(username, email, password, $alert, $registerBtn)
            .then(() => {
                window.location.href = '/login';  
            })
            .catch(error => {
                console.error('Registration failed:', error);
                $alert.text(error.message || "Registration failed").show();
            })
            .finally(() => {
                $registerBtn.prop('disabled', false);
            });
    });
}

async function registerUser(username, email, password, $alert, $registerBtn) {
    try {
        const response = await $.ajax({
            url: '/getUsersAndEmails',
            type: 'GET',
            data: { username, email }
        });

        if (response.length !== 0) {
            throw new Error("Username or email is already in use");
        }

        await $.ajax({
            url: '/users',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email, username, password })
        });

        console.log("Registration successful");
    } catch (error) {
        throw error; 
    }
}