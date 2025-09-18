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
      document.querySelectorAll(".user-href:not(.user-register)").forEach((element) => {
        element.href = "/login/authenticate?returnUrl=" + window.location.pathname;
      });
      document.querySelectorAll(".user-href.user-register").forEach((element) => {
        element.href = "/login/signup?returnUrl=" + window.location.pathname;
      });

      document.querySelectorAll(".not-authenticated").forEach((div) => {
        div.style.display = "block";
      });
    }
    
    window.dispatchEvent(
      new CustomEvent("userChecked", { email: user?.data.email })
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

/**
 * Deletes a customer address.
 * @param {string} addressId - The ID of the address to delete.
*/
async function deleteAddress(addressId) {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) {
        return;
    }
    
    try {
        console.log('Tentando excluir endereço:', addressId);
        const result = await client.customer.address.delete(addressId);
        console.log('Resultado da exclusão:', result);
        
        // Show success message
        alert('Endereço excluído com sucesso!');
        
        // Reload the page to update the address list
        window.location.reload();
    } catch (error) {
        console.error('Erro ao excluir endereço:', error);
        alert('Erro ao excluir endereço: ' + (error.message || 'Tente novamente.'));
    }
}