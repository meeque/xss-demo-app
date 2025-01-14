document.addEventListener(
    'DOMContentLoaded',
    () => {
        const $$storage = document.getElementById('storage').content;
        const $$storageEntry = document.getElementById('storageEntry').content;

        for (const localStorageViewContainer of document.querySelectorAll('.localStorage')) {
            storageController(localStorageViewContainer, window.localStorage);
        }
        for (const sessionStorageViewContainer of document.querySelectorAll('.sessionStorage')) {
            storageController(sessionStorageViewContainer, window.sessionStorage);
        }

        function storageController($container, storage) {

            const $tableStorage = $$storage.cloneNode(true).querySelector('table.storage');
            $container.insertAdjacentElement('beforeend', $tableStorage);

            const $rowActions = $tableStorage.querySelector('tr.actions');
            const $buttonNew = $rowActions.querySelector('button[name=new]');

            init();

            $buttonNew.addEventListener('click', entryController);

            window.addEventListener(
                'storage',
                (event) => {
                    if (event.storageArea === storage) {
                        init();
                    }
                }
            );

            function init() {
                for ( const $entry of $tableStorage.querySelectorAll('tr.entry')) {
                    $remove($entry);
                }
                if (storage.length != 0) {
                    for (let i = 0; i < storage.length; i++) {
                        entryController(i);
                    }
                    $tableStorage.classList.remove('empty');
                } else {
                    $tableStorage.classList.add('empty');
                }
            }

            function entryController(index) {

                const $entry = $$storageEntry.cloneNode(true).querySelector('tr');
                $rowActions.insertAdjacentElement('beforebegin', $entry);

                const $inputIndex = $entry.querySelector('.index input');
                const $inputKey = $entry.querySelector('.key input');
                const $inputItem = $entry.querySelector('.item input');
                const $cellActions = $entry.querySelector('.actions');
                const $buttonEdit = $cellActions.querySelector('button[name=edit]');
                const $buttonDelete = $cellActions.querySelector('button[name=delete]');
                const $buttonSave = $cellActions.querySelector('button[name=save]');
                const $buttonCancel = $cellActions.querySelector('button[name=cancel]');

                var key = null;
                var item = null;

                if (isExistingEntry()) {
                    display();
                } else {
                    newEntry();
                }

                $buttonEdit.addEventListener('click', edit);
                $buttonDelete.addEventListener('click', deleteEntry);
                $buttonSave.addEventListener('click', save);
                $buttonCancel.addEventListener('click', cancel);

                function display() {
                    $entry.classList.remove('new', 'edit');
                    enableStandardButtons();
                    $disable($inputKey, $inputItem, $buttonSave, $buttonCancel);
                    refresh();
                }

                function edit() {
                    $entry.classList.add('edit');
                    $entry.classList.remove('new');
                    disableButtons();
                    $enable($inputItem, $buttonSave, $buttonCancel);
                    refresh();
                }

                function newEntry() {
                    $entry.classList.add('new');
                    $entry.classList.remove('edit');
                    disableButtons();
                    $enable($inputKey, $inputItem, $buttonSave, $buttonCancel);
                }

                function deleteEntry() {
                    storage.removeItem(key);
                    init();
                }

                function save() {
                    storage.setItem($inputKey.value, $inputItem.value);
                    if (isExistingEntry()) {
                        display();
                    } else {
                        init($container, storage);
                    }
                }

                function cancel() {
                    if (isExistingEntry()) {
                        display();
                    } else {
                        $remove($entry);
                        enableStandardButtons();
                    }
                }

                function refresh() {
                    key = storage.key(index);
                    item = storage.getItem(key);

                    $inputIndex.value = index;
                    $inputKey.value = key;
                    $inputItem.value = item;
                }

                function isExistingEntry() {
                    return typeof index == "number";
                }
            }

            function disableButtons() {
                $disable(... $tableStorage.querySelectorAll('button'));
            }

            function enableStandardButtons() {
                $enable(... $tableStorage.querySelectorAll('button[name=new], button[name=edit], button[name=delete]'));
            }
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

        function $remove($node) {
            if ($node && $node.parentNode) {
                $node.parentNode.removeChild($node);
            }
        }
    }
);
