let bt = document.getElementsByClassName("btn btn-success");
bt = Array.from(bt);
bt.shift();
bt.forEach(x => x.remove());

let im = document.getElementById("generalInfoImage");
im.addEventListener("dblclick",x=>{
    showForm('updateTeamImage',document.baseURI.split("/").slice(-2).join("/"));
});
