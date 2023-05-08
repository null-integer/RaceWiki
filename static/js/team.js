let bt = document.getElementsByClassName("btn btn-success");
bt = Array.from(bt);
bt.shift();
bt.forEach(x => x.remove());

for(let x = 0; x < 1; x+=1){
    document.getElementsByClassName("card-info")[x].addEventListener("dblclick", e =>{
        document.getElementsByClassName("card-info")[x].contentEditable = "true";
    });
    document.getElementsByClassName("card-info")[x].addEventListener("focusout", async e =>{
        try {
            const response = await fetch("/"+document.baseURI.split("/").slice(-3).join("/") + "/generalInfo/" ,{
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
