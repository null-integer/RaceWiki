let bt = document.getElementsByClassName("btn btn-success");
bt = Array.from(bt);

let rm = bt.pop();
rm.remove();

rm = bt.pop();
rm.remove();

let im = document.getElementById("generalInfoImage");
im.addEventListener("dblclick",x=>{
    showForm('updateSeasonImage',document.baseURI.split("/").slice(-3).join("/") );
});