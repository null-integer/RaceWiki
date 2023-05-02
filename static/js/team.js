let bt = document.getElementsByClassName("btn btn-success");
bt = Array.from(bt);
bt.shift();
bt.forEach(x => x.remove());