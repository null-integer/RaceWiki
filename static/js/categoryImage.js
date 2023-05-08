let im = document.getElementById("generalInfoImage");
im.addEventListener("dblclick",x=>{
    showForm('updateCategoryImage',document.getElementsByClassName("topic-title mb-4")[0].innerHTML.replace(/ /g,"_") );

});