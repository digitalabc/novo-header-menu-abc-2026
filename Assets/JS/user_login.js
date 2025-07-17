window.addEventListener("load", checkUserLogin, false);
let pageUser = null;

/**
 * Checks if the user is logged to change the site's login settings.
*/
async function checkUserLogin() {
  try {
    const user = await client.customer.get();
    if (user != null) {
      pageUser = user.data;
      const name = parseUserName(pageUser.customerName);

      document.querySelectorAll(".user-name").forEach((el) => {
        el.innerHTML = name;
      });

      document.querySelectorAll(".not-authenticated").forEach((div) => {
        div.style.display = "none";
      });

      document.querySelectorAll(".authenticated").forEach((div) => {
        div.style.display = "block";
      });

      document.querySelectorAll('.link__myacc').forEach((a) => {
        a.href = '/account/my-data';
      });

      const spinnerElement = document.querySelectorAll(".spinner-block");
      spinnerElement.forEach(e => {
        e.classList.add('remove')
      })
      const priceElement = document.querySelectorAll(".price_prime");
      priceElement.forEach(e => {
        e.classList.add('active')
      })
    } else {
      document.querySelectorAll(".user-href").forEach((div) => {
        div.href += window.location.href;
      });

      document.querySelectorAll(".not-authenticated").forEach((div) => {
        div.style.display = "block";
      });
    }
    window.dispatchEvent(
      new CustomEvent("userChecked", { email: user?.email })
    );
  } catch (error) {
    console.error(error);
  }
}

const logout = async (redirectUrl) => {
  await client.cookie.remove('sf_customer_access_token');
  
  if (redirectUrl) {
    window.location.href = redirectUrl;
  } else {
    window.location.reload();
  }
};

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