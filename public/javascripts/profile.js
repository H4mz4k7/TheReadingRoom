import { appendToTable, makeRowsClickable, isOnline, syncReviews, sendRequest } from './utility.js';

// Initialize global variables
let db, mySwiper;

jQuery(function() {
    const user = $("#username").text();
    initializeIndexedDB(user);
    mySwiper = initializeSwiper();
});

function initializeIndexedDB(user) {
    const request = indexedDB.open('reviewsDatabase', 1);
    request.onsuccess = function(event) {
        db = event.target.result;
        handleConnectivity(user);
    };
    request.onerror = function(event) {
        console.error('IndexedDB error:', event.target.error);
    };
}


function handleConnectivity(user) {
    isOnline(() => {
        console.log("offline");
        showReviewsOffline(user);
    }, () => {
        console.log("online");
        syncReviews(() => showReviews(user), user);
        fetchTopBooks(user);
        getRead(user);
    });
}

/**
 * Retrieve user's reviews from MongoDB and display them in a table
 * @param {string} user - The logged-in user
 */
function showReviews(user) {
    sendRequest('/getProfileReviews', {username: user}, 'GET', data => {
        data.forEach(item => {
            const { title, author, rating, username } = item;
            appendToTable(title, author, rating, username);
        });
        makeRowsClickable();
    });
}

/**
 * Retrieve user's reviews from IndexedDB and display them in a table
 * @param {string} user - The logged-in user
 */
function showReviewsOffline(user) {
    const transaction = db.transaction('reviewsStore', 'readonly');
    const reviewsStore = transaction.objectStore('reviewsStore');
    const cursorRequest = reviewsStore.openCursor();
    cursorRequest.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const { title, author, rating, username } = cursor.value;
            if (username === user) {
                appendToTable(title, author, rating, username);
            }
            cursor.continue();
        }
    };
    cursorRequest.onerror = function(event) {
        console.error('Error retrieving data from IndexedDB:', event.target.error);
    };
}



function initializeSwiper() {
    return new Swiper('.mySwiper', {
        slidesPerView: 5,
        spaceBetween: 30,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            320: { slidesPerView: 2, spaceBetween: 20 },
            550: { slidesPerView: 3, spaceBetween: 40 },
            768: { slidesPerView: 4, spaceBetween: 40 },
            1000: { slidesPerView: 5, spaceBetween: 40 }
        }
    });
}

function fetchTopBooks(user) {
    sendRequest('/top-books', { username: user }, 'GET', books => {
        addSlides(books);
        mySwiper.update();
    });
}

function addSlides(books) {
    const defaultImagePath = '/images/blank_cover.jpg';
    books.forEach(book => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `<img src="${book.image || defaultImagePath}" alt="${book.title}" style="width: 100%; height: auto;">
            <h3>${book.title}</h3>
            <p>${book.author}</p>`;
        mySwiper.appendSlide(slide);
    });
}

function getRead(user) {
    sendRequest('/read-books', { username: user }, 'GET', books => {
        books.forEach(book => {
            appendToTable(book.title, book.author, book.rating);
        });
    });
}
