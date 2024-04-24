import { appendToTable, makeRowsClickable, isOnline, syncReviews, sendRequest } from './utility.js';

// Register service worker succinctly with async/await
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered with scope:', registration.scope);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}


let db, dbUser;

// Using jQuery's shorter ready function
$(function () {
    registerServiceWorker();
    initializeDatabases();
    $("#findBook").click(() => $("html, body").animate({ scrollTop: $("#listSection").offset().top }, 50));
});

async function initializeDatabases() {
    dbUser = await openDatabase('UserDatabase', setupUserDB);
    db = await openDatabase('reviewsDatabase', setupReviewsDB);
    handleOnlineOfflineReviews();
}

async function openDatabase(name, setupFunction) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, 1);
        request.onupgradeneeded = event => {
            setupFunction(event.target.result);
        };
        request.onsuccess = event => {
            resolve(event.target.result);
        };
        request.onerror = event => {
            console.error(`Error opening ${name}:`, event.target.error);
            reject(event.target.error);
        };
    });
}

function setupUserDB(db) {
    if (!db.objectStoreNames.contains('users')) {
        const store = db.createObjectStore('users', { keyPath: 'user_id' });
        ['username', 'email'].forEach(index => store.createIndex(index, index, { unique: true }));
    }
}

function setupReviewsDB(db) {
    if (!db.objectStoreNames.contains('reviewsStore')) {
        const store = db.createObjectStore('reviewsStore', { keyPath: 'id', autoIncrement: true });
        ['status', 'title', 'author', 'rating', 'review', 'username', 'room_number'].forEach(index =>
            store.createIndex(index, index, { unique: index === 'room_number' }));
    }
}

function handleOnlineOfflineReviews() {
    isOnline(() => showReviewsOffline(), () => {
        syncReviews(showReviewsOnline);
        const user = $("#username").text();
        if (user) {
            checkUserByUsername(user);
        }
    });
}

function showReviewsOnline() {
    sendRequest('/getReviews', {}, 'GET', updateReviewsInDB, (error) => console.error('Error fetching data from MongoDB:', error));
}

function updateReviewsInDB(data) {
    const transaction = db.transaction('reviewsStore', 'readwrite');
    const store = transaction.objectStore('reviewsStore');
    store.clear();
    data.forEach(item => {
        const request = store.add(item);
        appendToTable(item.title, item.author, item.rating, item.username);
        request.onerror = event => console.error('Error adding item to IndexedDB:', event.target.error);
    });
    makeRowsClickable();
}

function showReviewsOffline() {
    const transaction = db.transaction('reviewsStore', 'readonly');
    const store = transaction.objectStore('reviewsStore');
    const cursorRequest = store.openCursor();
    cursorRequest.onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
            const { title, author, rating, username } = cursor.value;
            appendToTable(title, author, rating, username);
            cursor.continue();
        } else {
            makeRowsClickable();
        }
    };
    cursorRequest.onerror = event => console.error('Error retrieving data from IndexedDB:', event.target.error);
}

function checkUserByUsername(username) {
    const transaction = dbUser.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const index = store.index('username');
    const request = index.get(username);
    request.onsuccess = () => {
        if (!request.result) {
            addUserToIDB(username);
        }
    };
    request.onerror = event => console.error('Error searching for user:', event.target.error);
}

function addUserToIDB(username) {
    sendRequest('/user', { username: username }, 'GET', userData => {
        const transaction = dbUser.transaction('users', 'readwrite');
        const store = transaction.objectStore('users');
        const request = store.add({ email : userData.email, user_id: userData.user_id , username });
        request.onsuccess = () => console.log("User saved to IndexedDB");
        request.onerror = event => console.error('Error adding user to IndexedDB:', event.target.error);
    });
}
