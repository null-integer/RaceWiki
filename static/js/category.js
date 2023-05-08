let el = document.getElementById("DriversButton");
el.remove();

el = document.getElementById("DescriptionButton");
el.remove();

el = document.getElementById("RulesButton");
el.remove();

document.getElementById("RulesText").addEventListener("dblclick",x=>{
    document.getElementById("RulesText").contentEditable = "true";
});
document.getElementById("RulesText").addEventListener("focusout",async x=>{
    try {
        
        const response = await fetch("/"+document.baseURI.split("/").slice(-2).join("/") + "/rules/" ,{
            method: 'POST',
            body: JSON.stringify({
                updatedRules: x.originalTarget.innerHTML
            }),
            headers: {'Accept': 'application/json', "Content-Type": "application/json" },
        });

        const responseData = await response.json();

        if(responseData.status != 200){
            window.alert("Oops! Something went Wrong! Try Again Later\nRules were not updated!");
        }
        
    } catch (error) {
        window.alert("Oops! Something went Wrong! Try Again Later");
    }
});

document.getElementById("DescriptionText").addEventListener("dblclick",x=>{
    document.getElementById("DescriptionText").contentEditable = "true";
});
document.getElementById("DescriptionText").addEventListener("focusout",async x=>{
    try {
        
        const response = await fetch("/"+document.baseURI.split("/").slice(-2).join("/") + "/description/" ,{
            method: 'POST',
            body: JSON.stringify({
                updatedDescription: x.originalTarget.innerHTML
            }),
            headers: {'Accept': 'application/json', "Content-Type": "application/json" },
        });

        const responseData = await response.json();

        if(responseData.status != 200){
            window.alert("Oops! Something went Wrong! Try Again Later\nDescription was not updated!");
        }
        
    } catch (error) {
        window.alert("Oops! Something went Wrong! Try Again Later");
    }
});
