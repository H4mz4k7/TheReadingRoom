# TheReadingRoom

This website provides a dedicated platform for users to share their own book reviews and explore reviews posted by others. It has many great features including:

-Real time chat functionality
The real-time chat functions were implemented using socket.io, enabling seamless and instant communication.

-The ability to operate in offline mode
This was achieved by implementing a service worker and caching relevant files for later use

-The use of Google Books API to retrieve information about specific books
This was used to extract information and an image for the book if available

On this website, a user can register an account and login (the password is hashed before storage in the database). If they wish to look at reviews posted by others, they can do so by clicking on the relevant book in the table. This will bring them to a new page displaying the review and information about the book. At the bottom is the chat box, where a user can talk to other users viewing the same review, allowing for a discussion about the book. A user can also decide to post their own review. This is done by clicking on the relevant button and filling out the subsequent form.

**Demo videos and photos are available in the "demos" folder.**

Installation for local running:

-Use Webstorm (or another IDE)
-Download node.js https://nodejs.org
-Download MongoDB https://www.mongodb.com/try/download/community
-Download files from Github
-Run "npm install" to install dependencies of the system
-Run "/bin/www"
