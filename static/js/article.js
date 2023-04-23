//Only functions not visible to normal users are stored here

function addLabelAndText(form, inputLabelText, inputID){
    let inputLabel = document.createElement("label");
    inputLabel.innerHTML = inputLabelText;
    inputLabel.htmlFor = inputID;
    form.appendChild(inputLabel);
    form.appendChild(document.createElement("br"));

    let input = document.createElement("input");
    input.type = "text";
    input.id = inputID;
    input.name = inputID;
    form.appendChild(input);
    form.appendChild(document.createElement("br"));
}

function addLabelAndTextArea(form, inputLabelText, inputID, rows, placeholder){

    let inputLabel = document.createElement("label");
    inputLabel.innerHTML = inputLabelText;
    inputLabel.htmlFor = inputID;
    form.appendChild(inputLabel);
    form.appendChild(document.createElement("br"));

    let input = document.createElement("textarea");
    input.rows = rows;
    input.id = inputID;
    input.name = inputID;
    input.placeholder = placeholder;
    form.appendChild(input);
    form.appendChild(document.createElement("br"));
}

function populateForm(buttonID,relation){

    let form = document.getElementById("NewForm");
    form.method = "POST";
    let formTitle = document.createElement("h3");

    switch(buttonID) {
        case "ChampionshipsButton":

            //Form Title
            formTitle.innerHTML = "New Season";
            form.appendChild(formTitle);
            form.action = "/category/"+relation+"/season";

            //Year
            addLabelAndText(form, "Season Year:", "seasonYearinput");

            //Point System
            addLabelAndTextArea(form,"Season Scoring","seasonScoringinput",15,"Position:Points\nPosition:Points");

        break;

        case "TeamsButton":

            //Form Title
            formTitle.innerHTML = "New Team";
            form.appendChild(formTitle);
            form.action = "/category/"+relation+"/team";

            //Team Name
            addLabelAndText(form, "Team Name:", "teamNameinput");

            //Team Location
            addLabelAndText(form,"Team Base Location:","teamLocationinput");

            //Team Name
            addLabelAndText(form,"Team Picture URL:","teamPictureURLinput");
            
        break;

        case "FlagsButton":

            //Form Title
            formTitle.innerHTML = "New Flag";
            form.appendChild(formTitle);
            form.action = "/category/"+relation+"/flag";

            //Flag Name
            addLabelAndText(form, "Flag Name:","flagNameinput");

            //Flag Icon
            addLabelAndText(form, "Flag Icon URL:","flagIconURLinput");

            //Flag Meaning
            addLabelAndTextArea(form,"Flag Meaning:","flagMeaninginput",10," ");
        
        break;
        
        case "Scoring SystemButton":
            
            //Form Title 
            formTitle.innerHTML = "New Scoring Position";
            form.appendChild(formTitle);
            form.action = "/season/"+relation+"/scoring";

            //position
            addLabelAndText(form,"Position:","positionInput");

            //points
            addLabelAndText(form,"Points","pointsInput");

        break;

        case "CalendarButton":

            //Form Title 
            formTitle.innerHTML = "New Race";
            form.appendChild(formTitle);
            form.action = "/season/"+relation+"/race";

            //Race Name
            addLabelAndText(form,"Race Name:", "raceNameInput");

            //Race Date
            let raceDateLabel = document.createElement("label");
            raceDateLabel.htmlFor = "raceDateInput";
            raceDateLabel.innerHTML = "Race Date:"
            form.appendChild(raceDateLabel);
            form.appendChild(document.createElement("br"));

            let raceDateInput = document.createElement("input");
            raceDateInput.type = "date";
            raceDateInput.id = "raceDateInput";
            raceDateInput.name = "raceDateInput";
            form.appendChild(raceDateInput);
            form.appendChild(document.createElement("br"));

        break;

        default:
          
    } 

    //Submit
    let submit = document.createElement("input");
    submit.type = "submit";
    submit.value = "Submit";
    form.appendChild(document.createElement("br"));
    form.appendChild(submit);
}

document.getElementById("NewFormDiv").addEventListener("click",hideForm);

function hideForm(e){
    if (e.target === this){
        document.getElementById("NewFormDiv").style.display = "none";
        document.getElementById("NewForm").innerHTML = "";
    }
}

function showForm(buttonID,relation){
    document.getElementById("NewFormDiv").style.display = "block";
    populateForm(buttonID,relation);
}

function EditText(pID){
    document.getElementById(pID).setAttribute("contenteditable","true");
}