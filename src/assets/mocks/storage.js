document.addEventListener(
    'DOMContentLoaded',
    () => {
        const $$storage = document.getElementById('storage').content;
        const $$storageNewEntry = document.getElementById('storageNewEntry').content;
        const $$storageEntryDisplay = document.getElementById('storageEntryDisplay').content;
        const $$storageEntryEdit = document.getElementById('storageEntryEdit').content;

        for (const localStorageViewContainer of document.querySelectorAll('.localStorage')) {
            storageController(localStorageViewContainer, window.localStorage);
        }
        for (const sessionStorageViewContainer of document.querySelectorAll('.sessionStorage')) {
            storageController(sessionStorageViewContainer, window.sessionStorage);
        }

        function storageController($container, storage) {

            $remove($container.querySelector('table.storage'));

            const $tableStorage = $$storage.cloneNode(true).querySelector('table.storage');
            const $rowMessageEmpty = $tableStorage.querySelector('tr.messageEmpty');
            const $rowActions = $tableStorage.querySelector('tr.actions');
            const $buttonNew = $rowActions.querySelector('button[name=new]');

            if (storage.length != 0) {
                $remove($rowMessageEmpty);
                for (let i = 0; i < storage.length; i++) {
                    entryController(i);
                }
            }

            $buttonNew.addEventListener(
                'click',
                () => {
                    newEntryController();
                }
            );

            window.addEventListener(
                'storage',
                (event) => {
                    if (event.storageArea === storage) {
                        storageController($container, storage);
                    }
                }
            );

            $container.insertAdjacentElement('beforeend', $tableStorage);

            function newEntryController() {
                disableButtons();

                const $rowNewEntry = $$storageNewEntry.cloneNode(true).querySelector('tr');
                const $inputKey = $rowNewEntry.querySelector('.key input');
                const $inputValue = $rowNewEntry.querySelector('.item input');
                const $cellActions = $rowNewEntry.querySelector('.actions')
                const $buttonSave = $cellActions.querySelector('button[name=save]');
                const $buttonCancel = $cellActions.querySelector('button[name=cancel]');

                $buttonSave.addEventListener(
                    'click',
                    () => {
                        storage.setItem($inputKey.value, $inputValue.value);
                        storageController($container, storage);
                    }
                );

                $buttonCancel.addEventListener(
                    'click',
                    () => {
                        storageController($container, storage);
                    }
                );

                $rowActions.insertAdjacentElement('beforebegin', $rowNewEntry);
            }

            function entryController(index) {
                const key = storage.key(index)
                const item = storage.getItem(key);

                const $rowEntryDisplay = $$storageEntryDisplay.cloneNode(true).querySelector('tr');
                const $cellIndex = $rowEntryDisplay.querySelector('.index');
                const $cellKey = $rowEntryDisplay.querySelector('.key');
                const $cellItem = $rowEntryDisplay.querySelector('.item');
                const $cellActions = $rowEntryDisplay.querySelector('.actions');
                const $buttonEdit = $cellActions.querySelector('button[name=edit]');
                const $buttonDelete = $cellActions.querySelector('button[name=delete]');

                $cellIndex.textContent = index;
                $cellKey.textContent = key;
                $cellItem.textContent = item;

                $buttonEdit.addEventListener(
                    'click',
                    (event) => {
                        editController();
                    }
                );

                $buttonDelete.addEventListener(
                    'click',
                    () => {
                        storage.removeItem(key);
                        storageController($container, storage);
                    }
                );

                $rowActions.insertAdjacentElement('beforebegin', $rowEntryDisplay);

                function editController() {
                    disableButtons();

                    const $rowEntryEdit = $$storageEntryEdit.cloneNode(true).querySelector('tr');
                    const $cellIndex = $rowEntryEdit.querySelector('.index');
                    const $cellKey = $rowEntryEdit.querySelector('.key');
                    const $inputItem = $rowEntryEdit.querySelector('.item input');
                    const $cellActions = $rowEntryEdit.querySelector('.actions');
                    const $buttonSave = $cellActions.querySelector('button[name=save]');
                    const $buttonCancel = $cellActions.querySelector('button[name=cancel]');

                    $cellIndex.textContent = index;
                    $cellKey.textContent = key;
                    $inputItem.value = item;

                    $buttonSave.addEventListener(
                        'click',
                        () => {
                            storage.setItem(key, $inputItem.value);
                            storageController($container, storage);
                        }
                    );

                    $buttonCancel.addEventListener(
                        'click',
                        () => {
                            storageController($container, storage);
                        }
                    );

                    $rowEntryDisplay.insertAdjacentElement('afterend', $rowEntryEdit);
                    $remove($rowEntryDisplay);
                }
            }

            function disableButtons() {
                for ($button of $tableStorage.querySelectorAll('button')) {
                    $button.disabled = true;
                }
            }
        }

        function $remove(node) {
            if (node && node.parentNode) {
                node.parentNode.removeChild(node);
            }
        }
    }
);
