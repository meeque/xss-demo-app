document.addEventListener(
    'DOMContentLoaded',
    () => {
        const $$cookies = document.getElementById('cookies').content;
        const $$cookiesNew = document.getElementById('cookiesNew').content;
        const $$cookieDisplay = document.getElementById('cookieDisplay').content;
        const $$cookiesEdit = document.getElementById('cookieEdit').content;

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
                    entryController(cookie);
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

            function entryController(cookie) {

                const $rowEntryDisplay = $$cookieDisplay.cloneNode(true).querySelector('tr');
                const $cellDomain = $rowEntryDisplay.querySelector('.domain');
                const $cellPath = $rowEntryDisplay.querySelector('.path');
                const $cellName = $rowEntryDisplay.querySelector('.name');
                const $cellValue = $rowEntryDisplay.querySelector('.value');
                const $cellActions = $rowEntryDisplay.querySelector('.actions');
                const $buttonEdit = $cellActions.querySelector('button[name=edit]');
                const $buttonDelete = $cellActions.querySelector('button[name=delete]');

                $cellDomain.textContent = cookie.domain;
                $cellPath.textContent = cookie.path;
                $cellName.textContent = cookie.name;
                $cellValue.textContent = cookie.value;

                $buttonEdit.addEventListener(
                    'click',
                    (event) => {
                        editController($rowEntryDisplay, cookie);
                    }
                );

                $buttonDelete.addEventListener(
                    'click',
                    async () => {
                        await window.cookieStore.delete(cookie.name);
                        cookiesController($container);
                    }
                );

                $rowActions.insertAdjacentElement('beforebegin', $rowEntryDisplay);

                function editController() {
                    disableButtons();

                    const $rowEntryEdit = $$cookiesEdit.cloneNode(true).querySelector('tr');
                    const $cellDomain = $rowEntryEdit.querySelector('.domain');
                    const $cellPath = $rowEntryEdit.querySelector('.path');
                    const $cellName = $rowEntryEdit.querySelector('.name');
                    const $inputValue = $rowEntryEdit.querySelector('.value input');
                    const $cellActions = $rowEntryEdit.querySelector('.actions');
                    const $buttonSave = $cellActions.querySelector('button[name=save]');
                    const $buttonCancel = $cellActions.querySelector('button[name=cancel]');

                    $cellDomain.textContent = cookie.domain;
                    $cellPath.textContent = cookie.path;
                    $cellName.textContent = cookie.name;
                    $inputValue.value = cookie.value;

                    $buttonSave.addEventListener(
                        'click',
                        async () => {
                            await setCookie({
                                domain: $cellDomain.textContent,
                                path: $cellPath.textContent,
                                name: $cellName.textContent,
                                value: $inputValue.value,
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

                    $rowEntryDisplay.insertAdjacentElement('afterend', $rowEntryEdit);
                    $remove($rowEntryDisplay);
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
                    path: options.path || null,
                    name: options.name || '',
                    value: options.value || '',
                });
            } else {
                // the polyfill only supports name/value pairs, now options objects
                return await window.cookieStore.set(
                    options.name || '',
                    options.value || '',
                );
            }

        }

        function hasNativeCookieStore() {
            // prototype of the polyfill would be [object Object] instead
            return Object.getPrototypeOf(window.cookieStore) === '[object CookieStore]'
        }

        function $remove(node) {
            if (node && node.parentNode) {
                node.parentNode.removeChild(node);
            }
        }
    }
);
