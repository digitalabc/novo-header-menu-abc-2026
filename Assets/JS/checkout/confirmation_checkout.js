window.addEventListener("DOMContentLoaded", pixCode())

const copia = async (element, code) => {
    try {
        await navigator.clipboard.writeText(code);
        let tooltip = document.createElement("span");
        tooltip.innerText = "Copiado!";
        tooltip.className = "tooltip";
        element.appendChild(tooltip);

        setTimeout(() => {
            tooltip.remove();
        }, 2000);
    } catch (error) {
        console.error("Erro ao copiar:", error);
    }
};

const whatsLink = () => {
    const pedidoPagemento = document.querySelector('.codePixWrapper');

    pedidoPagemento.insertAdjacentHTML('beforeend', `
        <h4 class="pixError">Não foi possível gerar o Pix. <a target="_blank" href="https://api.whatsapp.com/send?phone=553221028262&text=Eu%20tive%20problemas%20com%20o%20pix,%20preciso%20de%20ajuda." target="_blank">Por favor, clique aqui e entre em contato com o nosso SAC <img style="width: 25px;vertical-align: bottom;" src="https://recursos.abcdaconstrucao.com.br/i/whatsapp-icon-abc-contato.png" alt="SAC"></a></h4>
        `);
};

function pixCode() {
    if (orderInfo.payment.name.toLowerCase().includes('pix') && orderInfo.order_status === "AWAITING_PAYMENT") {
        fetch(`https://pagamento.digitalabc.com.br/tray/buscar-pix/${orderInfo.order_id}?abc=true&t=${Date.now()}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            }
        }).then(response => {
            if (response.status >= 200 && response.status < 300) {
                response.json().then(pix => {

                    if (!pix.error) {
                        const codePixWrapper = document.querySelector('.codePixWrapper');
                        const qrCode = document.querySelector('#qrPix');
                        qrCode.innerHTML = `<img src="data:image/png;base64,${pix.image_qrcode_pix}" alt="Pix">`
                        codePixWrapper.insertAdjacentHTML('beforeend', `
                            <h3>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
                                    <path d="M18.7171 19.0751C18.2542 19.0768 17.7956 18.9868 17.3678 18.8102C16.94 18.6336 16.5514 18.374 16.2245 18.0463L12.6241 14.4436C12.4968 14.3219 12.3273 14.2539 12.1511 14.2539C11.9749 14.2539 11.8055 14.3219 11.6782 14.4436L8.06561 18.0562C7.7389 18.3843 7.35042 18.6445 6.9226 18.8216C6.49478 18.9987 6.0361 19.0893 5.57307 19.0881H4.86819L9.43049 23.6504C10.1147 24.3332 11.0419 24.7166 12.0086 24.7166C12.9752 24.7166 13.9024 24.3332 14.5867 23.6504L19.1581 19.0782L18.7171 19.0751Z" fill="#20A389"/>
                                    <path d="M5.57383 6.3415C6.03687 6.34026 6.49555 6.43081 6.92338 6.60792C7.35121 6.78503 7.73969 7.04518 8.06637 7.37334L11.6789 10.9867C11.8045 11.1119 11.9746 11.1822 12.1519 11.1822C12.3292 11.1822 12.4993 11.1119 12.6249 10.9867L16.2245 7.38702C16.5509 7.05846 16.9393 6.79799 17.3672 6.62073C17.7951 6.44347 18.2539 6.35295 18.7171 6.35442H19.1505L14.579 1.783C14.2405 1.44436 13.8386 1.17573 13.3963 0.992453C12.9539 0.809176 12.4798 0.714844 12.001 0.714844C11.5221 0.714844 11.048 0.809176 10.6057 0.992453C10.1633 1.17573 9.7614 1.44436 9.42289 1.783L4.86819 6.3415H5.57383Z" fill="#20A389"/>
                                    <path d="M22.9318 10.1379L20.1694 7.37545C20.1071 7.40091 20.0405 7.41433 19.9732 7.41499H18.717C18.0634 7.41662 17.4368 7.67622 16.9735 8.13735L13.3738 11.7347C13.0496 12.0583 12.6103 12.2401 12.1523 12.2401C11.6942 12.2401 11.2549 12.0583 10.9307 11.7347L7.31738 8.12366C6.85421 7.66226 6.22759 7.40238 5.57382 7.40054H4.03176C3.96821 7.39911 3.90541 7.3865 3.84623 7.36328L1.06627 10.1379C0.38347 10.8222 0 11.7493 0 12.716C0 13.6827 0.38347 14.6098 1.06627 15.2941L3.84015 18.068C3.8992 18.0443 3.96208 18.0317 4.02568 18.0307H5.57382C6.22758 18.0288 6.85416 17.7689 7.31738 17.3076L10.93 13.695C11.5831 13.0426 12.7214 13.0426 13.3738 13.695L16.9735 17.2939C17.4368 17.755 18.0634 18.0146 18.717 18.0162H19.9732C20.0405 18.0167 20.1071 18.0301 20.1694 18.0558L22.9318 15.2933C23.2705 14.9548 23.5391 14.5529 23.7224 14.1105C23.9057 13.6682 24 13.1941 24 12.7152C24 12.2364 23.9057 11.7623 23.7224 11.3199C23.5391 10.8776 23.2705 10.4757 22.9318 10.1372" fill="#20A389"/>
                                </svg>
                                Pix copia e cola
                            </h3>

                            <div id="codePix">
                                <button id="buttonPixCopy">
                                    Copiar chave Pix
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="17" viewBox="0 0 15 17" fill="none">
                                        <path d="M5.50001 13.5148C5.06001 13.5148 4.68335 13.3582 4.37001 13.0448C4.05668 12.7315 3.90001 12.3548 3.90001 11.9148V2.31484C3.90001 1.87484 4.05668 1.49818 4.37001 1.18484C4.68335 0.87151 5.06001 0.714844 5.50001 0.714844H12.7C13.14 0.714844 13.5167 0.87151 13.83 1.18484C14.1433 1.49818 14.3 1.87484 14.3 2.31484V11.9148C14.3 12.3548 14.1433 12.7315 13.83 13.0448C13.5167 13.3582 13.14 13.5148 12.7 13.5148H5.50001ZM5.50001 11.9148H12.7V2.31484H5.50001V11.9148ZM2.30001 16.7148C1.86001 16.7148 1.48335 16.5582 1.17001 16.2448C0.856679 15.9315 0.700012 15.5548 0.700012 15.1148V3.91484H2.30001V15.1148H11.1V16.7148H2.30001Z" fill="white"/>
                                    </svg>
                                </button>
                                <span class="pixText">
                                    ${pix.emv}
                                </span>
                            </div>
                        `);

                        let codigoPix = document.querySelector('#buttonPixCopy');

                        codigoPix.addEventListener('click', (e) => {
                            copia(e.target, pix.emv);
                        });

                    } else {
                        whatsLink();
                    }
                });
            } else {
                whatsLink();
            }
        }).catch(() => {
            whatsLink();
        });
    }
}