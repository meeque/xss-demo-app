function $enable() {
    for (const arg of arguments) {
        arg.disabled = false;
    }
}

function $disable() {
    for (const arg of arguments) {
        arg.disabled = true;
    }
}

function $remove(node) {
    if (node && node.parentNode) {
        node.parentNode.removeChild(node);
    }
}

function validateOrigin(origin) {
    const originRegex = /^([a-z][-+.a-z0-9]*:\/\/)([a-z0-9][-._~a-z0-9]*)(:[0-9]+)?$/;
    return originRegex.test(origin);
}

function $messagePage() {

    const trustedOrigins = new Set();
    if (window.origin) {
        trustedOrigins.add(window.origin);
    }

    originsController();
    eventsController();

    function originsController() {

        const $$origin = document.getElementById('origin').content;
        const $tableOrigins = document.querySelector('table.origins');

        var messageError = null;

        const $rowActions = $tableOrigins.querySelector('tr.actions');
        const $cellMessageError = $rowActions.querySelector('td.message.error');
        const $buttonNew = $rowActions.querySelector('button[name=new]');

        init();

        $buttonNew.addEventListener('click', () => originController());

        async function init() {

            for ( const $rowOrigin of $tableOrigins.querySelectorAll('tr.origin')) {
                $remove($rowOrigin);
            }

            const sortedTrustedOrigins = Array.from(trustedOrigins).sort();
            for (const origin of sortedTrustedOrigins) {
                originController(origin);
            }

            resetEmptyMessage();
            resetErrorMessage();
            enableStandardButtons();
        }

        function resetEmptyMessage() {
            if ($tableOrigins.querySelectorAll('tr.origin').length == 0) {
                $tableOrigins.classList.add('empty');
            } else {
                $tableOrigins.classList.remove('empty');
            }
        }

        function resetErrorMessage() {
            if (messageError === null) {
                $cellMessageError.textContent = '';
            } else {
                $cellMessageError.textContent = messageError;
                messageError = null;
            }
        }

        function originController(origin) {

            const $rowOrigin = $$origin.cloneNode(true).querySelector('tr');
            $rowActions.insertAdjacentElement('beforebegin', $rowOrigin);

            const $inputOrigin = $rowOrigin.querySelector('input[name=origin]');
            const $cellActions = $rowOrigin.querySelector('.actions');
            const $buttonUntrust = $cellActions.querySelector('button[name=untrust]');
            const $buttonTrust = $cellActions.querySelector('button[name=trust]');
            const $buttonCancel = $cellActions.querySelector('button[name=cancel]');

            if (origin != null) {
                display();
            } else {
                newOrigin();
            }

            $buttonUntrust.addEventListener('click', untrust);
            $buttonTrust.addEventListener('click', trust);
            $buttonCancel.addEventListener('click', cancel);

            function display() {
                $rowOrigin.classList.remove('new');
                enableStandardButtons();
                $disable($inputOrigin, $buttonTrust, $buttonCancel);
                $inputOrigin.value = origin;
            }

            function newOrigin() {
                $rowOrigin.classList.add('new');
                resetEmptyMessage();
                resetErrorMessage();
                disableButtons();

                $enable($inputOrigin, $buttonTrust, $buttonCancel);
                $inputOrigin.focus();
            }

            function untrust() {
                trustedOrigins.delete(origin);
                init();
            }

            function trust() {
                origin = $inputOrigin.value;
                if (validateOrigin(origin)) {
                    messageError = null;
                }
                else {
                    messageError = 'Warning: "' + origin + '" does not look like a valid origin. Origins are expressed as hierarchical URIs with only a scheme, host, and optional port component. E.g. "https://example.net:42".\n'
                        + 'Adding "' + origin + '" to the trust list anyway, but it is unlikely to ever match the origin of a post-message event!'
                }
                trustedOrigins.add(origin);
                init();
            }

            function cancel() {
                $remove($rowOrigin);
                resetEmptyMessage();
                enableStandardButtons();
            }
        }

        function disableButtons() {
            $disable(... $tableOrigins.querySelectorAll('button'));
        }

        function enableStandardButtons() {
            $enable(... $tableOrigins.querySelectorAll('button[name=new], button[name=delete]'));
        }
    }



    function eventsController() {

        const $$event = document.getElementById('event').content;
        const $tableEvents = document.querySelector('table.events');

        messageError = null;

        const $rowActions = $tableEvents.querySelector('tr.actions');
        const $cellMessageError = $rowActions.querySelector('td.message.error');
        const $buttonClear = $rowActions.querySelector('button[name=clear]');

        init();

        window.addEventListener('message', eventController);
        $buttonClear.addEventListener('click', init);

        function init() {
            $tableEvents.classList.add('empty');
            for (const $rowEvent of $tableEvents.querySelectorAll('tr.event')) {
                $remove($rowEvent);
            }
            messageError = null;
            resetErrorMessage();
        }

        function resetErrorMessage() {
            if (messageError === null) {
                $cellMessageError.textContent = '';
            } else {
                $cellMessageError.textContent = messageError;
                messageError = null;
            }
        }

        function eventController(event) {

            $tableEvents.classList.remove('empty');

            const $rowEvent = $$event.cloneNode(true).querySelector('tr');
            $rowActions.insertAdjacentElement('beforebegin', $rowEvent);

            const $cellTrusted = $rowEvent.querySelector('.trust');
            const $cellOrigin = $rowEvent.querySelector('.origin');
            const $cellTimestamp = $rowEvent.querySelector('.timestamp');
            const $cellData = $rowEvent.querySelector('.data');

            if (trustedOrigins.has(event.origin)) {
                $rowEvent.classList.add('trusted');
                $cellTrusted.textContent = 'yes';
                messageError = null;
            }
            else {
                $cellTrusted.textContent = 'no';
                messageError = 'Received event from untrusted origin "' + event.origin + '"!';
            }
            resetErrorMessage();

            $cellOrigin.textContent = event.origin;
            $cellTimestamp.textContent = event.timestamp;
            $cellData.textContent = JSON.stringify(event.data);
        }
    }
}

document.addEventListener('DOMContentLoaded', $messagePage);
