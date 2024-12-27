window.addEventListener("load", checkUserLogin, false);
let pageUser = null;

/**
 * Checks if the user is logged to change the site's login settings.
*/
async function checkUserLogin() {
    let user;
    try {
        user = await client.customer.get();
    
        const login = document.querySelectorAll("[id='login']");
        const userName = document.querySelectorAll("[id='user-name']");
        const userHref = document.querySelectorAll("[id='user-href']");
        const loggedUser = document.querySelectorAll("[id='logged-user']");
        const userAction = document.querySelectorAll("[id='user-action']");
        
        if(user?.data) {
            pageUser = user;
            const name = parseUserName(user.data.customerName);
            // const logoutUrl = client.user.logoutUrl();

            login.forEach(x => {
                x.classList.add('hidden');
            });

            loggedUser.forEach(x => {
                x.classList.remove('hidden');
                x.classList.add('flex');
            });

            // userLogout.forEach(x => {
            //     x.href = logoutUrl + "?returnUrl=" + window.location.href;
            // });
            
            userName.forEach(x => {
                x.innerHTML = `${name}`
            });
            
            userAction.forEach(x => {
                x.innerHTML = "Logout";
            });
        }
        else{
            login.forEach(x => {
                x.classList.remove('hidden');
            });

            loggedUser.forEach(x => {
                x.classList.add('hidden');
                x.classList.remove('flex');
            });
            
            userHref.forEach(x => {
                x.href += window.location.href;
            });
        }
        await handleUserCheckDataLayerEvent(); 
    } catch(error) {
        console.log(error);
    }
}

function redirectToLogin(){
    const loginUrl = document.getElementById('login-url')?.value;
    if (!loginUrl) return;
    
    window.location = loginUrl + window.location.href;
}

/**
 * Returns the first name of the user.
 * @param {string} fullname - User full name.
*/
function parseUserName(fullname) {
    const names = fullname.split(" ");
    return names[0];
}

/**
 * Show user options on mouse enter.
*/
function userMouseEnter(){
    document.getElementById("user-options").style.display = "flex";
}

/**
 * Hides user options on mouse leave.
*/
function userMouseLeave(){
    document.getElementById("user-options").style.display = "none";
}