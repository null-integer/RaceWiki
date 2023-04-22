//Only functions not visible to normal users are stored here

function hideForm(){
    document.getElementById("NewFormDiv").style.display = "none";
}

function showForm(){
    document.getElementById("NewFormDiv").style.display = "block";
}

function EditText(pID){
    document.getElementById(pID).setAttribute("contenteditable","true");
}

let AddButtons = document.getElementsByClassName("btn btn-success");

Array.from(AddButtons).forEach(button => {
    button.addEventListener("click", showForm);
});
