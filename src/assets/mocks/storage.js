document.addEventListener(
    'DOMContentLoaded',
    () => {
        const storageViewTemplate = document.getElementById('storageView').content;
        const storageViewEntryTemplate = document.getElementById('storageViewEntry').content;
        const storageViewEntryEditTemplate = document.getElementById('storageViewEntryEdit').content;

        function remove(node) {
            if (node && node.parentNode) {
                node.parentNode.removeChild(node);
            }
        }

        function storageViewEntryController(containerElement, storage, index) {
            const key = storage.key(index)
            const item = storage.getItem(key);

            const storageViewEntry = storageViewEntryTemplate.cloneNode(true).querySelector('tr');
            storageViewEntry.querySelector('.index').textContent = index;
            storageViewEntry.querySelector('.key').textContent = key;
            storageViewEntry.querySelector('.item').textContent = item;

            storageViewEntry.querySelector('.actions button[name=edit]').addEventListener(
                'click',
                (event) => {
                    storageViewEntryEditController(storageViewEntry, storage, index);
                }
            );

            storageViewEntry.querySelector('.actions button[name=delete]').addEventListener(
                'click',
                () => {
                    storage.removeItem(key);
                    remove(storageViewEntry);
                }
            );

            containerElement.insertAdjacentElement('beforeend', storageViewEntry);
        }

        function storageViewEntryEditController(storageViewEntryElement, storage, index) {
            const key = storage.key(index)
            const item = storage.getItem(key);

            const storageViewEditEntry = storageViewEntryEditTemplate.cloneNode(true).querySelector('tr');
            storageViewEditEntry.querySelector('.index').textContent = index;
            storageViewEditEntry.querySelector('.key').textContent = key;
            storageViewEditEntry.querySelector('.item input').value = item;

            storageViewEntryElement.insertAdjacentElement('afterend', storageViewEditEntry);
            remove(storageViewEntryElement);

            storageViewEditEntry.querySelector('.actions button[name=save]').addEventListener(
                'click',
                () => {
                    storage.setItem(key, storageViewEditEntry.querySelector('.item input').value);
                    initStorageViews();
                }
            );

            storageViewEditEntry.querySelector('.actions button[name=cancel]').addEventListener(
                'click',
                () => {
                    initStorageViews();
                }
            );
        }

        function storageViewController(containerElement, storage) {

            remove(containerElement.querySelector('div.storageView'));

            const storageView = storageViewTemplate.cloneNode(true).querySelector('div.storageView');
            const storageViewTable = storageView.querySelector('table');
            const storageViewMessageEmpty = storageView.querySelector('p.messageEmpty');

            if (storage.length == 0) {

                remove(storageViewTable);

            } else {

                remove(storageViewMessageEmpty);

                for (let i = 0; i < storage.length; i++) {
                    storageViewEntryController(storageViewTable, storage, i);
                }

            }

            containerElement.insertAdjacentElement('beforeend', storageView);
        }

        function initStorageViews() {
            for (const localStorageViewContainer of document.querySelectorAll('.localStorage')) {
                storageViewController(localStorageViewContainer, window.localStorage);
            }
            for (const sessionStorageViewContainer of document.querySelectorAll('.sessionStorage')) {
                storageViewController(sessionStorageViewContainer, window.sessionStorage);
            }
        }

        initStorageViews();

        window.addEventListener(
            'storage',
            (event) => {
                initStorageViews();
            }
        );
    }
);
