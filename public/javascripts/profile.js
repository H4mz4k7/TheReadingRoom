import {appendToTable, makeRowsClickable, isOnline, syncReview} from './utility.js';

let db;


let mySwiper;

jQuery(function() {
    let user = $("#username").text();
    const request = indexedDB.open('reviewsDatabase', 1);

    request.onsuccess = function(event) {
        db = event.target.result;
        isOnline(
            function () {
                console.log("offline");
                showReviewsOffline(user);
            },
            function () {
                console.log("online");
                syncReview(showReviews, user);
                fetchTopBooks(user);
                getRead(user);
            }
        );
    }

    request.onerror = function(event) {
        console.error('IndexedDB error:', event.target.error);
    };

    mySwiper = initializeSwiper(); 
});

/**
 * retrieve users reviews from mongoDB and display in table
 * @param user the user logged in
 */
function showReviews(user) {
    $.ajax({
        url: '/getProfileReviews',
        data: {username : user},
        type: 'GET',
        success: function (data) {

            data.forEach(function(item) {

                const { title, author, rating, username } = item;
                appendToTable(title, author, rating, username);

            });

            makeRowsClickable();

        },
        error: function (xhr, status, error) {
            console.error('Error fetching data from MongoDB:', error);
        }
    })
}


/**
 * retrieve users reviews from indexeddb and display in table
 * @param user the user logged in
 */
function showReviewsOffline(user){


    const transaction = db.transaction('reviewsStore', 'readonly');
    const reviewsStore = transaction.objectStore('reviewsStore');

    // Open a cursor to iterate over the data in the object store
    const cursorRequest = reviewsStore.openCursor();

    cursorRequest.onsuccess = function(event) {
        const cursor = event.target.result;

        if (cursor){
            if (cursor.value.username === user){
                const { title ,author, rating, username } = cursor.value;
                appendToTable(title,author,rating,username);
            }

            cursor.continue();

            makeRowsClickable();
        }

    };

    cursorRequest.onerror = function(event) {
        console.error('Error retrieving data from IndexedDB:', event.target.error);
    };

}


function initializeSwiper() {
    const mySwiper = new Swiper('.mySwiper', {
        slidesPerView: 5,
        spaceBetween: 30,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },

        breakpoints: {
            // when window width is >= 320px
            320: {
              slidesPerView: 2,
              spaceBetween: 20
            },
            // when window width is >= 480px
            550: {
                slidesPerView: 3,
                spaceBetween: 40
            },
            // when window width is >= 640px
            768: {
              slidesPerView: 4,
              spaceBetween: 40
            },
            1000: {
                slidesPerView: 5,
                spaceBetween: 40
            }
        }
    });
    return mySwiper;
}

function fetchTopBooks(user) {
    $.ajax({
        url: `/top-books`,
        data: {username : user},
        type: 'GET',
        dataType: 'json', // Expecting JSON data in response
        success: function (books) {
            addSlides(books);

            if (!mySwiper) {
                mySwiper = initializeSwiper();
            } else {
                mySwiper.update();
            }


        },
        error: function (xhr, status, error) {
            console.error('Error fetching top books:', error);
        }
    });
}




function addSlides(books) {
    const defaultImagePath = '/images/blank_cover.jpg'; 
    books.forEach(book => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <img src="${book.image || defaultImagePath}" alt="${book.title}" style="width: 100%; height: auto;">
            <h3>${book.title}</h3>
            <p>${book.author}</p>
        `;
        mySwiper.appendSlide(slide);
    });
    mySwiper.update();  // Make sure to update Swiper after adding slides
}

  
  
function getRead(user) {
    $.ajax({
        url: `/read-books`,
        data: {username : user},
        type: 'GET',
        dataType: 'json', // Expecting JSON data in response
        success: function (books) {
            console.log(books)
            books.forEach(book => {
                appendToTable(book.title, book.author, book.rating)
            })

        },
        error: function (xhr, status, error) {
            console.error('Error fetching top books:', error);
        }
    });
}

