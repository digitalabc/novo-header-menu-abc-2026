window.addEventListener("load", subscriptionInfoLoad, false);

async function subscriptionInfoLoad(){
    await subscriptionInfo();
}

async function subscriptionInfo() {
    let user = await client.user.get();
    if (!user) return;   
    
    let response = await client.snippet.render(
        "subscription_info_snippet.html",
        "SnippetQueries/subscription_info.graphql",
        { customerAccessToken: user.customerAccessToken }
    );
    response = JSON.parse(response);
    let descontoPrime = document.querySelectorAll('.spot-price .desconto_prime');
    
    if (response.status && descontoPrime) {
        document.querySelector('.prime_bar').style.display = 'flex';
        descontoPrime.forEach((el) => {
            el.style.display = "flex";
        });
    }    
  }  