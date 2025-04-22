
function sortCookies(cookies) {
    cookies.sort( (c1, c2) => c1.name == c2.name ? 0 : (c1.name < c2.name ? -1 : 1 ) );
    cookies.sort( (c1, c2) => c1.path == c2.path ? 0 : (c1.path < c2.path ? -1 : 1 ) );
    cookies.sort( (c1, c2) => c1.domain == c2.domain ? 0 : (c1.domain < c2.domain ? -1 : 1 ) );
    return cookies;
}

async function setCookie(options) {
    if (hasNativeCookieStore()) {
        await window.cookieStore.set({
            domain: options.domain || null,
            path: options.path || '/',
            name: options.name || '',
            value: options.value || '',
            sameSite: options.sameSite || null,
            expires: parseDate(options.expires),
        });
    } else {
        // the polyfill only supports name/value pairs, no options objects
        await window.cookieStore.set(
            options.name || '',
            options.value || '',
        );
    }
}

async function unsetCookie(options) {
    if (hasNativeCookieStore()) {
        await window.cookieStore.delete({
            domain: options.domain || null,
            path: options.path || '/',
            name: options.name || '',
        });
    } else {
        // the polyfill only supports cookie name, no options objects
        await window.cookieStore.delete(options.name || '');
    }
}

function hasNativeCookieStore() {
    // prototype of the polyfill would be [object Object] instead
    return Object.getPrototypeOf(window.cookieStore) == '[object CookieStore]';
}

function getCookieDomainsHierarchy(domain) {

    const domainLabels = domain.split('.').filter((label) => label !== '');

    // unqualified host name or IPv6 address
    if (domainLabels.length === 1) {
        return [domain];
    }

    // IPv4 address
    if (/^[0-9]+$/.test(domainLabels.at(-1))) {
        return [domain];
    }

    // qualified domain name
    const domains = [];
    for (let i = 0; i < domainLabels.length; i++)
    {
        domains.push(domainLabels.slice(i, domainLabels.length).join('.'));
    }
    domains.pop();
    return domains;
}

function parseDate(date) {
    const tenYearsInMillis = 10 * 365 * 24 * 60 * 60 * 1000;
    const integerRegex = /^(\+|-)?[0-9]+$/;

    if (integerRegex.exec(date) !== null) {
        const numericDate = Number.parseInt(date);
        if (!Number.isNaN(numericDate)) {
            if (numericDate > tenYearsInMillis) {
                return numericDate;
            }
            return Date.now() + numericDate;
        }
    }

    const parsedDate = Date.parse(date);
    if (!Number.isNaN(parsedDate)) {
        return parsedDate;
    }

    return null;
}

function cookiesPage() {

    const $$cookies = document.getElementById('cookies').content;
    const $$cookie = document.getElementById('cookie').content;

    const $dataListCookieDomains = document.getElementById('cookieDomains');

    const messageExpiresHint = 'Use any of the following date formats:\n'
        + 'a calendar date and optional time (e.g. in ISO format),\n'
        + 'or an integer number denoting milliseconds from now (maximum 10 years),\n'
        + 'or a (larger) integer number denoting milliseconds from 1970.\n'
        + 'A date in the past will delete the cookie\n.'
        + 'Enter anything else (e.g. leave this file empty) to create a cookie that does not expire, a.k.a. a session cookie.';

    $dataListCookieDomains.innerText = '';
    for (const domain of getCookieDomainsHierarchy(document.location.hostname)) {
        const $domainOption = document.createElement('option');
        $domainOption.value = domain;
        $dataListCookieDomains.insertAdjacentElement('beforeend', $domainOption);
    }

    cookiesController(document.querySelector('.cookies'));
    pageStatus(document.querySelector('.meta.status'));

    async function cookiesController($container) {

        var messageError = null;

        const $tableCookies = $$cookies.cloneNode(true).querySelector('table.cookies');
        $container.insertAdjacentElement('beforeend', $tableCookies);

        const $rowActions = $tableCookies.querySelector('tr.actions');
        const $cellMessageError = $rowActions.querySelector('td.message.error');
        const $buttonNew = $rowActions.querySelector('button[name=new]');

        init();

        if (hasNativeCookieStore()) {
            cookieStore.onchange = init;
        }

        $buttonNew.addEventListener('click', cookieController);

        async function init() {

            for ( const $rowCookie of $tableCookies.querySelectorAll('tr.cookie')) {
                $remove($rowCookie);
            }

            const cookies = sortCookies(await window.cookieStore.getAll());
            for (const cookie of cookies) {
                cookieController(cookie);
            }

            resetEmptyMessage();
            resetErrorMessage();
            enableStandardButtons();
        }

        function resetEmptyMessage() {
            if ($tableCookies.querySelectorAll('tr.cookie').length == 0) {
                $tableCookies.classList.add('empty');
            } else {
                $tableCookies.classList.remove('empty');
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

        function cookieController(cookie) {

            const $rowCookie = $$cookie.cloneNode(true).querySelector('tr');
            $rowActions.insertAdjacentElement('beforebegin', $rowCookie);

            const $inputDomain = $rowCookie.querySelector('.domain input');
            const $inputPath = $rowCookie.querySelector('.path input');
            const $inputName = $rowCookie.querySelector('.name input');
            const $inputValue = $rowCookie.querySelector('.value input');
            const $checkboxSecure = $rowCookie.querySelector('.secure input');
            const $selectSameSite = $rowCookie.querySelector('.sameSite select');
            const $inputExpires = $rowCookie.querySelector('.expires input');
            const $cellActions = $rowCookie.querySelector('.actions');
            const $buttonEdit = $cellActions.querySelector('button[name=edit]');
            const $buttonDelete = $cellActions.querySelector('button[name=delete]');
            const $buttonSave = $cellActions.querySelector('button[name=save]');
            const $buttonCancel = $cellActions.querySelector('button[name=cancel]');

            if (isExistingCookie()) {
                display();
            } else {
                newCookie();
            }

            $buttonEdit.addEventListener('click', edit);
            $buttonDelete.addEventListener('click', deleteCookie);
            $buttonSave.addEventListener('click', save);
            $buttonCancel.addEventListener('click', cancel);

            function display() {
                $rowCookie.classList.remove('new', 'edit');
                enableStandardButtons();
                $disable($inputDomain, $inputPath, $inputName, $inputValue, $selectSameSite, $inputExpires, $buttonSave, $buttonCancel);
                refresh();

                if (cookie.expires) {
                    $inputExpires.title = new Date(cookie.expires).toISOString();
                } else {
                    $inputExpires.value = 'session';
                    $inputExpires.title = 'This is a session cookie, which does not have a predetermined expiry date.';
                }
            }

            function edit() {
                $rowCookie.classList.add('edit');
                $rowCookie.classList.remove('new');
                resetErrorMessage();
                disableButtons();

                refresh();
                $inputExpires.title = messageExpiresHint;

                $enable($inputValue, $selectSameSite, $inputExpires, $buttonSave, $buttonCancel);
                $inputValue.focus();
            }

            function newCookie() {
                $rowCookie.classList.add('new');
                $rowCookie.classList.remove('edit');
                resetEmptyMessage();
                resetErrorMessage();
                disableButtons();

                $inputExpires.title = messageExpiresHint;

                $enable($inputDomain, $inputPath, $inputName, $inputValue, $selectSameSite, $inputExpires, $buttonSave, $buttonCancel);
                $inputName.focus();
            }

            async function deleteCookie() {
                try {
                    await unsetCookie(cookie);
                } catch(error) {
                    messageError = error.toString();
                }

                // the polyfill does not support CookieStore change events, so refresh controller manually
                // also refresh manually after errors
                if (messageError !== null || !hasNativeCookieStore()) {
                    init();
                }
            }

            async function save() {
                try {
                    await setCookie({
                        domain: $inputDomain.value,
                        path: $inputPath.value,
                        name: $inputName.value,
                        value: $inputValue.value,
                        sameSite: $selectSameSite.value,
                        expires: $inputExpires.value,
                    });
                } catch(error) {
                    messageError = error.toString();
                }

                // the polyfill does not support CookieStore change events, so refresh controller manually
                // also refresh manually after errors
                if (messageError !== null || !hasNativeCookieStore()) {
                    init();
                }
            }

            function cancel() {
                if (isExistingCookie()) {
                    display();
                } else {
                    $remove($rowCookie);
                    resetEmptyMessage();
                    enableStandardButtons();
                }
            }

            function refresh() {
                $inputDomain.value = cookie.domain;
                $inputPath.value = cookie.path;
                $inputName.value = cookie.name;
                $inputValue.value = cookie.value;
                $checkboxSecure.checked = !!cookie.secure;
                $selectSameSite.value = cookie.sameSite;
                $inputExpires.value = cookie.expires;
            }

            function isExistingCookie() {
                return (typeof cookie == "object") && !(cookie instanceof Event);
            }
        }

        function disableButtons() {
            $disable(... $tableCookies.querySelectorAll('button'));
        }

        function enableStandardButtons() {
            $enable(... $tableCookies.querySelectorAll('button[name=new], button[name=edit], button[name=delete]'));
        }
    }
}



document.addEventListener('DOMContentLoaded', cookiesPage);
