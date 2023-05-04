/*
    JavaScript file to make the race page more interactive
*/

//Add Point checkboxes to the table
let tables = document.getElementsByClassName("table table-bordered"); 
let tableIDs = [];
let removePointsColumn = [];
let editable = [];

//Adding checkboxes to point-based sessions
Array.from(tables[0].children[1].children).forEach(x => {
    
    let pointsButton = document.createElement("input");
    pointsButton.type = "checkbox";
    pointsButton.classList.add("form-check-input");
    pointsButton.id = x.children[0].innerHTML +" "+ x.children[1].innerHTML;
    tableIDs.push(pointsButton.id + "Table");
    pointsButton.addEventListener("change", togglePoints); 

    if(x.children[5].innerHTML == "0"){
        pointsButton.checked = false;
        removePointsColumn.push(pointsButton.id + "Table");

    }else{
        pointsButton.checked = true;
        editable.push(pointsButton.id + "Table");
    }
    x.children[5].innerHTML = "";
    x.children[5].appendChild(pointsButton);
});

//Assign ID to all the tables
for(let x = 2; x < tables.length-2; x++){
    tables[x].id = tableIDs.shift();
}

//Remove points column
removePointsColumn.forEach( x =>{
    let changeTable = document.getElementById(x);
    changeTable.children[0].children[0].deleteCell(3);
    Array.from(changeTable.children[1].children).forEach(y => y.deleteCell(3));

});

//Make content editable for rows
editable.forEach(x=>{
    let tb = document.getElementById(x);
    Array.from(tb.children[1].children).forEach(y =>{
        y.children[3].contentEditable = "true";
        y.children[3].id = tb.id.replace(/Table/g,"-") + y.children[1].textContent;
        y.children[3].addEventListener("focusout", updatePoints);
    });

});

function togglePoints(pointsButton){

    let changeTable = document.getElementById(pointsButton.originalTarget.id + "Table");

    if(pointsButton.originalTarget.checked){
        //Add points column 
        let points = document.createElement("th");
        points.scope = "col";
        points.innerHTML = "Points";
        changeTable.children[0].children[0].appendChild(points);

        togglePointsColumn(changeTable.id,"1");
        
        //make the columns editable
        Array.from(changeTable.children[1].children).forEach(y => {
            let tableData = document.createElement("td");
            tableData.id = changeTable.id.replace(/Table/g,"-") + y.children[1].textContent;
            tableData.addEventListener("focusout", updatePoints);
            tableData.contentEditable = "true"; 
            y.appendChild(tableData)

        });

    }else{
        //remove points column
        changeTable.children[0].children[0].deleteCell(3);
        Array.from(changeTable.children[1].children).forEach(y => y.deleteCell(3));
        togglePointsColumn(changeTable.id,"0");

    }

}
async function togglePointsColumn(session,status){

    session = session.replace(/Table/g,"");
    let params = document.baseURI.split("/").slice(-3);

    try {

        const response = await fetch("/togglePoints",{
            method: 'POST',
            body: JSON.stringify({
                category: params[0].replace(/_/g, " "),
                season: params[1],
                race: params[2].replace(/_/g, " "),
                session:session,
                status: status
            }),
            headers: {'Accept': 'application/json', "Content-Type": "application/json" },
        });

        const responseData = await response.json();

        if(responseData.status != 200){
            window.alert("Oops! Something went Wrong! Try Again Later\nSession was not updated!");
        }
        
    } catch (error) {
        window.alert("Oops! Something went Wrong! Try Again Later");
        console.log(error);
    }
}

async function updatePoints (e){

    let params = e.target.baseURI.split("/").slice(-3);
    let data = e.originalTarget.id.split("-");
    let session = data[0];
    let driver = data[1];
    let points = e.originalTarget.textContent;
    e.originalTarget.contentEditable = "false";

    try {

        const response = await fetch("/updatePoints",{
            method: 'POST',
            body: JSON.stringify({
                category: params[0].replace(/_/g, " "),
                season: params[1],
                race: params[2].replace(/_/g, " "),
                session:session,
                driver:driver,
                points:points
            }),
            headers: {'Accept': 'application/json', "Content-Type": "application/json" },
        });

        const responseData = await response.json();

        if(responseData.status != 200){
            window.alert("Oops! Something went Wrong! Try Again Later\nScore was not updated!");
        }
        e.originalTarget.contentEditable = "true";

        
    } catch (error) {
        window.alert("Oops! Something went Wrong! Try Again Later");
    }

}

for(let x = 2; x < tables.length-2; x++){
    if(tables[x].id.includes("Practice") || tables[x].id.includes("Qualifying")){
        if(tables[x].children[1].children.length > 0)
            tables[x].children[1].children[0].classList.add("fastest");
    }else{
        if(tables[x].children[1].children.length >= 3){
            tables[x].children[1].children[0].classList.add("gold");
            tables[x].children[1].children[1].classList.add("silver");
            tables[x].children[1].children[2].classList.add("bronze");
        }

    }}


let im = document.getElementById("generalInfoImage");
im.addEventListener("dblclick",x=>{
    showForm('updateRaceImage',document.baseURI.split("/").slice(-3).join("/") );
});