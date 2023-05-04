Array.from(document.getElementsByClassName("btn btn-success")).forEach(x => x.remove()); 

let im = document.getElementById("generalInfoImage");
im.addEventListener("dblclick",x=>{
    showForm('updateVehicleImage',document.baseURI.split("/").slice(-3).join("/"));
});
