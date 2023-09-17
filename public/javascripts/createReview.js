$(document).ready(function () {
    $(".star").click(function () {
        $(".star").css("color", "black");
        let rating = $(this).data("rating");
        console.log(rating);


        for (let i = 1; i < rating + 1; i++){
            $("#star" + i).css("color", "#f0ad4e")
        }


    });
});