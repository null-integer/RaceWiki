let im = document.getElementById("generalInfoImage");
im.addEventListener("dblclick",x=>{
    showForm('updateCircuitImage',document.getElementsByClassName("topic-title mb-4")[0].innerHTML.replace(/ /g,"_") );
});

for(let x = 0; x < 3; x+=1){
    document.getElementsByClassName("card-info")[x].addEventListener("dblclick", e =>{
        document.getElementsByClassName("card-info")[x].contentEditable = "true";
    });
    document.getElementsByClassName("card-info")[x].addEventListener("focusout", async e =>{
        try {
            const response = await fetch("/"+document.baseURI.split("/").slice(-2).join("/") + "/generalInfo/" ,{
                method: 'POST',
                body: JSON.stringify({
                    updatedField: x,
                    updatedInfo: e.originalTarget.textContent,
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
    
}