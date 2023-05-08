let im = document.getElementById("generalInfoImage");
im.addEventListener("dblclick",x=>{
    showForm('updateVehicleImage',document.baseURI.split("/").slice(-3).join("/"));
});