document.addEventListener(
    'DOMContentLoaded',
    () => {
        const storageViewTemplate = document.getElementById('storageView').content;
        const storageViewEntryTemplate = document.getElementById('storageViewEntry').content;

        function remove(node) {
            if (node && node.parentNode) {
                node.parentNode.removeChild(node);
            }
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
                    const key = storage.key(i);
                    const item = storage.getItem(key);

                    const storageViewEntry = storageViewEntryTemplate.cloneNode(true).querySelector('tr');
                    storageViewEntry.querySelector('.index').textContent = i;
                    storageViewEntry.querySelector('.key').textContent = key;
                    storageViewEntry.querySelector('.item').textContent = item;

                    storageViewTable.insertAdjacentElement('beforeend', storageViewEntry);
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
