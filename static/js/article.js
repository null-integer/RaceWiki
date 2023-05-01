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
    let sessionNum = buttonID.match(/\d+/g);


    if(buttonID.includes("Practice") || buttonID.includes("Qualifying") || buttonID.includes("Race")){        
        buttonID = buttonID.replace(/ \d+/g,"");
    }

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

        case "ScheduleButton":

            //Form Title 
            formTitle.innerHTML = "New Scheduled Session";
            form.appendChild(formTitle);
            form.action = "/race/"+relation+"/schedule";
            
            //Session Type
            let sessionTypeLabel = document.createElement("label");
            sessionTypeLabel.htmlFor = "sessionTypeInput";
            sessionTypeLabel.innerHTML = "Session Type:";
            form.appendChild(sessionTypeLabel);
            form.appendChild(document.createElement("br"));

            let sessionTypeInput = document.createElement("select");
            sessionTypeInput.name = "sessionTypeInput";
            sessionTypeInput.id = "sessionTypeInput";
            let options = ["Practice","Qualifying","Race"];
            options.forEach(option =>{
                let optionElement = document.createElement("option");
                optionElement.value = option;
                optionElement.innerHTML = option;
                sessionTypeInput.appendChild(optionElement);
            });
            form.appendChild(sessionTypeInput);
            form.appendChild(document.createElement("br"));

            //Points
            let pointsLabel = document.createElement("label");
            pointsLabel.htmlFor = "pointsInput";
            pointsLabel.innerHTML = "Points Awarded:";
            form.appendChild(pointsLabel);
            form.appendChild(document.createElement("br"));

            let pointsInput = document.createElement("select");
            pointsInput.name = "pointsInput";
            pointsInput.id = "pointsInput";
            options = ["Yes","No"];
            options.forEach(option =>{
                let optionElement = document.createElement("option");
                optionElement.value = option;
                optionElement.innerHTML = option;
                pointsInput.appendChild(optionElement);
            });
            form.appendChild(pointsInput);
            form.appendChild(document.createElement("br"));

            //Session Date
            let sessionDateLabel = document.createElement("label");
            sessionDateLabel.htmlFor = "sessionDateInput";
            sessionDateLabel.innerHTML = "Session Date:"
            form.appendChild(sessionDateLabel);
            form.appendChild(document.createElement("br"));

            let sessionDateInput = document.createElement("input");
            sessionDateInput.type = "date";
            sessionDateInput.id = "sessionDateInput";
            sessionDateInput.name = "sessionDateInput";
            form.appendChild(sessionDateInput);
            form.appendChild(document.createElement("br"));

            //Session Time
            let sessionTimeLabel = document.createElement("label");
            sessionTimeLabel.htmlFor = "sessionTimeInput";
            sessionTimeLabel.innerHTML = "Session Time:"
            form.appendChild(sessionTimeLabel);
            form.appendChild(document.createElement("br"));

            let sessionTimeInput = document.createElement("input");
            sessionTimeInput.type = "time";
            sessionTimeInput.id = "sessionTimeInput";
            sessionTimeInput.name = "sessionTimeInput";
            form.appendChild(sessionTimeInput);
            form.appendChild(document.createElement("br"));

            //Session Weather
            addLabelAndTextArea(form,"Session Weather:","sessionWeatherInput",10,"");

        break;

        case "CircuitButton":

            //Form Title 
            formTitle.innerHTML = "Set Circuit";
            form.appendChild(formTitle);
            form.action = "/race/"+relation+"/circuit";

            //Circuit Name
            addLabelAndText(form,"Circuit Name","circuitNameInput");

        break;

        case "TurnsButton":
            
            //Form Title 
            formTitle.innerHTML = "New Turn";
            form.appendChild(formTitle);
            form.action = relation+"turn";

            //Turn Number
            addLabelAndText(form,"Turn Number","turnNumberInput");

            //Turn Name
            addLabelAndText(form,"Turn Name","turnNameInput");

        break;

        case "Practice ResultsButton":

            //Form Title 
            formTitle.innerHTML = "New Practice Result";
            form.appendChild(formTitle);
            form.action = "/race/"+relation + "/PracticeResult/"+sessionNum+"/";

            //Driver Name
            addLabelAndText(form,"Driver Name","driverNameInput");

            addLabelAndTextArea(form,"Driver Lap Time","driverLapTimeInput",1,"00:00:00");


        break;

        case "Qualifying ResultsButton":

            //Form Title 
            formTitle.innerHTML = "New Qualifying Result";
            form.appendChild(formTitle);
            form.action = "/race/"+relation + "/QualifyingResult/"+sessionNum+"/";

            //Driver Name
            addLabelAndText(form,"Driver Name","driverNameInput");

            addLabelAndTextArea(form,"Driver Lap Time","driverLapTimeInput",1,"00:00:00");


        break;

        case "Race ResultsButton":
            //Form Title 
            formTitle.innerHTML = "New Race Result";
            form.appendChild(formTitle);
            form.action = "/race/"+relation + "/RaceResult/"+sessionNum+"/";

            //Driver Name
            addLabelAndText(form,"Driver Name","driverNameInput");

            addLabelAndTextArea(form,"Driver Lap Time","driverLapTimeInput",1,"00:00:00");
            
            addLabelAndText(form,"Driver Position","driverPositionInput");

        break;
        case "Pit StopsButton":
            //Form Title 
            formTitle.innerHTML = "New Pit Stop";
            form.appendChild(formTitle);
            form.action = "/race/"+relation + "/PitStop";

            addLabelAndText(form,"Driver Name:","driverNameInput");
            addLabelAndText(form,"Lap Number:","lapNumberInput");
            addLabelAndText(form,"Pit Time:","pitTimeInput");
            addLabelAndText(form,"Total Time:","totalTimeInput");

            addLabelAndTextArea(form,"Pit Description","pitDescriptionInput",10,"");
            

        break;

        case "VehiclesButton":
            formTitle.innerHTML = "New Vehicle";
            form.appendChild(formTitle);
            form.action = relation+"vehicle";
            
            addLabelAndText(form,"Engine:","vehicleEngineInput");
            addLabelAndText(form,"Chassis Name:","vehicleChassisNameInput",);
            addLabelAndText(form,"Season Year:","vehicleSeasonYearInput");
            addLabelAndText(form, "Power (Horse Power):","vehiclePowerInput");
            addLabelAndText(form, "Weight:","vehicleWeightInput");
            addLabelAndText(form, "Picture URL:","vehiclePictureURLInput");

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