var lampada = document.getElementById("lamp");
var lampadaOn = ("assets/lamp_on.png");
var lampadaOff = ("assets/lamp_off.png");
let own = true;


lampada.addEventListener("click", function() {
    if (own) {
        document.body.style.backgroundColor = "radial-gradient(circle, white 8%, yellow 100%)"
        lampada.src = "assets/lamp_on.png"; 
        own = false;
    } 
    else {
        document.body.style.backgroundColor = "radial-gradient(circle, white 8%, black 100%)"
        lampada.src = "assets/lamp_off.png";
        own = true;
    }
});

