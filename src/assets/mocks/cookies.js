document.addEventListener(
    'DOMContentLoaded',
    () => {
        const $$cookies = document.getElementById('cookies').content;
        const $$cookiesNew = document.getElementById('cookiesNew').content;
        const $$cookieDisplay = document.getElementById('cookieDisplay').content;
        const $$cookieEdit = document.getElementById('cookieEdit').content;

        for (const $cookiesContainer of document.querySelectorAll('.cookies')) {
            cookiesController($cookiesContainer);
        }

        async function cookiesController($container) {

            $remove($container.querySelector('table.cookies'));

            const $tableCookies = $$cookies.cloneNode(true).querySelector('table.cookies');
            const $rowMessageEmpty = $tableCookies.querySelector('tr.messageEmpty');
            const $rowActions = $tableCookies.querySelector('tr.actions');
            const $buttonNew = $rowActions.querySelector('button[name=new]');

            const cookies = await window.cookieStore.getAll();
            if (window.cookies.length != 0) {
                $remove($rowMessageEmpty);
                for (const cookie of cookies) {
                    cookieDisplayController(cookie);
                }
            }

            $buttonNew.addEventListener(
                'click',
                () => {
                    cookiesNewController();
                }
            );

            $container.insertAdjacentElement('beforeend', $tableCookies);

            function cookiesNewController() {
                disableButtons();

                const $rowCookiesNew = $$cookiesNew.cloneNode(true).querySelector('tr');
                const $inputDomain = $rowCookiesNew.querySelector('.domain input');
                const $inputPath = $rowCookiesNew.querySelector('.path input');
                const $inputName = $rowCookiesNew.querySelector('.name input');
                const $inputValue = $rowCookiesNew.querySelector('.value input');
                const $checkboxSecure = $rowCookiesNew.querySelector('.secure input');
                const $selectSameSite = $rowCookiesNew.querySelector('.sameSite select');
                const $inputExpires = $rowCookiesNew.querySelector('.expires input');
                const $cellActions = $rowCookiesNew.querySelector('.actions')
                const $buttonSave = $cellActions.querySelector('button[name=save]');
                const $buttonCancel = $cellActions.querySelector('button[name=cancel]');

                $buttonSave.addEventListener(
                    'click',
                    async () => {
                        await setCookie({
                            domain: $inputDomain.value,
                            path: $inputPath.value,
                            name: $inputName.value,
                            value: $inputValue.value,
                            secure: $checkboxSecure.value,
                            sameSite: $selectSameSite.value,
                            expires: $inputExpires.value,
                        });
                        cookiesController($container);
                    }
                );

                $buttonCancel.addEventListener(
                    'click',
                    () => {
                        cookiesController($container);
                    }
                );

                $rowActions.insertAdjacentElement('beforebegin', $rowCookiesNew);
            }

            function cookieDisplayController(cookie) {

                const $rowCookieDisplay = $$cookieDisplay.cloneNode(true).querySelector('tr');
                const $cellDomain = $rowCookieDisplay.querySelector('.domain');
                const $cellPath = $rowCookieDisplay.querySelector('.path');
                const $cellName = $rowCookieDisplay.querySelector('.name');
                const $cellValue = $rowCookieDisplay.querySelector('.value');
                const $cellSecure = $rowCookieDisplay.querySelector('.secure');
                const $cellSameSite = $rowCookieDisplay.querySelector('.sameSite');
                const $cellExpires = $rowCookieDisplay.querySelector('.expires');
                const $cellActions = $rowCookieDisplay.querySelector('.actions');
                const $buttonEdit = $cellActions.querySelector('button[name=edit]');
                const $buttonDelete = $cellActions.querySelector('button[name=delete]');

                $cellDomain.textContent = cookie.domain;
                $cellPath.textContent = cookie.path;
                $cellName.textContent = cookie.name;
                $cellValue.textContent = cookie.value;
                $cellSecure.textContent = displayOptionalBoolean(cookie.secure);
                $cellSameSite.textContent = cookie.sameSite;
                if (cookie.expires) {
                    $cellExpires.textContent = cookie.expires;
                    $cellExpires.setAttribute('title', new Date(cookie.expires).toISOString());
                } else {
                    $cellExpires.textContent = 'session';
                    $cellExpires.setAttribute('title', 'This is a session cookie, which does not have a predetermined expiry date.');
                }

                $buttonEdit.addEventListener(
                    'click',
                    (event) => {
                        cookieEditController($rowCookieDisplay, cookie);
                    }
                );

                $buttonDelete.addEventListener(
                    'click',
                    async () => {
                        await deleteCookie(cookie);
                        cookiesController($container);
                    }
                );

                $rowActions.insertAdjacentElement('beforebegin', $rowCookieDisplay);

                function cookieEditController() {
                    disableButtons();

                    const $rowEntryEdit = $$cookieEdit.cloneNode(true).querySelector('tr');
                    const $cellDomain = $rowEntryEdit.querySelector('.domain');
                    const $cellPath = $rowEntryEdit.querySelector('.path');
                    const $cellName = $rowEntryEdit.querySelector('.name');
                    const $inputValue = $rowEntryEdit.querySelector('.value input');
                    const $checkboxSecure = $rowEntryEdit.querySelector('.secure input');
                    const $selectSameSite = $rowEntryEdit.querySelector('.sameSite select');
                    const $inputExpires = $rowEntryEdit.querySelector('.expires input');
                    const $cellActions = $rowEntryEdit.querySelector('.actions');
                    const $buttonSave = $cellActions.querySelector('button[name=save]');
                    const $buttonCancel = $cellActions.querySelector('button[name=cancel]');

                    $cellDomain.textContent = cookie.domain;
                    $cellPath.textContent = cookie.path;
                    $cellName.textContent = cookie.name;
                    $inputValue.value = cookie.value;
                    $checkboxSecure.value = cookie.secure;
                    $selectSameSite.value = cookie.sameSite;
                    $inputExpires.value = cookie.expires;

                    $buttonSave.addEventListener(
                        'click',
                        async () => {
                            await setCookie({
                                domain: $cellDomain.textContent,
                                path: $cellPath.textContent,
                                name: $cellName.textContent,
                                value: $inputValue.value,
                                secure: $checkboxSecure.value,
                                sameSite: $selectSameSite.value,
                                expires: $inputExpires.value,
                            });
                            cookiesController($container);
                        }
                    );

                    $buttonCancel.addEventListener(
                        'click',
                        () => {
                            cookiesController($container);
                        }
                    );

                    $rowCookieDisplay.insertAdjacentElement('afterend', $rowEntryEdit);
                    $remove($rowCookieDisplay);
                }
            }

            function disableButtons() {
                for ($button of $tableCookies.querySelectorAll('button')) {
                    $button.disabled = true;
                }
            }
        }

        async function setCookie(options) {
            if (hasNativeCookieStore()) {
                return await window.cookieStore.set({
                    domain: options.domain || null,
                    path: options.path || '/',
                    name: options.name || '',
                    value: options.value || '',
                    secure: options.secure || null,
                    sameSite: options.sameSite || null,
                    expires: parseDate(options.expires),
                });
            } else {
                // the polyfill only supports name/value pairs, no options objects
                return await window.cookieStore.set(
                    options.name || '',
                    options.value || '',
                );
            }
        }

        async function deleteCookie(options) {
            if (hasNativeCookieStore()) {
                return await window.cookieStore.delete({
                    domain: options.domain || null,
                    path: options.path || '/',
                    name: options.name || '',
                });
            } else {
                // the polyfill only supports cookie name, no options objects
                return await window.cookieStore.delete(options.name || '');
            }
        }

        function hasNativeCookieStore() {
            // prototype of the polyfill would be [object Object] instead
            return Object.getPrototypeOf(window.cookieStore) == '[object CookieStore]';
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
                const numericDate = Number.parseInt(date);
                if (!Number.isNaN(numericDate)) {
                    return parseDate(numericDate);
                }
                const parsedDate = Date.parse(date);
                if (!Number.isNaN(parsedDate)) {
                    return parsedDate;
                }
            }
            return null;
        }

        function displayOptionalBoolean(value) {
            return (value === true) ? '✔' : (value === false) ? '⤫' : '';
        }

        function $remove(node) {
            if (node && node.parentNode) {
                node.parentNode.removeChild(node);
            }
        }
    }
);
