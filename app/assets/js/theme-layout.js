//toggle function page onclick 
let enableFirstFunction = true;
function toggleClass() {
   var mainLayout = document.getElementById("layoutDiv");

   if (enableFirstFunction) {
       mainLayout.classList.add("show-settings");
   } else {
       mainLayout.classList.remove("show-settings");
   }
   
   enableFirstFunction = !enableFirstFunction;
}

var darkModeLayout = document.getElementById("dark_mode");
var lightModeLayout = document.getElementById("light_mode");

if (darkModeLayout) {
   darkModeLayout.addEventListener("click", toggleClass);
} else if (lightModeLayout) {
   lightModeLayout.addEventListener("click", toggleClass);
}

//toggle function page onclick
function resetData()
{
   const htmlElment = document.getElementsByTagName('html')[0];
   localStorage.setItem('selectedLayoutValues', 'default');
   localStorage.setItem('selectedColorValue', 'light_mode');
   localStorage.setItem('selectedNavcolorValue', 'light');
   htmlElment.setAttribute("data-layout-mode", "light_mode");
   htmlElment.setAttribute("data-layout-style", "default");
   htmlElment.setAttribute("data-nav-color", "light");
}