let parentWindow = null;
let parentXssError = null;
let openerWindow = null;
let openerXssError = null;



// the gist:

try {
    parentWindow = window.parent != window ? window.parent : null;
    parentWindow.xss();
} catch (err) {
    parentXssError = err;
}

try {
    openerWindow = window.opener;
    openerWindow.xss();
} catch (err) {
    openerXssError = err;
}



// diagnostics:

function targetDiagnostics($status, target, xssError) {

    if (xssError !== null) {
        $status.querySelector('code.error').textContent = xssError;
        $status.classList.add('xss-error');
    } else {
        $status.classList.add('xss-success');
    }

    if (target === null) {
        $status.classList.add('has-no-target');
        return;
    } else {
        try {
        $status.querySelector('.target-origin code').textContent = target?.origin;
        $status.querySelector('.target-effective-domain code').textContent = target?.document?.domain;
        $status.classList.add('has-target');
        } catch (err) {
            console.log('Failed to access origin or effective domain of target: ' + err);
        }
    }

    let targetXss = null;
    try {
        targetXss = target.xss;
    } catch (err) {
        console.log('Failed to access xss functions in target: ' + err);
    }

    if (targetXss == null) {
        $status.classList.add('xss-unavailable');
        return;
    } else {
        $status.classList.add('xss-available');
    }

    if (typeof target.xss !== 'function') {
        $status.classList.add('xss-not-invoked');
        return;
    } else {
        $status.classList.add('xss-invoked');
    }
}

document.addEventListener(
    'DOMContentLoaded',
    () => {
        pageStatus(
            document.querySelector('.meta.status')
        );

        targetDiagnostics(
            document.querySelector('li.target.parent ul.status'),
            parentWindow,
            parentXssError
        );

        targetDiagnostics(
            document.querySelector('li.target.opener ul.status'),
            openerWindow,
            openerXssError
        );
    }
);
