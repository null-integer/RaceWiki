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

//add/remove points columns
removePointsColumn.forEach( x =>{
    let changeTable = document.getElementById(x);
    changeTable.children[0].children[0].deleteCell(3);

});

//Make content editable for rows
editable.forEach(x=>{
    let tb = document.getElementById(x);
    Array.from(tb.children[1].children).forEach(y =>{
        let tableData = document.createElement("td");
        tableData.contentEditable = "true"; 
        y.appendChild(tableData)
    });

});

function togglePoints(pointsButton){

    let changeTable = document.getElementById(pointsButton.originalTarget.id + "Table");

    if(pointsButton.originalTarget.checked){
        //Add points column 
        // console.log(changeTable);
        let points = document.createElement("th");
        points.scope = "col";
        points.innerHTML = "Points";
        changeTable.children[0].children[0].appendChild(points);
        
        //make the columns editable
        Array.from(changeTable.children[1].children).forEach(y => {
            let tableData = document.createElement("td");
            tableData.contentEditable = "true"; 
            y.appendChild(tableData)
        });

    }else{
        //remove points column
        changeTable.children[0].children[0].deleteCell(3);
    }

}


/*
to listen when user unfocus
tds[102].addEventListener("focusout", x =>{console.log("OUT")});

*/