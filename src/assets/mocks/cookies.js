document.addEventListener(
    'DOMContentLoaded',
    () => {
        const $$cookies = document.getElementById('cookies').content;
        const $$cookie = document.getElementById('cookie').content;

        const $dataListCookieDomains = document.getElementById('cookieDomains');

        for (const domain of suggestCookieDomains()) {
            const $domainOption = document.createElement('option');
            $domainOption.value = domain;
            $dataListCookieDomains.insertAdjacentElement('beforeend', $domainOption);
        }

        var messageError = null;

        for (const $cookiesContainer of document.querySelectorAll('.cookies')) {
            cookiesController($cookiesContainer);
        }

        async function cookiesController($container) {

            const $tableCookies = $$cookies.cloneNode(true).querySelector('table.cookies');
            $container.insertAdjacentElement('beforeend', $tableCookies);

            const $rowMessageEmpty = $tableCookies.querySelector('tr.messageEmpty');
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

                if (messageError === null) {
                    $cellMessageError.textContent = '';
                } else {
                    $cellMessageError.textContent = messageError;
                    messageError = null;
                }

                const cookies = await window.cookieStore.getAll();
                if (cookies.length != 0) {
                    $tableCookies.classList.remove('empty');

                    cookies.sort( (c1, c2) => c1.name == c2.name ? 0 : (c1.name < c2.name ? -1 : 1 ) );
                    cookies.sort( (c1, c2) => c1.path == c2.path ? 0 : (c1.path < c2.path ? -1 : 1 ) );
                    cookies.sort( (c1, c2) => c1.domain == c2.domain ? 0 : (c1.domain < c2.domain ? -1 : 1 ) );

                    $remove($rowMessageEmpty);
                    for (const cookie of cookies) {
                        cookieController(cookie);
                    }
                } else {
                    $tableCookies.classList.add('empty');
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
                }

                function edit() {
                    $rowCookie.classList.add('edit');
                    $rowCookie.classList.remove('new');
                    disableButtons();
                    $enable($inputValue, $buttonSave, $buttonCancel);
                    $inputValue.focus();
                    refresh();
                }

                function newCookie() {
                    $rowCookie.classList.add('new');
                    $rowCookie.classList.remove('edit');
                    disableButtons();
                    $enable($inputDomain, $inputPath, $inputName, $inputValue, $selectSameSite, $inputExpires, $buttonSave, $buttonCancel);
                    $inputName.focus();
                }

                async function deleteCookie() {
                    await unsetCookie(cookie);

                    // the polyfill does not support CookieStore change events, so refresh controller manually
                    // also refresh manually after errors
                    if (messageError !== null || !hasNativeCookieStore()) {
                        init();
                    }
                }

                async function save() {
                    await setCookie({
                        domain: $inputDomain.value,
                        path: $inputPath.value,
                        name: $inputName.value,
                        value: $inputValue.value,
                        sameSite: $selectSameSite.value,
                        expires: $inputExpires.value,
                    });

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

        async function setCookie(options) {
            try {
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
            } catch(error) {
                messageError = error.toString();
            }
        }

        async function unsetCookie(options) {
            try {
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
            } catch (error) {
                messageError = error.toString();
            }
        }

        function hasNativeCookieStore() {
            // prototype of the polyfill would be [object Object] instead
            return Object.getPrototypeOf(window.cookieStore) == '[object CookieStore]';
        }

        function suggestCookieDomains() {
            const domains = [];
            const currentDomainLabels = location.hostname.split('.').filter((label) => label !== '');
            for (i = 0; i < currentDomainLabels.length; i++)
            {
                domains.push(currentDomainLabels.slice(i, currentDomainLabels.length).join('.'));
            }
            return domains;
        }

        function parseDate(date) {
            const tenYearsInMillis = 10 * 365 * 24 * 60 * 60 * 1000;
            if (typeof date == 'number') {
                if (date > tenYearsInMillis) {
                    return date;
                }
                return Date.now() + date;
            }
            if (typeof date == 'string') {
                const parsedDate = Date.parse(date);
                if (!Number.isNaN(parsedDate)) {
                    return parsedDate;
                }
                const numericDate = Number.parseInt(date);
                if (!Number.isNaN(numericDate)) {
                    return parseDate(numericDate);
                }
            }
            return null;
        }

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
    }
);
