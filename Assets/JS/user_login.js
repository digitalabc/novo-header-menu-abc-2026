window.addEventListener("load", checkUserLogin, false);
let pageUser = null;

/**
 * Checks if the user is logged to change the site's login settings.
*/
async function checkUserLogin() {
    try {
        const user = await client.user.get();
    
        if(user != null) {
            pageUser = user;
            const name = parseUserName(user.name);

            document.querySelectorAll(".user-name").forEach(el => {
              el.innerHTML = name;
            });
            
            const logoutUrl = client.user.logoutUrl();
            document.getElementById("logout-href").href = logoutUrl + "?returnUrl=" + window.location.href;

            document.querySelectorAll(".not-authenticated").forEach(div => {
              div.style.display = 'none';
            });
            document.querySelectorAll(".authenticated").forEach(div => {
              div.style.display = 'block';
            });
        }
        else{
            document.querySelectorAll(".user-href").forEach(div => {
              div.href += window.location.href;
            });
            
            document.querySelectorAll(".not-authenticated").forEach(div => {
              div.style.display = 'block';
            });
        }
        window.dispatchEvent(new CustomEvent("userChecked", { email: user?.email} ));
    } catch(error) {
        console.error(error);
    }
}

/**
 * Returns the first name of the user.
 * @param {string} fullname - User full name.
*/
function redirectToLogin(){
    const loginUrl = document.getElementById('login-url')?.value;
    if (!loginUrl) return;

    window.location = loginUrl + window.location.href;
}

function parseUserName(fullname) {
    const names = fullname.split(" ");
    return names[0];
}

/**
 * Show user options on mouse enter.
*/
function userMouseEnter(){
    document.getElementById("user-options").style.visibility = "visible";
}

/**
 * Hides user options on mouse leave.
*/
function userMouseLeave(){
    document.getElementById("user-options").style.visibility = "hidden";
}