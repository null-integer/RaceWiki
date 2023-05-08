Array.from(document.getElementsByClassName("btn btn-success")).forEach(x => x.remove());
let im = document.getElementById("generalInfoImage");
im.addEventListener("dblclick",x=>{
    showForm('updateDriverImage',document.getElementsByClassName("topic-title mb-4")[0].innerHTML.replace(/ /g,"_") );
});