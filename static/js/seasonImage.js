let im = document.getElementById("generalInfoImage");
im.addEventListener("dblclick",x=>{
    showForm('updateSeasonImage',document.baseURI.split("/").slice(-3).join("/") );
});