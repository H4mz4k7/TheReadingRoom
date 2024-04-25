# TheReadingRoom



This Progressive Web App (PWA) provides a dedicated platform for users to share their own book reviews, explore reviews posted by others, and receive book recommendations based on their reading history. The app includes several compelling features designed to enhance user experience and engagement.

## Features

### Real-Time Chat Functionality
- Utilizes `socket.io` for seamless and instant communication among users. This allows participants to engage in discussions and share insights in real time.

### Offline Capability
- Employs a service worker to manage offline functionality. This feature ensures that the app caches relevant files and data, allowing users to access the platform and its contents even without an internet connection.

### Integration with Google Books API
- Leverages the Google Books API to fetch detailed information about books, including titles, authors, publishing data, and images. This enhances the information available for each book review and aids in the discovery of new books.

## Getting Started

To get started with this PWA, clone the repository and install the necessary dependencies. 

```bash
git clone https://your-repository-url
cd your-project-directory
npm install
npm start

On this website, a user can register an account and login (the password is hashed before storage in the database). If they wish to look at reviews posted by others, they can do so by clicking on the relevant book in the table. This will bring them to a new page displaying the review and information about the book. At the bottom is the chat box, where a user can talk to other users viewing the same review, allowing for a discussion about the book. A user can also decide to post their own review. This is done by clicking on the relevant button and filling out the subsequent form.

**Demo videos and photos are available in the "demos" folder.**

Installation for local running:

-Use Webstorm (or another IDE)

-Download node.js https://nodejs.org

-Download MongoDB https://www.mongodb.com/try/download/community

-Download files from Github

-Run "npm install" to install dependencies of the system

-Run "/bin/www"
