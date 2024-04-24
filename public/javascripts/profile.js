import { appendToTable, makeRowsClickable, isOnline, syncReviews, sendRequest } from './utility.js';

let db, mySwiper;

jQuery(function() {
    const user = $("#username").text();
    initializeIndexedDB(user);
    mySwiper = initializeSwiper(); //swiper allows for horizontal swiping through recommendations
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
        showReviewsOffline(user);
    }, () => {
        syncReviews(() => showReviews(user), user);
        fetchTopBooks(user);
        getRead(user);
    });
}
 
function showReviews(user) {
    sendRequest('/getProfileReviews', {username: user}, 'GET', data => {
        data.forEach(item => {
            const { title, author, rating, username } = item;
            appendToTable(title, author, rating, username);
        });
        makeRowsClickable();
    });
}

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

//get recommendations
function fetchTopBooks(user) {
    sendRequest('/top-books', { username: user }, 'GET', books => {
        addSlides(books);
        mySwiper.update();
    });
}

//display recommendations on swiper
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
