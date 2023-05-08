let tables = document.getElementsByClassName("table table-bordered"); 
let tableIDs = [];
let removePointsColumn = [];
let editable = [];

//Adding checkboxes to point-based sessions
Array.from(tables[0].children[1].children).forEach(x => {
    
   
    tableIDs.push(x.children[0].innerHTML +" "+ x.children[1].innerHTML + "Table");

});

//Assign ID to all the tables
for(let x = 2; x < tables.length-2; x++){
    tables[x].id = tableIDs.shift();
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

    }
}
