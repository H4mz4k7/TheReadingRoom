import { isOnline, sendRequest } from './utility.js';

let db, dbUser;
let rating = null

jQuery(() => {

    $(".star").on("click", function () {
        const selectedRating = $(this).data("rating");
        rating = selectedRating; // Update the global rating variable
        updateStars(selectedRating);
    });

    initializeDatabases();
    handleReviewSubmission();
});


function updateStars(selectedRating) {
    $(".star").css("color", "black");
    for (let i = 1; i <= selectedRating; i++) {
        $("#star" + i).css("color", "#f0ad4e");
    }
}

function initializeDatabases() {
    openDatabase('UserDatabase', result => dbUser = result);
    openDatabase('reviewsDatabase', result => db = result);
}

function openDatabase(name, onSuccess, onUpgradeNeeded) {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = event => onUpgradeNeeded && onUpgradeNeeded(event.target.result);
    request.onsuccess = event => onSuccess(event.target.result);
    request.onerror = event => console.error(`Error opening ${name}:`, event.target.error);
}


function handleReviewSubmission() {
    $("#createReview").on("submit", (event) => {
        event.preventDefault();
        const $postBtn = $("#postBtn").prop('disabled', true);
        const reviewData = collectFormData();

        if (!isFormDataComplete(reviewData)) {
            $("#alert").text("Please fill out all fields.").show();
            $postBtn.prop('disabled', false);
            return;
        }

        isOnline(
            () => submitReviewOffline(reviewData, $postBtn),
            () => submitReviewOnline(reviewData, $postBtn)
        );
    });
}

function collectFormData() {
    return {
        title: $("#title").val(),
        author: $("#author").val(),
        review: $("#review").val(),
        username: $("#username").text(),
        rating: rating,
        room_number: Math.round(Math.random() * 10000)
    };
}

function isFormDataComplete(data) {
    return Object.values(data).every(value => value !== null && value !== '');
}

function submitReviewOffline(data, $postBtn) {
    console.log("Offline adding");
    data.status = "offline";
    storeReview(data, $postBtn, () =>{
        window.location.href = '/'
    });
}

function submitReviewOnline(data, $postBtn) {
    console.log("Online adding");
    data.status = "online";
    storeReview(data, $postBtn, () => {
        sendRequest('/create_review', data, 'POST', () => {
            console.log('Review saved successfully!');
            window.location.href = `/view_review?title=${data.title}&author=${data.author}&rating=${data.rating}&username=${data.username}`;
        }, true);
    });
}

//store review locally
function storeReview(data, $postBtn, callback) {
    const transaction = db.transaction('reviewsStore', 'readwrite');
    const reviewsStore = transaction.objectStore('reviewsStore');
    const request = reviewsStore.add(data);

    request.onsuccess = () => {
        console.log("Review added to IndexedDB successfully");
        callback && callback();
    };
    request.onerror = event => {
        console.error('Error adding item to IndexedDB:', event.target.error);
        $postBtn.prop('disabled', false);
    };
}
