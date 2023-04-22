//Only functions not visible to normal users are stored here

function populateForm(buttonID){

    let form = document.getElementById("NewForm");
    let formTitle = document.createElement("h3");

    switch(buttonID) {
        case "ChampionshipsButton":

            //Form Title
            formTitle.innerHTML = "New Season";
            form.appendChild(formTitle);

            //Year
            let yearInputLabel = document.createElement("label");
            yearInputLabel.innerHTML = "Season Year:";
            yearInputLabel.htmlFor = "yearInput";
            form.appendChild(yearInputLabel);
            form.appendChild(document.createElement("br"));

            let yearInput = document.createElement("input");
            yearInput.type = "text";
            yearInput.id = "yearInput";
            yearInput.name = "yearInput";
            form.appendChild(yearInput);
            form.appendChild(document.createElement("br"));

            //Point System
            let scoringLabel = document.createElement("label");
            scoringLabel.innerHTML = "Season Scoring:";
            scoringLabel.htmlFor = "scoringInput";
            form.appendChild(scoringLabel);
            form.appendChild(document.createElement("br"));

            let scoringInput = document.createElement("textarea");
            scoringInput.rows = "15";
            scoringInput.id = "scoringInput";
            scoringInput.name = "scoringInput";
            scoringInput.placeholder = "Position:Points\nPosition:Points";
            form.appendChild(scoringInput);
            form.appendChild(document.createElement("br"));

            //Submit
            let submit = document.createElement("input");
            submit.type = "submit";
            submit.value = "Submit";
            form.appendChild(document.createElement("br"));
            form.appendChild(submit);

        break;

        default:
          
    } 
}

function hideForm(){
    document.getElementById("NewFormDiv").style.display = "none";
    document.getElementById("NewForm").innerHTML = "";
}

function showForm(buttonID){
    document.getElementById("NewFormDiv").style.display = "block";
    populateForm(buttonID);
}

function EditText(pID){
    document.getElementById(pID).setAttribute("contenteditable","true");
}