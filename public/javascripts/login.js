let db;

$(document).ready(function () {
    initializeDatabase();
    configureFormToggle();
    handleURLParameters();
    handleRegistrationForm();
});

function initializeDatabase() {
    const request = indexedDB.open('userDatabase', 1);
    request.onsuccess = event => {
        db = event.target.result;
    };
    request.onerror = event => {
        console.error('IndexedDB error:', event.target.error);
    };
}

function configureFormToggle() {
    $("#toggleFormButton").click(() => {
        $("#loginForm").hide();
        $("#registerForm").show();
    });

    $("#toggleFormButton2").click(() => {
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

function handleRegistrationForm() {
    const $registerForm = $("#registerForm");
    const $alert = $("#alert").hide();
    const $registerBtn = $("#registerBtn");

    $registerForm.submit(event => {
        $registerBtn.prop('disabled', true);
        if (!validateForm()) {
            event.preventDefault();
            showPasswordMismatchError($alert, $registerBtn);
            return;
        }

        const email = $("#email").val();
        const username = $("#username").val();
        const password = $("#password").val();

        registerUser(username, email, password, $alert, $registerBtn);
    });
}

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

        await $.ajax({
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