window.addEventListener("load", subscriptionInfoLoad, false);

async function subscriptionInfoLoad(){
    await subscriptionInfo();
}

async function subscriptionInfo() {
    //let user = await client.user.get();
    let user = {customerAccessToken: "c1Hi794lCE0Rgax68jpulE0rpmBmOz3AzCGnuXTM1fvWen0FFkOEsbhjIeRb5LMnAvNp6lquc/ikJCFlYi0Wf4Z4cJrnXno6+xolxaV9L0nmCIoQkaYnUaQ7aystCbzRHo4WzC+pFEvsiUSBS9MWnlfswMpkEC3ghCvp2g3M95wv4v1IOxPMN5+JXUgPD6zP"};
    if (!user) return;   
    
    let response = await client.snippet.render(
        "subscription_info_snippet.html",
        "SnippetQueries/subscription_info.graphql",
        { customerAccessToken: user.customerAccessToken }
    );
    response = JSON.parse(response);
    let descontoPrime = document.querySelectorAll('.spot-price .desconto_prime');
    
    if (response.status && descontoPrime) {
        descontoPrime.forEach((el) => {
            el.style.display = "flex";
        });
    }    
  }  