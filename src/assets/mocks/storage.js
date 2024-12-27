document.addEventListener(
    'DOMContentLoaded',
    () => {
        const storageViewTemplate = document.getElementById('storageView').content;
        const storageViewEntryTemplate = document.getElementById('storageViewEntry').content;
        const storageViewEntryEditTemplate = document.getElementById('storageViewEntryEdit').content;
        const storageViewEntryNewTemplate = document.getElementById('storageViewEntryNew').content;

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
                    initStorageViews();
                }
            );

            containerElement.querySelector('tr.actions').insertAdjacentElement('beforebegin', storageViewEntry);
        }

        function storageViewEntryEditController(storageViewEntryElement, storage, index) {
            const key = storage.key(index)
            const item = storage.getItem(key);

            const storageViewEntryEdit = storageViewEntryEditTemplate.cloneNode(true).querySelector('tr');
            storageViewEntryEdit.querySelector('.index').textContent = index;
            storageViewEntryEdit.querySelector('.key').textContent = key;
            storageViewEntryEdit.querySelector('.item input').value = item;

            storageViewEntryEdit.querySelector('.actions button[name=save]').addEventListener(
                'click',
                () => {
                    storage.setItem(key, storageViewEntryEdit.querySelector('.item input').value);
                    initStorageViews();
                }
            );

            storageViewEntryEdit.querySelector('.actions button[name=cancel]').addEventListener(
                'click',
                () => {
                    initStorageViews();
                }
            );

            storageViewEntryElement.insertAdjacentElement('afterend', storageViewEntryEdit);
            remove(storageViewEntryElement);
        }

        function storageViewEntryNewController(containerElement, storage) {
            const storageViewEntryNew = storageViewEntryNewTemplate.cloneNode(true).querySelector('tr');

            storageViewEntryNew.querySelector('.actions button[name=save]').addEventListener(
                'click',
                () => {
                    storage.setItem(storageViewEntryNew.querySelector('.key input').value, storageViewEntryNew.querySelector('.item input').value);
                    initStorageViews();
                }
            );

            storageViewEntryNew.querySelector('.actions button[name=cancel]').addEventListener(
                'click',
                () => {
                    initStorageViews();
                }
            );

            containerElement.querySelector('tr.actions').insertAdjacentElement('beforebegin', storageViewEntryNew);
        }

        function storageViewController(containerElement, storage) {

            remove(containerElement.querySelector('div.storageView'));

            const storageView = storageViewTemplate.cloneNode(true).querySelector('div.storageView');
            const storageViewTable = storageView.querySelector('table');
            const storageViewMessageEmpty = storageView.querySelector('tr.messageEmpty');
            const storageViewButtonNew = storageView.querySelector('tr.actions button[name=new]');

            if (storage.length != 0) {
                remove(storageViewMessageEmpty);
                for (let i = 0; i < storage.length; i++) {
                    storageViewEntryController(storageViewTable, storage, i);
                }
            }

            storageViewButtonNew.addEventListener(
                'click',
                () => {
                    storageViewEntryNewController(storageViewTable, storage);
                }
            );

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
