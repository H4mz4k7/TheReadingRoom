    $(document).ready(function () {

    const urlParams = new URLSearchParams(window.location.search);

    const title = urlParams.get("title");
    const author = urlParams.get("author");
    const rating = parseInt(urlParams.get("rating"));
    const username = urlParams.get("username");

    $("#titleAuthor").text(`${title} - ${author}`);
    $("#username").text(`Review by: ${username}`)


    for (let i = 1; i < rating + 1; i++){


        $("#star" + i).css("color", "#f0ad4e")
    }


    showReview();

    getBookInfo(title,author);



    function showReview() {
        $.ajax({
            url: '/getSingleReview',
            type: 'GET',
            data: {title : title, author : author, username : username},
            success: function (data) {

                const  review = data.review;
                $('#review').text(review)

            },
            error: function (xhr, status, error) {
                console.error('Error fetching data from MongoDB:', error);
            }
        })
    }



    function getBookInfo(title,author) {
        // Encode the book  for use in the SPARQL query


        let encodedTitle = title.trim().replace(/\s/g, '_').toLowerCase()


        let encodedAuthor = author.trim().replace(/\s/g, '_')
        encodedAuthor = encodedAuthor.split('_').map((part) => {
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }).join('_');


        let queryAbstract =`
        PREFIX dbo: <http://dbpedia.org/ontology/>
        PREFIX dbr: <http://dbpedia.org/resource/>

        SELECT ?abstract
        WHERE {
            ?book a dbo:Book;
                dbo:abstract ?abstract;
                rdfs:label ?label;
                dbo:author dbr:${encodedAuthor}.

            FILTER (LANGMATCHES(LANG(?abstract), "en") && CONTAINS(LCASE(?label), "${encodedTitle}"))
        }
        LIMIT 1
        `;



        // Define the DBpedia SPARQL endpoint URL
        const sparqlEndpointUrl = 'https://dbpedia.org/sparql';

        // Send the SPARQL query to DBpedia using AJAX


        $.ajax({
            url: sparqlEndpointUrl,
            type: 'GET',
            data: {
                query: queryAbstract,
                format: 'json'
            },
            success: function(data) {
                // Handle the query results
                const results = data.results.bindings;

                if (results.length > 0) {
                    const abstract = results[0].abstract.value;

                    $("#abstract").text(abstract)

                } else {
                    console.log('No information found for the book :', title);
                    $("#img").css("display", "none");
                    $("#abstract").css("display", "none");

                }
            },
            error: function(xhr, status, error) {
                // Handle errors

                console.error('Error retrieving bird information from DBpedia:', error);
            }
        });

    }

});