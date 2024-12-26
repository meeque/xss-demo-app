document.addEventListener(
    'DOMContentLoaded',
    () => {
        const storageViewTemplate = document.getElementById('storageView').content;
        const storageViewEntryTemplate = document.getElementById('storageViewEntry').content;

        function storageViewController(containerElement, storage) {

            if (storage.length == 0) {
                containerElement.insertAdjacentText('beforeend', 'No items in this storage.');
                return;
            }

            const storageView = storageViewTemplate.cloneNode(true).querySelector('table');

            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                const item = storage.getItem(key);

                const storageViewEntry = storageViewEntryTemplate.cloneNode(true).querySelector('tr');
                storageViewEntry.querySelector('.index').textContent = i;
                storageViewEntry.querySelector('.key').textContent = key;
                storageViewEntry.querySelector('.item').textContent = item;

                storageView.insertAdjacentElement('beforeend', storageViewEntry);
            }
            
            containerElement.insertAdjacentElement('beforeend', storageView);
        }

        for (const localStorageViewContainer of document.querySelectorAll('.localStorage')) {
            storageViewController(localStorageViewContainer, window.localStorage);
        }
        for (const sessionStorageViewContainer of document.querySelectorAll('.sessionStorage')) {
            storageViewController(sessionStorageViewContainer, window.sessionStorage);
        }
    }
);
