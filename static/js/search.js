console.log("imported");

document.getElementById("relationMenu").addEventListener("focusout", async x =>{
    if(x.target.value == "Team" && document.getElementById("additionalRelation").innerHTML == ""){

        let menu = document.createElement("select");
        menu.classList.add("form-select");
        menu.classList.add("form-select-sm");
        menu.ariaLabel = ".form-select-sm example";

        menu.name = "additionalRelationMenu";
        menu.id = "additionalRelationMenu";

        const response = await fetch('/getCategories');
        const responseData = await response.json();
        console.log(responseData);

        responseData.forEach(cat => {
            let opt = document.createElement("option");
            opt.value = cat.category_name; 
            opt.innerHTML = cat.category_name;
            menu.appendChild(opt);
        });

        document.getElementById("additionalRelation").appendChild(menu);
        /*

            <select class="form-select form-select-sm" aria-label=".form-select-sm example" name="relation" id="relationMenu">
              <option selected value="">Relation</option>
              <option value="Category">Category</option>
              <option value="Driver">Driver</option>
              <option value="Circuit">Circuit</option>
              <option value="Team">Team</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Season">Season</option>
              <option value="Race">Race</option>
            </select>
        */
        
        
    }else{
        document.getElementById("additionalRelation").innerHTML = "";
    }
});