let im = document.getElementById("generalInfoImage");
im.addEventListener("dblclick",x=>{
    showForm('updateTeamImage',document.baseURI.split("/").slice(-2).join("/"));
});