let im = document.getElementById("generalInfoImage");
im.addEventListener("dblclick",x=>{
    showForm('updateRaceImage',document.baseURI.split("/").slice(-3).join("/") );
});