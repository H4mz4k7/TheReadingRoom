import {sendRequest } from './utility.js';


$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const title = urlParams.get("title");
    const author = urlParams.get("author");
    const rating = parseInt(urlParams.get("rating"), 10);
    const username = urlParams.get("username");

    // Display the extracted data
    $("#titleAuthor").text(`${title} - ${author}`);
    $("#username").text(`Review by: ${username}`);

    // Color stars based on the rating
    colorStars(rating);

    // Load and display the review and book info
    showReview(title, author, username);
    getBookInfo(title, author);
});

function colorStars(rating) {
    for (let i = 1; i <= rating; i++) {
        $(`#star${i}`).css("color", "#f0ad4e");
    }
}

function showReview(title, author, username) {
    sendRequest('/getSingleReview', { title, author, username }, 'GET', function(data) {
        $('#review').text(data.review);
    });
}

function getBookInfo(title, author) {
    sendRequest('/getBookInfo', { title, author }, 'GET', function(data) {
        const $img = $('#img');
        const $abstract = $('#abstract');

        if (data.error) {
            $("#APIData").hide();
        } else {
            // Display data extracted from Google Books
            $img.attr('src', data.imageUrl);
            $abstract.text(data.abstract);

            // Adjust image height to match abstract, if necessary
            adjustImageHeight($img, $abstract);
        }
    });
}

function adjustImageHeight($img, $abstract) {
    const minHeight = 250;
    const targetHeight = Math.max($abstract.height(), minHeight);
    $img.height(targetHeight);
}


